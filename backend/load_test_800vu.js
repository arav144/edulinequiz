import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ── Custom Performance & Concurrency Metrics ─────────────────────────────────
const loginDuration = new Trend('login_duration', true);
const homeScreenDuration = new Trend('home_screen_duration', true);
const quizStartDuration = new Trend('quiz_start_duration', true);
const quizSubmitDuration = new Trend('quiz_submit_duration', true);
const errorRate = new Rate('custom_error_rate');

const successfulLogins = new Counter('successful_logins');
const successfulPageLoads = new Counter('successful_page_loads');
const successfulQuizStarts = new Counter('successful_quiz_starts');
const successfulSubmissions = new Counter('successful_submissions');

// ── Target Configuration & Safety Guard ──────────────────────────────────────
// Load tests must NEVER run against production. Use a dedicated test cluster or localhost.
const BASE_URL = __ENV.K6_TARGET_URL || 'http://localhost:5000';
const ALLOWED_TARGET = __ENV.ALLOWED_TARGET || '';
const TARGET_QUIZ_ID = __ENV.TARGET_QUIZ_ID || '';

if (BASE_URL.includes('edulinepublishers.com')) {
  throw new Error(`SAFETY BLOCK: Load testing directly against production (${BASE_URL}) is prohibited.`);
}

if (BASE_URL.includes('vercel.app')) {
  if (!ALLOWED_TARGET || BASE_URL !== ALLOWED_TARGET) {
    throw new Error(
      `SAFETY BLOCK: Target ${BASE_URL} is a Vercel deployment. To prevent accidental overload, ` +
      `you must explicitly set ALLOWED_TARGET="${BASE_URL}" to authorize load testing this test cluster.`
    );
  }
}

// ── Staged Ramp Options (100 -> 400 -> 800 VUs) ──────────────────────────────
export const options = {
  scenarios: {
    peak_school_concurrency: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 100 }, // Phase 1: Ramp to 100 VUs
        { duration: '30s', target: 400 }, // Phase 2: Ramp to 400 VUs
        { duration: '45s', target: 800 }, // Phase 3: Ramp to 800 VUs
        { duration: '60s', target: 800 }, // Phase 4: Sustained peak load at 800 VUs
        { duration: '20s', target: 0 },   // Phase 5: Graceful ramp-down
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    // 1. Overall HTTP failure rate strictly under 1%
    'http_req_failed': ['rate<0.01'],
    // 2. 95% of all read requests complete within 2s
    'http_req_duration': ['p(95)<2000'],
    // 3. 95% of logins complete within 2s
    'login_duration': ['p(95)<2000'],
    // 4. 95% of submissions complete within 2.5s
    'quiz_submit_duration': ['p(95)<2500'],
    // 5. Custom error rate
    'custom_error_rate': ['rate<0.01'],
  },
};

export default function () {
  const vuId = __VU;
  const iteration = __ITER;

  // Use test environment student pool (seeded via seed_loadtest_users.js in test cluster)
  const studentEmail = `loadtest_student_${((vuId - 1) % 800) + 1}@edulinequiz.test`;
  const pin = '1234';

  const commonHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 1: Student Login (Measures bcrypt comparison + 1 DB read)
  // ───────────────────────────────────────────────────────────────────────────
  const loginPayload = JSON.stringify({
    email: studentEmail,
    pin: pin,
  });

  const loginStart = Date.now();
  const loginRes = http.post(`${BASE_URL}/api/auth/student-login`, loginPayload, {
    headers: commonHeaders,
    tags: { name: 'StudentLogin' },
  });
  loginDuration.add(Date.now() - loginStart);

  let token = null;
  let studentData = null;
  const loginSuccess = check(loginRes, {
    'login status is 200 or 404/429 (handled gracefully)': (r) =>
      r.status === 200 || r.status === 404 || r.status === 429,
  });

  if (!loginSuccess) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  if (loginRes.status === 200) {
    try {
      const data = JSON.parse(loginRes.body);
      token = data.token;
      studentData = data.student;
      successfulLogins.add(1);
    } catch (e) {}
  }

  // Realistic human delay before loading student portal dashboard
  sleep(0.5 + Math.random() * 0.5);

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 2: Home Screen Data Loading (Read-Heavy In-Memory Cached Endpoints)
  // ───────────────────────────────────────────────────────────────────────────
  const authHeaders = {
    ...commonHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const homeStart = Date.now();
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/theme`, null, { headers: authHeaders, tags: { name: 'GetTheme' } }],
    ['GET', `${BASE_URL}/api/subjects`, null, { headers: authHeaders, tags: { name: 'GetSubjects' } }],
    ['GET', `${BASE_URL}/api/classes`, null, { headers: authHeaders, tags: { name: 'GetClasses' } }],
    ['GET', `${BASE_URL}/api/quizzes/available`, null, { headers: authHeaders, tags: { name: 'GetAvailableQuizzes' } }],
  ]);
  homeScreenDuration.add(Date.now() - homeStart);

  let activeQuizId = TARGET_QUIZ_ID;
  for (let i = 0; i < responses.length; i++) {
    const res = responses[i];
    const isOk = check(res, {
      'read endpoint returned 200 or 304': (r) => r.status === 200 || r.status === 304,
    });
    if (!isOk) {
      errorRate.add(1);
    } else {
      errorRate.add(0);
      successfulPageLoads.add(1);
      if (i === 3 && !activeQuizId && res.status === 200) {
        try {
          const body = JSON.parse(res.body);
          if (body.quizzes && body.quizzes.length > 0) {
            activeQuizId = body.quizzes[0]._id;
          }
        } catch (e) {}
      }
    }
  }

  if (!activeQuizId) {
    // If no active quiz found, sleep and finish iteration
    sleep(1);
    return;
  }

  // Reading instructions / thinking pause (1 - 2s)
  sleep(1 + Math.random());

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 3: Quiz Start (Fetches questions without answer keys, cached in memory)
  // ───────────────────────────────────────────────────────────────────────────
  const startReqTime = Date.now();
  const startRes = http.get(`${BASE_URL}/api/quizzes/${activeQuizId}/start`, {
    headers: authHeaders,
    tags: { name: 'StartQuiz' },
  });
  quizStartDuration.add(Date.now() - startReqTime);

  let questions = [];
  const startSuccess = check(startRes, {
    'start quiz returned 200 or 403 (already attempted)': (r) =>
      r.status === 200 || r.status === 403,
  });

  if (startRes.status === 200) {
    successfulQuizStarts.add(1);
    try {
      const data = JSON.parse(startRes.body);
      questions = data.questions || [];
    } catch (e) {}
  } else if (startRes.status === 403) {
    // Student already attempted this quiz on test cluster
    sleep(1);
    return;
  } else {
    errorRate.add(1);
    return;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 4: Answer Simulation & 0 - 40s Random Jitter Window
  // ───────────────────────────────────────────────────────────────────────────
  const simulatedAnswers = {};
  const optionsKeys = ['A', 'B', 'C', 'D'];
  for (const q of questions) {
    const randomOption = optionsKeys[Math.floor(Math.random() * optionsKeys.length)];
    simulatedAnswers[q._id] = randomOption;
  }

  // Record client timestamp at the instant exam countdown completes
  const clientExpiredAt = new Date().toISOString();

  // 0 - 40 seconds jitter to disperse submissions across a smooth window
  const jitterWaitSeconds = Math.random() * 40;
  sleep(jitterWaitSeconds);

  // ───────────────────────────────────────────────────────────────────────────
  // STEP 5: Submit Quiz Attempt (Single atomic DB write + concurrency queue)
  // ───────────────────────────────────────────────────────────────────────────
  const submitPayload = JSON.stringify({
    studentIdentifier: studentData?.studentIdentifier || `STU${vuId}`,
    name: studentData?.name || `Loadtest Student ${vuId}`,
    className: studentData?.className || 'Class 4',
    schoolName: studentData?.schoolName || 'Test School',
    answers: simulatedAnswers,
    clientExpiredAt: clientExpiredAt,
  });

  const submitStart = Date.now();
  const submitRes = http.post(`${BASE_URL}/api/quizzes/${activeQuizId}/attempt`, submitPayload, {
    headers: authHeaders,
    tags: { name: 'SubmitQuizAttempt' },
  });
  quizSubmitDuration.add(Date.now() - submitStart);

  const submitOk = check(submitRes, {
    'submit status is 201 created or idempotent 200/403': (r) =>
      r.status === 201 || r.status === 200 || r.status === 403,
  });

  if (submitOk) {
    successfulSubmissions.add(1);
    errorRate.add(0);
  } else {
    errorRate.add(1);
  }

  // Think time after submitting before VU terminates or restarts
  sleep(1);
}
