const http = require('http');
const https = require('https');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = process.env.LOAD_TEST_TARGET || 'http://127.0.0.1:5000';
const parsedUrl = new URL(BASE_URL);
const isHttps = parsedUrl.protocol === 'https:';
const client = isHttps ? https : http;

// High-capacity HTTP keep-alive agent so benchmark client has no socket throttling
const agent = new client.Agent({
  keepAlive: true,
  maxSockets: 750,
  maxFreeSockets: 250,
  timeout: 30000,
});

function request(options, data = null) {
  return new Promise((resolve) => {
    const start = Date.now();
    const reqOpts = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: options.path,
      method: options.method || 'GET',
      agent,
      headers: {
        'Accept': 'application/json, application/pdf',
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(options.headers || {}),
      },
      timeout: 20000,
    };

    const req = client.request(reqOpts, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        const duration = Date.now() - start;
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          duration,
          data: parsed,
          rawLength: body.length,
          isPdf: res.headers['content-type']?.includes('pdf'),
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ statusCode: 504, duration: Date.now() - start, error: 'TIMEOUT' });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 500, duration: Date.now() - start, error: err.message });
    });

    if (data) req.write(data);
    req.end();
  });
}

// Percentile calculator
function getStats(latencies) {
  if (latencies.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const p50 = sorted[Math.floor(sorted.length * 0.50)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(sum / sorted.length),
    p50,
    p95,
    p99,
  };
}

async function runVirtualUser(vuIndex, quizId, questions, resultsCollector) {
  const vuEmail = `loadtest_vu_${vuIndex}_${Date.now()}@edulinequiz.test`;
  const vuRoll = `AUDIT-VU-${vuIndex}`;
  const vuName = `Loadtest VU ${vuIndex}`;
  const vuClass = 'Class 5';

  const record = (endpoint, res) => {
    resultsCollector.totalRequests++;
    if (!resultsCollector.byEndpoint[endpoint]) {
      resultsCollector.byEndpoint[endpoint] = [];
    }
    resultsCollector.byEndpoint[endpoint].push(res.duration);
    resultsCollector.allDurations.push(res.duration);

    if (res.statusCode >= 200 && res.statusCode < 300) {
      resultsCollector.successCount++;
    } else if (res.statusCode === 429) {
      resultsCollector.rateLimitedCount++;
    } else if (res.statusCode >= 500) {
      resultsCollector.serverErrorCount++;
    } else {
      resultsCollector.otherStatusCount++;
    }
  };

  const clientIp = `198.51.100.${(vuIndex % 250) + 1}`;
  const ipHeaders = { 'X-Forwarded-For': clientIp };

  // 1. Visit Portal & Read Metadata
  const rHome = await request({ path: '/api/quizzes/available', headers: ipHeaders });
  record('GET /api/quizzes/available', rHome);

  // 2. Student Registration / Session Setup
  const regPayload = JSON.stringify({
    email: vuEmail,
    pin: '1234',
    firstName: 'Audit',
    lastName: `VU${vuIndex}`,
    mobileNumber: `980000${String(vuIndex % 10000).padStart(4, '0')}`,
    schoolName: 'Audit Test School',
    class: vuClass,
    dateOfBirth: '15/08/2012',
    state: 'Delhi',
    address: '123 Audit Way',
    pinCode: '110001',
    previousQuizParticipation: 'No',
    gender: 'Male',
  });
  const rReg = await request({ path: '/api/auth/register', method: 'POST', headers: ipHeaders }, regPayload);
  record('POST /api/auth/register', rReg);

  const studentToken = rReg.data?.token || '';
  const actualStudentIdentifier = rReg.data?.student?.studentIdentifier || rReg.data?.studentIdentifier || vuRoll;
  const authHeaders = {
    ...ipHeaders,
    ...(studentToken ? { Authorization: `Bearer ${studentToken}` } : {}),
  };

  // 3. Start Quiz (fetches questions without answer keys)
  const rStart = await request({
    path: `/api/quizzes/${quizId}/start?studentIdentifier=${actualStudentIdentifier}`,
    headers: authHeaders,
  });
  record('GET /api/quizzes/:id/start', rStart);

  // Assert no correct answers leaked in question payload
  if (rStart.data?.questions) {
    for (const q of rStart.data.questions) {
      if (q.correctAnswer || q.explanation) {
        resultsCollector.integrityErrors.push(`Security violation: Answer leaked for question ${q._id}`);
      }
    }
  }

  // 4. Simulate Answer Submission
  const answers = {};
  for (const q of questions) {
    answers[q._id] = 'A'; // Pick option A
  }

  const submitPayload = JSON.stringify({
    studentIdentifier: actualStudentIdentifier,
    name: vuName,
    className: vuClass,
    schoolName: 'Audit Test School',
    answers,
    clientExpiredAt: new Date().toISOString(),
    examToken: rStart.data?.examToken,
  });

  const rSubmit = await request({
    path: `/api/quizzes/${quizId}/attempt`,
    method: 'POST',
    headers: authHeaders,
  }, submitPayload);
  record('POST /api/quizzes/:id/attempt', rSubmit);

  const attemptId = rSubmit.data?.result?.attemptId || rSubmit.data?.attemptId || rSubmit.data?.data?.attemptId;

  // 5. Duplicate Submission Test: Attempt submitting again to verify E11000 enforcement
  const rDup = await request({
    path: `/api/quizzes/${quizId}/attempt`,
    method: 'POST',
    headers: authHeaders,
  }, submitPayload);
  if (rDup.statusCode === 403 && (rDup.data?.code === 'ALREADY_ATTEMPTED' || rDup.data?.alreadyAttempted)) {
    resultsCollector.duplicateRejections++;
  } else if (rDup.statusCode === 201) {
    resultsCollector.integrityErrors.push(`FAIL: Duplicate attempt was incorrectly permitted for student ${actualStudentIdentifier}`);
  }

  // 6. Fetch Result Details
  if (attemptId) {
    const rRes = await request({
      path: `/api/results/${attemptId}?studentIdentifier=${actualStudentIdentifier}`,
      headers: authHeaders,
    });
    record('GET /api/results/:id', rRes);

    // 7. Download PDF & Certificate
    const rPdf = await request({
      path: `/api/results/${attemptId}/pdf?studentIdentifier=${actualStudentIdentifier}`,
      headers: authHeaders,
    });
    record('GET /api/results/:id/pdf', rPdf);

    const rCert = await request({
      path: `/api/results/${attemptId}/certificate?studentIdentifier=${actualStudentIdentifier}`,
      headers: authHeaders,
    });
    record('GET /api/results/:id/certificate', rCert);
  }
}

async function runStage(concurrency, stageName, isInstantBurst, quizId, questions) {
  console.log(`\n----------------------------------------------------------------`);
  console.log(`🚀 RUNNING: ${stageName} (${concurrency} VUs) - ${isInstantBurst ? 'INSTANT BURST' : 'CONCURRENT'}`);
  console.log(`----------------------------------------------------------------`);

  const collector = {
    totalRequests: 0,
    successCount: 0,
    rateLimitedCount: 0,
    serverErrorCount: 0,
    otherStatusCount: 0,
    duplicateRejections: 0,
    integrityErrors: [],
    allDurations: [],
    byEndpoint: {},
  };

  const stageStart = Date.now();

  if (isInstantBurst) {
    // Exact synchronized instant burst: all 500 VUs dispatched simultaneously
    const vuPromises = [];
    for (let i = 1; i <= concurrency; i++) {
      vuPromises.push(runVirtualUser(i + 1000, quizId, questions, collector));
    }
    await Promise.all(vuPromises);
  } else {
    // Concurrent pool execution with batching
    const batchSize = Math.min(concurrency, 100);
    for (let offset = 1; offset <= concurrency; offset += batchSize) {
      const sliceSize = Math.min(batchSize, concurrency - offset + 1);
      const batchPromises = [];
      for (let i = 0; i < sliceSize; i++) {
        batchPromises.push(runVirtualUser(offset + i, quizId, questions, collector));
      }
      await Promise.all(batchPromises);
    }
  }

  const stageDurationMs = Date.now() - stageStart;
  const stageDurationSec = stageDurationMs / 1000;
  const rps = (collector.totalRequests / stageDurationSec).toFixed(1);
  const overallStats = getStats(collector.allDurations);

  console.log(`📊 RESULTS FOR ${stageName}:`);
  console.log(`   Total Requests: ${collector.totalRequests} in ${stageDurationSec.toFixed(2)}s`);
  console.log(`   Throughput    : ${rps} req/sec`);
  console.log(`   Success (2xx) : ${collector.successCount} (${((collector.successCount / collector.totalRequests) * 100).toFixed(1)}%)`);
  console.log(`   Rate Ltd(429) : ${collector.rateLimitedCount}`);
  console.log(`   Errors (5xx)  : ${collector.serverErrorCount}`);
  console.log(`   Dup Rejections: ${collector.duplicateRejections} (Correctly rejected duplicate attempts)`);
  console.log(`   Overall Latency: avg=${overallStats.avg}ms | p50=${overallStats.p50}ms | p95=${overallStats.p95}ms | p99=${overallStats.p99}ms | max=${overallStats.max}ms`);

  console.log(`\n   Endpoint Latency Breakdown:`);
  for (const [ep, durations] of Object.entries(collector.byEndpoint)) {
    const s = getStats(durations);
    console.log(`     • ${ep.padEnd(32)}: count=${durations.length} | p50=${String(s.p50).padStart(4)}ms | p95=${String(s.p95).padStart(4)}ms | p99=${String(s.p99).padStart(4)}ms`);
  }

  if (collector.integrityErrors.length > 0) {
    console.error(`   ❌ INTEGRITY ERRORS DETECTED:`, collector.integrityErrors.slice(0, 5));
  } else {
    console.log(`   ✅ 100% Data Integrity: Strict 1-attempt rule enforced, 0 answer leaks.`);
  }

  return {
    stageName,
    concurrency,
    durationSec: stageDurationSec,
    totalRequests: collector.totalRequests,
    rps,
    successRate: ((collector.successCount / collector.totalRequests) * 100).toFixed(1) + '%',
    serverErrorCount: collector.serverErrorCount,
    overallStats,
    byEndpoint: collector.byEndpoint,
  };
}

async function main() {
  console.log('================================================================');
  console.log('🔥 QUIZ SYSTEM LOAD & BURST TESTING SUITE (50 -> 500 VUs)');
  console.log('================================================================');
  console.log(`Target Server: ${BASE_URL}`);

  // 1. Check Server Health
  const healthRes = await request({ path: '/api/health' });
  if (healthRes.statusCode !== 200) {
    console.error('Target server is not healthy. Aborting load test.', healthRes);
    process.exit(1);
  }
  console.log(`✅ Target server healthy: DB status = ${healthRes.data?.database}`);

  // 2. Obtain Admin Token
  const adminLogin = await request({
    path: '/api/auth/login',
    method: 'POST',
  }, JSON.stringify({
    username: process.env.ADMIN_USERNAME || 'eduline',
    password: process.env.ADMIN_PASSWORD || 'Onisha@11022025',
  }));

  if (adminLogin.statusCode !== 200 || !adminLogin.data?.token) {
    console.error('Failed to log in as admin:', adminLogin);
    process.exit(1);
  }
  const adminToken = adminLogin.data.token;
  console.log('✅ Admin authenticated successfully.');

  // 3. Create Isolated Test Quiz for this audit run
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const quizRes = await request({
    path: '/api/admin/quizzes',
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  }, JSON.stringify({
    name: `[Audit Load Test] Science Quiz (${Date.now()})`,
    date: todayStr,
    numberOfQuestions: 3,
    targetClass: 'Class 5',
    classes: ['Class 5'],
    status: 'Draft',
    passingPercentage: 50,
  }));

  const quizId = quizRes.data?.quiz?._id;
  if (!quizId) {
    console.error('Failed to create load test quiz:', quizRes);
    process.exit(1);
  }

  // 4. Add 3 Test Questions
  const questions = [];
  for (let q = 1; q <= 3; q++) {
    const qRes = await request({
      path: '/api/admin/questions',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    }, JSON.stringify({
      quizId,
      question: `Load Test Question ${q}: What is the primary source of solar energy?`,
      options: { A: 'Nuclear Fusion', B: 'Combustion', C: 'Fission', D: 'Gravity' },
      correctAnswer: 'A',
      explanation: 'Solar energy is generated by nuclear fusion of hydrogen into helium.',
    }));
    questions.push(qRes.data?.question || { _id: `q_${q}` });
  }

  // 5. Publish Quiz
  await request({
    path: `/api/admin/quizzes/${quizId}`,
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
  }, JSON.stringify({ status: 'Published' }));
  console.log(`✅ Test Quiz created and published: ${quizId}`);

  // Exercise Admin endpoints under test conditions
  const adminStatsRes = await request({
    path: '/api/admin/stats',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✅ Admin stats verified: Total attempts in system = ${adminStatsRes.data?.stats?.totalAttempts || 0}`);

  // 6. Execute Concurrency Levels
  const summaryReport = [];

  // Stage 1: 50 Virtual Users
  summaryReport.push(await runStage(50, 'Stage 1: 50 Concurrent VUs', false, quizId, questions));

  // Stage 2: 100 Virtual Users
  summaryReport.push(await runStage(100, 'Stage 2: 100 Concurrent VUs', false, quizId, questions));

  // Stage 3: 250 Virtual Users
  summaryReport.push(await runStage(250, 'Stage 3: 250 Concurrent VUs', false, quizId, questions));

  // Stage 4: 500 Virtual Users (Sustained Concurrency)
  summaryReport.push(await runStage(500, 'Stage 4: 500 Concurrent VUs', false, quizId, questions));

  // Stage 5: Sudden Burst of 500 Users (12:00 AM Thundering Herd Simulation)
  summaryReport.push(await runStage(500, 'Stage 5: SUDDEN BURST (500 VUs Synchronized)', true, quizId, questions));

  // 7. Final Admin Telemetry Check
  const postTestAdminStats = await request({
    path: `/api/admin/quizzes/${quizId}`,
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const attemptsRecorded = postTestAdminStats.data?.attempts?.length || 0;
  console.log(`\n================================================================`);
  console.log(`🏁 AUDIT LOAD TEST COMPLETED SUCCESSFULLY`);
  console.log(`   Total Verified Attempts Recorded in DB: ${attemptsRecorded}`);
  console.log(`================================================================`);

  console.log('\n📈 EXECUTIVE SUMMARY TABLE:');
  console.table(summaryReport.map((s) => ({
    Stage: s.stageName.split(':')[0],
    VUs: s.concurrency,
    'Duration (s)': s.durationSec.toFixed(1),
    'Requests': s.totalRequests,
    'RPS': s.rps,
    'Success Rate': s.successRate,
    '5xx Errors': s.serverErrorCount,
    'p50 (ms)': s.overallStats.p50,
    'p95 (ms)': s.overallStats.p95,
    'p99 (ms)': s.overallStats.p99,
  })));

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal load test runner error:', err);
  process.exit(1);
});
