// ═══════════════════════════════════════════════════════════════════
//  EDULINE ADMIN CONSOLE — app.js
//  Communicates with backend API at same origin (no separate URL needed)
// ═══════════════════════════════════════════════════════════════════

// State
let authToken = localStorage.getItem('adminToken') || '';
let currentSection = 'dashboard';
let confirmCallback = null;
let allQuizzes = [];
let allSubjects = [];
let allClasses = [];

// Builder State for Add / Edit Quiz
let builderQuestions = [];

// ─── API Base ────────────────────────────────────────────────────────────────
const setApiStatus = (connected) => {
  const dot = document.getElementById('apiStatusDot');
  if (!dot) return;
  if (connected) {
    dot.className = 'w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-xs shadow-emerald-400/50';
    dot.title = 'Connected';
  } else {
    dot.className = 'w-2.5 h-2.5 bg-rose-500 rounded-full shadow-xs shadow-rose-500/50';
    dot.title = 'Disconnected';
  }
};

async function checkApiConnection() {
  try {
    const res = await fetch('/api/health');
    setApiStatus(res.ok);
  } catch {
    setApiStatus(false);
  }
}
setInterval(checkApiConnection, 30000);
checkApiConnection();

const API = async (method, endpoint, body = null, isFormData = false) => {
  const headers = { Authorization: `Bearer ${authToken}` };
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  try {
    const res = await fetch(endpoint, opts);
    if (res.status === 401) { logout(); return; }

    setApiStatus(true);

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');
      return data;
    }
    // For binary (PDF) responses, return the raw response
    if (!res.ok) throw new Error('Download failed');
    return res;
  } catch (err) {
    if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
      setApiStatus(false);
    }
    throw err;
  }
};

// ─── Toast ───────────────────────────────────────────────────────────────────
let toastTimeout;
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  const msgEl = document.getElementById('toastMsg');
  const colors = { success: 'bg-emerald-600 text-white', error: 'bg-rose-600 text-white', info: 'bg-indigo-600 text-white', warn: 'bg-amber-500 text-white' };
  msgEl.className = `px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-2xl flex items-center gap-2.5 fade-in ${colors[type] || colors.info}`;
  const icons = {
    success: '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>',
    error: '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>',
    info: '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    warn: '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>'
  };
  msgEl.innerHTML = `${icons[type] || ''}<span>${msg}</span>`;
  el.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.add('hidden'), 4000);
}

// ─── Modal helpers ───────────────────────────────────────────────────────────
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }

// ─── Confirm helper ──────────────────────────────────────────────────────────
function confirmAction(title, message, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  confirmCallback = onConfirm;
  openModal('confirmModal');
}
function executeConfirm() {
  closeModal('confirmModal');
  if (confirmCallback) confirmCallback();
}

// ─── Date format helpers ─────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; }
}
function fmtDateTime(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return d; }
}

// ─── Navigation ──────────────────────────────────────────────────────────────
function showSection(name) {
  if (name === 'results') name = 'students';

  ['dashboard', 'classes', 'quizzes', 'schedule', 'questions', 'subjects', 'students', 'results', 'theme'].forEach(s => {
    const el = document.getElementById(`section-${s}`);
    const nav = document.getElementById(`nav-${s}`);
    if (el) el.classList.add('hidden');
    if (nav) nav.classList.remove('active');
  });

  const activeSectionEl = document.getElementById(`section-${name}`) || document.getElementById('section-students');
  const activeNavEl = document.getElementById(`nav-${name}`) || document.getElementById('nav-students');
  if (activeSectionEl) activeSectionEl.classList.remove('hidden');
  if (activeNavEl) activeNavEl.classList.add('active');

  document.getElementById('pageTitle').textContent = {
    dashboard: 'Dashboard',
    classes: 'Class Management',
    quizzes: 'Quiz Management',
    schedule: 'Quiz Scheduling & Portal Visibility',
    questions: 'Question Management',
    subjects: 'Subject Management',
    students: 'Students Management',
    results: 'Students Management',
    theme: 'Theme & Examination Branding Settings',
  }[name] || 'Admin Portal';

  currentSection = name;
  if (name === 'dashboard') loadDashboard();
  if (name === 'classes') loadClasses();
  if (name === 'quizzes') loadQuizzes();
  if (name === 'schedule') {
    loadScheduleQuizzes();
    loadScheduledBatches();
  }
  if (name === 'questions') loadQuestions();
  if (name === 'subjects') loadSubjects();
  if (name === 'students' || name === 'results') loadStudents();
  if (name === 'theme') loadThemeSettings();
}

// ═══════════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════════
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');
  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    const data = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('usernameInput').value,
        password: document.getElementById('passwordInput').value,
      }),
    }).then(r => r.json());

    if (!data.success || !data.token) throw new Error(data.message || 'Login failed');
    authToken = data.token;
    localStorage.setItem('adminToken', authToken);
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('appView').classList.add('flex');
    init();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false; btn.textContent = 'Sign In to Admin Console';
  }
});

function logout() {
  authToken = '';
  localStorage.removeItem('adminToken');
  document.getElementById('appView').classList.add('hidden');
  document.getElementById('appView').classList.remove('flex');
  document.getElementById('loginView').classList.remove('hidden');
}

async function init() {
  try {
    await Promise.allSettled([loadSubjectsData(), loadQuizzesData()]);
  } catch (e) {
    console.warn('Init warning:', e);
  }
  loadDashboard();
}

// Auto-login if token exists
if (authToken) {
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('appView').classList.remove('hidden');
  document.getElementById('appView').classList.add('flex');
  init();
}

// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════
async function loadDashboard() {
  try {
    const data = await API('GET', '/api/admin/stats');
    const { stats, recentAttempts } = data;

    const svgIcons = {
      users: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>',
      clipboard: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>',
      check: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
      edit: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>',
      help: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
      layers: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>',
      bolt: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>',
      chart: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
      trophy: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>',
      shield: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>'
    };

    document.getElementById('statsGrid').innerHTML = `
      ${statCard('Total Students', stats.totalStudents, svgIcons.users, 'indigo')}
      ${statCard('Total Quizzes', stats.totalQuizzes, svgIcons.clipboard, 'purple')}
      ${statCard('Published', stats.publishedQuizzes, svgIcons.check, 'emerald')}
      ${statCard('Draft', stats.draftQuizzes, svgIcons.edit, 'amber')}
      ${statCard('Total Questions', stats.totalQuestions, svgIcons.help, 'sky')}
      ${statCard('Total Attempts', stats.totalAttempts, svgIcons.layers, 'violet')}
      ${statCard("Today's Attempts", stats.todayAttempts, svgIcons.bolt, 'rose')}
      ${statCard('Avg Score', stats.avgScore + '%', svgIcons.chart, 'teal')}
      ${statCard('Highest Score', stats.highestScore + '%', svgIcons.trophy, 'yellow')}
      ${statCard('Pass Rate', stats.passRate + '%', svgIcons.shield, 'green')}
    `;

    document.getElementById('recentAttemptsTable').innerHTML = recentAttempts && recentAttempts.length
      ? recentAttempts.map(att => `
        <tr class="hover:bg-slate-700/20 transition">
          <td class="py-3 pr-4 font-medium text-white">${esc(att.studentName)}</td>
          <td class="py-3 pr-4 font-mono text-xs text-slate-400">${esc(att.studentIdentifier)}</td>
          <td class="py-3 pr-4 text-slate-300 font-medium">${esc(att.quizName)}</td>
          <td class="py-3 pr-4 text-xs text-indigo-400 font-semibold">${esc(att.subject || 'General')}</td>
          <td class="py-3 pr-4 text-white font-semibold">${att.score}/${att.totalQuestions}</td>
          <td class="py-3 pr-4 text-slate-300">${att.percentage}%</td>
          <td class="py-3 pr-4"><span class="${att.result === 'Pass' ? 'badge-pass' : 'badge-fail'}">${att.result || '—'}</span></td>
          <td class="py-3 pr-4 text-slate-400 text-xs">${fmtDateTime(att.submittedAt)}</td>
          <td class="py-3">
            <div class="flex gap-1.5">
              <button onclick="downloadPdf('${att._id}','pdf','${esc(att.studentIdentifier)}')" class="btn-sm bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center gap-1" title="Download Result">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span>Result</span>
              </button>
              <button onclick="downloadPdf('${att._id}','certificate','${esc(att.studentIdentifier)}')" class="btn-sm bg-indigo-700 hover:bg-indigo-600 text-white flex items-center gap-1" title="Download Certificate">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                <span>Cert</span>
              </button>
            </div>
          </td>
        </tr>`).join('')
      : '<tr><td colspan="9" class="py-8 text-center text-slate-500">No attempts yet.</td></tr>';
  } catch (e) {
    toast('Dashboard error: ' + e.message, 'error');
  }
}

function statCard(label, value, icon, color) {
  const colors = { indigo: 'text-indigo-400 bg-indigo-500/10', purple: 'text-purple-400 bg-purple-500/10', emerald: 'text-emerald-400 bg-emerald-500/10', amber: 'text-amber-400 bg-amber-500/10', sky: 'text-sky-400 bg-sky-500/10', violet: 'text-violet-400 bg-violet-500/10', rose: 'text-rose-400 bg-rose-500/10', teal: 'text-teal-400 bg-teal-500/10', yellow: 'text-yellow-400 bg-yellow-500/10', green: 'text-green-400 bg-green-500/10' };
  return `<div class="stat-card">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">${label}</span>
      <span class="w-8 h-8 rounded-xl ${colors[color]} flex items-center justify-center text-base">${icon}</span>
    </div>
    <div class="text-2xl font-extrabold text-white">${value}</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════
//  QUIZZES
// ═══════════════════════════════════════════════════════════════════
async function loadQuizzesData() {
  const data = await API('GET', '/api/admin/quizzes');
  allQuizzes = data.quizzes || [];
}

async function loadQuizzes() {
  try {
    await loadQuizzesData();
    renderQuizzes();
  } catch (e) { toast('Failed to load quizzes: ' + e.message, 'error'); }
}

function renderQuizzes() {
  const container = document.getElementById('quizzesList');
  if (!allQuizzes.length) {
    container.innerHTML = `<div class="card p-12 text-center text-slate-500">No quizzes yet. Click "+ Add Quiz" to create one.</div>`;
    return;
  }
  container.innerHTML = allQuizzes.map(q => {
    const quota = q.questionsAdded || 0;
    const target = q.numberOfQuestions;
    const pct = target ? Math.min(100, Math.round((quota / target) * 100)) : 0;
    const statusBadge = { Published: 'badge-published', Draft: 'badge-draft', Closed: 'badge-closed' }[q.status] || 'badge-draft';
    return `
    <div class="card p-5 fade-in">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 mb-1.5">
            <h3 class="text-base font-bold text-white truncate">${esc(q.name)}</h3>
            <span class="${statusBadge}">${q.status}</span>
            ${q.targetClass && q.targetClass !== 'All' ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">${esc(q.targetClass)}</span>` : '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">All Classes</span>'}
            ${q.subject ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">${esc(q.subject)}</span>` : ''}
          </div>
          <div class="flex flex-wrap gap-4 text-xs text-slate-400 mb-3">
            <span>${q.numberOfQuestions} questions required</span>
            <span>${q.language === 'hi' ? 'Hindi' : 'English'}</span>
            <span>${q.timePerQuestion || 40}s / question</span>
            <span>Passing: ${q.passingPercentage || 50}%</span>
            <span>${q.attemptCount || 0} attempts</span>
            <span>Created: ${fmtDate(q.createdAt)}</span>
          </div>
          <div>
            <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Questions: <strong>${quota} / ${target}</strong></span>
              <span>${pct}%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            ${!q.isReadyToPublish && q.status === 'Draft' ? `<p class="text-amber-400 text-xs mt-1 flex items-center gap-1"><svg class="w-3.5 h-3.5 inline shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg><span>Need ${target - quota} more question${target - quota !== 1 ? 's' : ''} to publish</span></p>` : ''}
          </div>
        </div>
        <div class="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
          <button onclick="editQuiz('${q._id}')" class="btn-sm bg-slate-700 text-slate-200 hover:bg-slate-600 flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            Edit Quiz
          </button>
          ${q.status === 'Draft' ? `<button onclick="publishQuiz('${q._id}')" class="btn-sm bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30">Publish</button>` : ''}
          ${q.status === 'Published' ? `<button onclick="changeQuizStatus('${q._id}','Closed')" class="btn-sm bg-amber-600/20 text-amber-400 hover:bg-amber-600/30">Close</button>` : ''}
          ${q.status === 'Closed' ? `<button onclick="changeQuizStatus('${q._id}','Published')" class="btn-sm bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30">Reopen</button>` : ''}
          <button onclick="deleteQuiz('${q._id}')" class="btn-sm bg-rose-600/20 text-rose-400 hover:bg-rose-600/30">Delete</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════════
//  UNIFIED QUIZ + QUESTIONS BUILDER
// ═══════════════════════════════════════════════════════════════════

function populateQuizSubjectDropdown(selectedId = '') {
  const sel = document.getElementById('quizSubjectId');
  sel.innerHTML = '<option value="">Select Subject</option>' +
    allSubjects.map(s => `<option value="${s._id}" ${selectedId == s._id ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
}

async function openQuizModal(quiz = null) {
  // If quiz provided as an object or id
  let fullQuiz = quiz;
  if (typeof quiz === 'string') {
    try {
      const data = await API('GET', `/api/admin/quizzes/${quiz}`);
      fullQuiz = data.quiz;
      fullQuiz.questions = data.questions || [];
    } catch (e) {
      toast('Failed to load quiz: ' + e.message, 'error');
      return;
    }
  }

  const isEdit = !!fullQuiz;
  document.getElementById('quizId').value = isEdit ? fullQuiz._id : '';
  document.getElementById('quizName').value = isEdit ? fullQuiz.name : '';
  document.getElementById('quizNumQuestions').value = isEdit ? fullQuiz.numberOfQuestions : '10';
  document.getElementById('quizTimePerQuestion').value = isEdit ? (fullQuiz.timePerQuestion || 40) : 40;
  document.getElementById('quizPassingPct').value = isEdit ? (fullQuiz.passingPercentage || 50) : 50;
  document.getElementById('quizLanguage').value = isEdit ? (fullQuiz.language || 'en') : 'en';
  document.getElementById('quizTargetClass').value = isEdit ? (fullQuiz.targetClass || 'All') : 'All';
  document.getElementById('quizDescription').value = isEdit ? (fullQuiz.description || '') : '';
  document.getElementById('quizInstructions').value = isEdit ? (fullQuiz.instructions || '') : '';
  document.getElementById('quizContactInfo').value = isEdit ? (fullQuiz.contactInfo || '') : '';

  const elScore = document.getElementById('quizTotalScore');
  if (elScore) elScore.value = isEdit ? (fullQuiz.totalScore || 20) : 20;

  const elBanner = document.getElementById('quizBannerUrl');
  const elPreset = document.getElementById('quizBannerPreset');
  const currentBanner = isEdit && fullQuiz.bannerUrl ? fullQuiz.bannerUrl : '/img/hindidiwas.png';
  if (elBanner) elBanner.value = currentBanner;
  if (elPreset) {
    if (['/img/hindidiwas.png', '/admin/Edulinenew.png'].includes(currentBanner)) {
      elPreset.value = currentBanner;
    } else {
      elPreset.value = 'custom';
    }
  }

  document.getElementById('quizModalTitle').textContent = isEdit ? 'Edit Quiz & Questions' : 'Create Quiz & Add Questions';
  document.getElementById('quizPublishBtnLabel').textContent = isEdit ? 'Save & Publish' : 'Publish Quiz';

  populateQuizSubjectDropdown(isEdit ? (fullQuiz.subjectId?._id || fullQuiz.subjectId) : '');

  // Populate questions in builder
  if (isEdit && fullQuiz.questions && fullQuiz.questions.length > 0) {
    builderQuestions = fullQuiz.questions.map((q, idx) => ({
      _id: q._id,
      question: q.question || '',
      options: {
        A: q.options?.A || '',
        B: q.options?.B || '',
        C: q.options?.C || '',
        D: q.options?.D || '',
      },
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || '',
      imageUrl: q.imageUrl || '',
      imagePublicId: q.imagePublicId || '',
      audioUrl: q.audioUrl || '',
      audioPublicId: q.audioPublicId || '',
      isCollapsed: false,
    }));
  } else {
    // Start with 1 blank question card
    builderQuestions = [createBlankQuestionObject()];
  }

  renderBuilderQuestions();
  openModal('quizModal');
}

function editQuiz(id) {
  openQuizModal(id);
}

function createBlankQuestionObject() {
  return {
    _id: '',
    question: '',
    options: { A: '', B: '', C: '', D: '' },
    correctAnswer: '',
    explanation: '',
    imageUrl: '',
    imagePublicId: '',
    audioUrl: '',
    audioPublicId: '',
    isCollapsed: false,
  };
}

function syncBuilderStateFromDOM() {
  const container = document.getElementById('builderQuestionsList');
  const cards = container.querySelectorAll('.builder-q-card');
  cards.forEach((card, idx) => {
    if (!builderQuestions[idx]) return;
    const qText = card.querySelector('.q-text-input')?.value || '';
    const optA = card.querySelector('.q-opt-A')?.value || '';
    const optB = card.querySelector('.q-opt-B')?.value || '';
    const optC = card.querySelector('.q-opt-C')?.value || '';
    const optD = card.querySelector('.q-opt-D')?.value || '';
    const correct = card.querySelector('.q-correct-select')?.value || '';
    const exp = card.querySelector('.q-exp-input')?.value || '';
    const imgUrl = card.querySelector('.q-img-url')?.value || '';
    const imgPub = card.querySelector('.q-img-public')?.value || '';
    const audUrl = card.querySelector('.q-aud-url')?.value || '';
    const audPub = card.querySelector('.q-aud-public')?.value || '';

    builderQuestions[idx].question = qText;
    builderQuestions[idx].options = { A: optA, B: optB, C: optC, D: optD };
    builderQuestions[idx].correctAnswer = correct;
    builderQuestions[idx].explanation = exp;
    builderQuestions[idx].imageUrl = imgUrl;
    builderQuestions[idx].imagePublicId = imgPub;
    builderQuestions[idx].audioUrl = audUrl;
    builderQuestions[idx].audioPublicId = audPub;
  });
}

function addNewQuestionCard() {
  syncBuilderStateFromDOM();
  builderQuestions.push(createBlankQuestionObject());
  renderBuilderQuestions();

  // Smooth scroll to the newly added card
  setTimeout(() => {
    const list = document.getElementById('builderQuestionsList');
    if (list && list.lastElementChild) {
      list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const txt = list.lastElementChild.querySelector('.q-text-input');
      if (txt) txt.focus();
    }
  }, 50);
}

function removeQuestionCard(index) {
  syncBuilderStateFromDOM();
  if (builderQuestions.length <= 1) {
    builderQuestions = [createBlankQuestionObject()];
  } else {
    builderQuestions.splice(index, 1);
  }
  renderBuilderQuestions();
}

function toggleQuestionCard(index) {
  syncBuilderStateFromDOM();
  if (builderQuestions[index]) {
    builderQuestions[index].isCollapsed = !builderQuestions[index].isCollapsed;
    renderBuilderQuestions();
  }
}

function updateQuestionsQuotaNotice() {
  const target = Number(document.getElementById('quizNumQuestions').value) || 0;
  const current = builderQuestions.length;
  const badge = document.getElementById('questionCountBadge');
  const hint = document.getElementById('questionQuotaHint');

  badge.textContent = `${current} / ${target}`;

  if (current === target) {
    badge.className = 'text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold';
    hint.className = 'text-xs text-emerald-400 mt-1';
    hint.textContent = `✓ Exactly ${target} question${target !== 1 ? 's' : ''} added. Ready to publish.`;
  } else if (current < target) {
    const diff = target - current;
    badge.className = 'text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold';
    hint.className = 'text-xs text-amber-400 mt-1';
    hint.textContent = `${target} questions are required. Please add ${diff} more question${diff !== 1 ? 's' : ''}.`;
  } else {
    const diff = current - target;
    badge.className = 'text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold';
    hint.className = 'text-xs text-rose-400 mt-1';
    hint.textContent = `${target} questions are required. Please remove ${diff} question${diff !== 1 ? 's' : ''} before publishing.`;
  }
}

function renderBuilderQuestions() {
  const container = document.getElementById('builderQuestionsList');
  updateQuestionsQuotaNotice();

  container.innerHTML = builderQuestions.map((q, idx) => {
    const qNum = idx + 1;
    const isCollapsed = !!q.isCollapsed;
    const titleSnippet = q.question ? q.question.slice(0, 55) + (q.question.length > 55 ? '…' : '') : `Question ${qNum}`;

    return `
    <div class="builder-q-card bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden fade-in transition" data-index="${idx}">
      <!-- Card Header / Collapsible bar -->
      <div class="p-4 bg-slate-800 flex items-center justify-between gap-3 border-b border-slate-700/60 cursor-pointer" onclick="toggleQuestionCard(${idx})">
        <div class="flex items-center gap-3 min-w-0">
          <span class="w-7 h-7 rounded-xl bg-indigo-600/30 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
            ${qNum}
          </span>
          <span class="font-bold text-sm text-white truncate">${esc(titleSnippet)}</span>
          ${q.correctAnswer ? `<span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md text-[11px] font-bold">Ans: ${q.correctAnswer}</span>` : ''}
          ${q.imageUrl ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/10 text-[10px] text-amber-300 font-semibold gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>Img</span>` : ''}
          ${q.audioUrl ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-500/10 text-[10px] text-purple-300 font-semibold gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M9 19V6l12-3v13"/></svg>Aud</span>` : ''}
        </div>

        <div class="flex items-center gap-2 flex-shrink-0" onclick="event.stopPropagation()">
          <button type="button" onclick="removeQuestionCard(${idx})" class="text-xs px-2.5 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition" title="Remove this question">
            Remove Question
          </button>
          <button type="button" onclick="toggleQuestionCard(${idx})" class="text-slate-400 hover:text-white p-1">
            <svg class="w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
      </div>

      <!-- Card Body -->
      <div class="p-5 space-y-4 ${isCollapsed ? 'hidden' : ''}">
        <!-- Question Prompt -->
        <div>
          <label class="form-label">Question Text *</label>
          <textarea class="form-input q-text-input resize-none" rows="2" placeholder="Type question prompt here...">${esc(q.question)}</textarea>
        </div>

        <!-- Media Uploads: Image & Audio -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <!-- Image -->
          <div class="bg-slate-900/40 p-3.5 rounded-xl border border-slate-700/60">
            <label class="form-label text-slate-400 mb-1.5 flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Question Image (Optional)
              </span>
              ${q.imageUrl ? `<button type="button" onclick="removeBuilderImage(${idx})" class="text-[11px] text-rose-400 hover:underline">Remove</button>` : ''}
            </label>
            <input type="file" accept="image/*" class="hidden q-img-file" id="qImgFile_${idx}" onchange="handleBuilderImageUpload(event, ${idx})">
            <input type="hidden" class="q-img-url" value="${esc(q.imageUrl || '')}">
            <input type="hidden" class="q-img-public" value="${esc(q.imagePublicId || '')}">

            ${q.imageUrl ? `
              <div class="relative mt-2">
                <img src="${q.imageUrl}" alt="Preview" class="max-h-36 rounded-lg border border-slate-700 object-contain mx-auto bg-slate-950">
              </div>
            ` : `
              <button type="button" onclick="document.getElementById('qImgFile_${idx}').click()" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center justify-center gap-1.5">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Upload Image
              </button>
            `}
            <div id="qImgStatus_${idx}" class="text-[11px] text-slate-400 mt-1"></div>
          </div>

          <!-- Audio -->
          <div class="bg-slate-900/40 p-3.5 rounded-xl border border-slate-700/60">
            <label class="form-label text-slate-400 mb-1.5 flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M9 19V6l12-3v13"/></svg>
                Question Audio (Optional)
              </span>
              ${q.audioUrl ? `<button type="button" onclick="removeBuilderAudio(${idx})" class="text-[11px] text-rose-400 hover:underline">Remove</button>` : ''}
            </label>
            <input type="file" accept="audio/*" class="hidden q-aud-file" id="qAudFile_${idx}" onchange="handleBuilderAudioUpload(event, ${idx})">
            <input type="hidden" class="q-aud-url" value="${esc(q.audioUrl || '')}">
            <input type="hidden" class="q-aud-public" value="${esc(q.audioPublicId || '')}">

            ${q.audioUrl ? `
              <div class="mt-2">
                <audio controls class="w-full"><source src="${q.audioUrl}"></audio>
              </div>
            ` : `
              <button type="button" onclick="document.getElementById('qAudFile_${idx}').click()" class="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center justify-center gap-1.5">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                Upload Audio
              </button>
            `}
            <div id="qAudStatus_${idx}" class="text-[11px] text-slate-400 mt-1"></div>
          </div>
        </div>

        <!-- 4 Options (A, B, C, D) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div>
            <label class="form-label text-slate-400"><span class="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold mr-1">A</span>Option A *</label>
            <input type="text" class="form-input q-opt-A" placeholder="Option A text..." value="${esc(q.options?.A || '')}">
          </div>
          <div>
            <label class="form-label text-slate-400"><span class="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold mr-1">B</span>Option B *</label>
            <input type="text" class="form-input q-opt-B" placeholder="Option B text..." value="${esc(q.options?.B || '')}">
          </div>
          <div>
            <label class="form-label text-slate-400"><span class="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold mr-1">C</span>Option C *</label>
            <input type="text" class="form-input q-opt-C" placeholder="Option C text..." value="${esc(q.options?.C || '')}">
          </div>
          <div>
            <label class="form-label text-slate-400"><span class="bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold mr-1">D</span>Option D *</label>
            <input type="text" class="form-input q-opt-D" placeholder="Option D text..." value="${esc(q.options?.D || '')}">
          </div>
        </div>

        <!-- Correct Answer & Explanation -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div>
            <label class="form-label text-emerald-400">Correct Answer *</label>
            <select class="form-input q-correct-select font-bold">
              <option value="">Select Correct (A / B / C / D)</option>
              <option value="A" ${q.correctAnswer === 'A' ? 'selected' : ''}>A</option>
              <option value="B" ${q.correctAnswer === 'B' ? 'selected' : ''}>B</option>
              <option value="C" ${q.correctAnswer === 'C' ? 'selected' : ''}>C</option>
              <option value="D" ${q.correctAnswer === 'D' ? 'selected' : ''}>D</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="form-label text-slate-400">Explanation (Optional)</label>
            <input type="text" class="form-input q-exp-input" placeholder="Explain the rationale behind correct choice..." value="${esc(q.explanation || '')}">
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ─── Builder Media Upload Handlers ───────────────────────────────────────────
async function handleBuilderImageUpload(event, index) {
  const file = event.target.files[0];
  if (!file) return;
  const statusEl = document.getElementById(`qImgStatus_${index}`);
  if (statusEl) statusEl.textContent = 'Uploading image…';

  try {
    const fd = new FormData();
    fd.append('image', file);
    const data = await API('POST', '/api/admin/upload/image', fd, true);
    syncBuilderStateFromDOM();
    if (builderQuestions[index]) {
      builderQuestions[index].imageUrl = data.imageUrl;
      builderQuestions[index].imagePublicId = data.publicId || '';
    }
    renderBuilderQuestions();
    toast('Image uploaded successfully', 'success');
  } catch (e) {
    if (statusEl) statusEl.textContent = '✕ Upload failed: ' + e.message;
    toast('Image upload failed: ' + e.message, 'error');
  }
}

function removeBuilderImage(index) {
  syncBuilderStateFromDOM();
  if (builderQuestions[index]) {
    builderQuestions[index].imageUrl = '';
    builderQuestions[index].imagePublicId = '';
  }
  renderBuilderQuestions();
}

async function handleBuilderAudioUpload(event, index) {
  const file = event.target.files[0];
  if (!file) return;
  const statusEl = document.getElementById(`qAudStatus_${index}`);
  if (statusEl) statusEl.textContent = 'Uploading audio…';

  try {
    const fd = new FormData();
    fd.append('audio', file);
    const data = await API('POST', '/api/admin/upload/audio', fd, true);
    syncBuilderStateFromDOM();
    if (builderQuestions[index]) {
      builderQuestions[index].audioUrl = data.audioUrl;
      builderQuestions[index].audioPublicId = data.publicId || '';
    }
    renderBuilderQuestions();
    toast('Audio uploaded successfully', 'success');
  } catch (e) {
    if (statusEl) statusEl.textContent = '✕ Upload failed: ' + e.message;
    toast('Audio upload failed: ' + e.message, 'error');
  }
}

function removeBuilderAudio(index) {
  syncBuilderStateFromDOM();
  if (builderQuestions[index]) {
    builderQuestions[index].audioUrl = '';
    builderQuestions[index].audioPublicId = '';
  }
  renderBuilderQuestions();
}

// ─── Save / Publish Quiz Builder ─────────────────────────────────────────────
async function saveQuizBuilder(targetStatus = 'Draft') {
  syncBuilderStateFromDOM();

  const quizId = document.getElementById('quizId').value;
  const name = document.getElementById('quizName').value.trim();
  const subjectId = document.getElementById('quizSubjectId').value;
  const numberOfQuestions = Number(document.getElementById('quizNumQuestions').value) || 0;
  const timePerQuestion = Number(document.getElementById('quizTimePerQuestion').value) || 40;
  const passingPercentage = Number(document.getElementById('quizPassingPct').value) || 50;
  const language = document.getElementById('quizLanguage').value || 'en';
  const targetClass = document.getElementById('quizTargetClass')?.value || 'All';
  const description = document.getElementById('quizDescription').value.trim();
  const instructions = document.getElementById('quizInstructions').value.trim();
  const contactInfo = document.getElementById('quizContactInfo').value.trim();

  // Frontend Validations
  if (!name) {
    toast('Quiz name is required.', 'error');
    document.getElementById('quizName').focus();
    return;
  }
  if (!subjectId) {
    toast('Please select a subject.', 'error');
    document.getElementById('quizSubjectId').focus();
    return;
  }
  if (!numberOfQuestions || numberOfQuestions < 1) {
    toast('A quiz must require at least 1 question.', 'error');
    document.getElementById('quizNumQuestions').focus();
    return;
  }

  // Quota & Question Validation for Publish
  if (targetStatus === 'Published') {
    if (builderQuestions.length !== numberOfQuestions) {
      const diff = numberOfQuestions - builderQuestions.length;
      toast(`${numberOfQuestions} questions are required. Only ${builderQuestions.length} ${builderQuestions.length === 1 ? 'has' : 'have'} been added. Please ${diff > 0 ? `add ${diff} more question${diff !== 1 ? 's' : ''}` : `remove ${Math.abs(diff)} question${Math.abs(diff) !== 1 ? 's' : ''}`}.`, 'error');
      return;
    }

    // Validate each question completeness
    for (let i = 0; i < builderQuestions.length; i++) {
      const q = builderQuestions[i];
      const qNum = i + 1;

      if (!q.question || !q.question.trim()) {
        builderQuestions[i].isCollapsed = false;
        renderBuilderQuestions();
        toast(`Question ${qNum} text is required.`, 'error');
        return;
      }
      if (!q.options.A || !q.options.A.trim()) {
        builderQuestions[i].isCollapsed = false;
        renderBuilderQuestions();
        toast(`Question ${qNum} is missing Option A.`, 'error');
        return;
      }
      if (!q.options.B || !q.options.B.trim()) {
        builderQuestions[i].isCollapsed = false;
        renderBuilderQuestions();
        toast(`Question ${qNum} is missing Option B.`, 'error');
        return;
      }
      if (!q.options.C || !q.options.C.trim()) {
        builderQuestions[i].isCollapsed = false;
        renderBuilderQuestions();
        toast(`Question ${qNum} is missing Option C.`, 'error');
        return;
      }
      if (!q.options.D || !q.options.D.trim()) {
        builderQuestions[i].isCollapsed = false;
        renderBuilderQuestions();
        toast(`Question ${qNum} is missing Option D.`, 'error');
        return;
      }
      if (!['A', 'B', 'C', 'D'].includes(String(q.correctAnswer || '').toUpperCase())) {
        builderQuestions[i].isCollapsed = false;
        renderBuilderQuestions();
        toast(`Question ${qNum} does not have a correct answer selected.`, 'error');
        return;
      }
    }
  }

  const totalScore = Number(document.getElementById('quizTotalScore')?.value) || 20;
  const bannerUrl = document.getElementById('quizBannerUrl')?.value?.trim() || '/img/hindidiwas.png';

  // Payload
  const payload = {
    name,
    subjectId: subjectId || null,
    numberOfQuestions,
    timePerQuestion,
    passingPercentage,
    language,
    targetClass,
    description,
    instructions,
    contactInfo,
    status: targetStatus,
    totalScore,
    bannerUrl,
    questions: builderQuestions.map(q => ({
      question: q.question.trim(),
      options: {
        A: q.options.A.trim(),
        B: q.options.B.trim(),
        C: q.options.C.trim(),
        D: q.options.D.trim(),
      },
      correctAnswer: String(q.correctAnswer).trim().toUpperCase(),
      explanation: q.explanation ? q.explanation.trim() : '',
      imageUrl: q.imageUrl || '',
      imagePublicId: q.imagePublicId || '',
      audioUrl: q.audioUrl || '',
      audioPublicId: q.audioPublicId || '',
    })),
  };

  try {
    if (quizId) {
      await API('PUT', `/api/admin/quizzes/${quizId}`, payload);
      toast(targetStatus === 'Published' ? 'Quiz updated and published successfully!' : 'Quiz updated and saved as draft.', 'success');
    } else {
      await API('POST', '/api/admin/quizzes', payload);
      toast(targetStatus === 'Published' ? 'Quiz created and published successfully!' : 'Quiz created and saved as draft.', 'success');
    }

    closeModal('quizModal');
    await loadQuizzes();
    if (currentSection === 'dashboard') loadDashboard();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function publishQuiz(id) {
  try {
    await API('PUT', `/api/admin/quizzes/${id}`, { status: 'Published' });
    toast('Quiz published successfully!', 'success');
    loadQuizzes();
  } catch (e) { toast(e.message, 'error'); }
}

async function changeQuizStatus(id, status) {
  try {
    await API('PUT', `/api/admin/quizzes/${id}`, { status });
    toast(`Quiz status changed to ${status}`, 'success');
    loadQuizzes();
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteQuiz(id) {
  confirmAction('Delete Quiz', 'This will permanently delete the quiz, all its questions, and all student attempts. This cannot be undone.', async () => {
    try {
      await API('DELETE', `/api/admin/quizzes/${id}`);
      toast('Quiz deleted', 'success');
      loadQuizzes();
      if (currentSection === 'dashboard') loadDashboard();
    } catch (e) { toast(e.message, 'error'); }
  });
}

// ═══════════════════════════════════════════════════════════════════
//  SCHEDULE & MULTI-SELECT QUIZ CONTROLLER
// ═══════════════════════════════════════════════════════════════════
let selectedQuizIds = new Set();
let editingBatchId = null;
let isQuizDropdownOpen = false;

function toggleQuizDropdownMenu() {
  const menu = document.getElementById('quizDropdownMenu');
  if (!menu) return;
  isQuizDropdownOpen = !isQuizDropdownOpen;
  if (isQuizDropdownOpen) {
    menu.classList.remove('hidden');
  } else {
    menu.classList.add('hidden');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const trigger = document.getElementById('quizDropdownTrigger');
  const menu = document.getElementById('quizDropdownMenu');
  if (trigger && menu && !trigger.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.add('hidden');
    isQuizDropdownOpen = false;
  }
});

function handleBannerDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  const zone = document.getElementById('bulkBannerDropzone');
  if (zone) zone.classList.add('border-indigo-500', 'bg-indigo-950/40');
}

function handleBannerDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  const zone = document.getElementById('bulkBannerDropzone');
  if (zone) zone.classList.remove('border-indigo-500', 'bg-indigo-950/40');
}

function handleBannerDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const zone = document.getElementById('bulkBannerDropzone');
  if (zone) zone.classList.remove('border-indigo-500', 'bg-indigo-950/40');
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    uploadBannerFile(files[0]);
  }
}

function handleBannerFileSelect(e) {
  const file = e.target.files?.[0];
  if (file) {
    uploadBannerFile(file);
  }
}

async function uploadBannerFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    toast('Please select an image file (JPG, PNG, WebP).', 'error');
    return;
  }

  const statusEl = document.getElementById('bulkBannerStatus');
  const nameEl = document.getElementById('bulkBannerPreviewName');
  const imgEl = document.getElementById('bulkBannerPreviewImg');
  const inputEl = document.getElementById('bulkBannerUrl');

  if (statusEl) statusEl.textContent = 'Uploading…';
  if (nameEl) nameEl.textContent = file.name;

  const formData = new FormData();
  formData.append('image', file);

  try {
    const data = await API('POST', '/api/admin/upload/image', formData, true);
    const uploadedUrl = data.url || data.imageUrl || data.secure_url;
    if (!uploadedUrl) throw new Error('No URL returned from server.');

    if (inputEl) inputEl.value = uploadedUrl;
    if (imgEl) imgEl.src = uploadedUrl;
    const presetEl = document.getElementById('bulkBannerPreset');
    if (presetEl) presetEl.value = 'upload';
    if (statusEl) statusEl.textContent = '✓ Uploaded';
    toast('Thumbnail image uploaded successfully!', 'success');
  } catch (err) {
    if (statusEl) statusEl.textContent = 'Upload failed';
    toast('Image upload failed: ' + err.message, 'error');
  }
}

function handleBulkBannerPresetChange(val) {
  const urlInput = document.getElementById('bulkBannerUrl');
  const img = document.getElementById('bulkBannerPreviewImg');
  const nameEl = document.getElementById('bulkBannerPreviewName');
  if (val === 'upload') {
    document.getElementById('bulkBannerFileInput').click();
    return;
  }
  if (val === 'custom') {
    if (urlInput) {
      urlInput.focus();
      urlInput.select();
    }
    return;
  }
  if (urlInput) urlInput.value = val;
  if (img) img.src = val;
  if (nameEl) nameEl.textContent = val.includes('Eduline') ? 'Eduline Banner' : 'Hindi Diwas Banner';
}

function handleBannerUrlManualInput(val) {
  const clean = val.trim();
  const img = document.getElementById('bulkBannerPreviewImg');
  const nameEl = document.getElementById('bulkBannerPreviewName');
  if (clean && img) {
    img.src = clean;
    if (nameEl) nameEl.textContent = 'Custom URL';
  }
}

async function loadScheduleQuizzes() {
  const itemsContainer = document.getElementById('quizDropdownItems');
  const label = document.getElementById('quizDropdownLabel');
  if (itemsContainer) itemsContainer.innerHTML = '<div class="p-3 text-xs text-slate-500 text-center">Loading quizzes...</div>';

  try {
    const data = await API('GET', '/api/admin/quizzes');
    const quizzes = data.quizzes || [];
    allQuizzes = quizzes;

    if (!quizzes.length) {
      if (itemsContainer) itemsContainer.innerHTML = '<div class="p-3 text-xs text-slate-500 text-center">No quizzes created yet.</div>';
      return;
    }

    const now = new Date();

    // Calculate live status counts
    let countOngoing = 0;
    let countUpcoming = 0;
    let countPast = 0;

    quizzes.forEach((q) => {
      const sDateObj = q.startDate ? new Date(q.startDate) : null;
      const eDateObj = q.endDate ? new Date(q.endDate) : null;
      if (q.status === 'Closed' || (eDateObj && eDateObj < now)) {
        countPast++;
      } else if (sDateObj && sDateObj > now) {
        countUpcoming++;
      } else {
        countOngoing++;
      }
    });

    const elO = document.getElementById('schedCountOngoing');
    const elU = document.getElementById('schedCountUpcoming');
    const elP = document.getElementById('schedCountPast');
    if (elO) elO.textContent = `${countOngoing} Live`;
    if (elU) elU.textContent = `${countUpcoming} Queued`;
    if (elP) elP.textContent = `${countPast} Closed`;

    // Default pre-fill for bulk inputs if not yet filled
    const startInput = document.getElementById('bulkStartDate');
    const endInput = document.getElementById('bulkEndDate');
    if (startInput && !startInput.value) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      startInput.value = formatDateTimeForInput(tomorrow);
    }
    if (endInput && !endInput.value) {
      const tomorrowEnd = new Date(now);
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
      tomorrowEnd.setHours(23, 59, 0, 0);
      endInput.value = formatDateTimeForInput(tomorrowEnd);
    }

    // Render items inside dropdown
    if (itemsContainer) {
      itemsContainer.innerHTML = quizzes.map((q) => {
        const isChecked = selectedQuizIds.has(q._id);
        const sDateObj = q.startDate ? new Date(q.startDate) : null;
        const eDateObj = q.endDate ? new Date(q.endDate) : null;
        let liveStatus = 'Ongoing';
        let statusBadgeCls = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        if (q.status === 'Closed' || (eDateObj && eDateObj < now)) {
          liveStatus = 'Past';
          statusBadgeCls = 'bg-slate-700 text-slate-300 border-slate-600';
        } else if (sDateObj && sDateObj > now) {
          liveStatus = 'Upcoming';
          statusBadgeCls = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        }

        return `
        <label class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 cursor-pointer transition select-none ${isChecked ? 'bg-indigo-950/40' : ''}">
          <div class="flex items-center gap-2.5 min-w-0 flex-1">
            <input type="checkbox" value="${q._id}" ${isChecked ? 'checked' : ''} onchange="toggleSelectQuiz('${q._id}', this.checked)" class="w-4 h-4 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer sched-quiz-cb">
            <div class="truncate">
              <span class="text-xs font-semibold text-white block truncate">${esc(q.name)}</span>
              <span class="text-[10px] text-slate-400 block">${q.targetClass && q.targetClass !== 'All' ? esc(q.targetClass) : 'All Classes'} · ${esc(q.timing || '00:10 Hours')}</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${statusBadgeCls}">
            ${liveStatus}
          </span>
        </label>
        `;
      }).join('');
    }

    updateSelectedCountUI();
  } catch (err) {
    if (itemsContainer) itemsContainer.innerHTML = `<div class="p-3 text-xs text-rose-400 text-center">Error: ${err.message}</div>`;
  }
}

function resetScheduleForm(silent = false) {
  editingBatchId = null;
  selectedQuizIds.clear();

  const cbs = document.querySelectorAll('.sched-quiz-cb');
  cbs.forEach((cb) => { cb.checked = false; });

  const titleInput = document.getElementById('bulkCompetitionTitle');
  if (titleInput) titleInput.value = '';

  const now = new Date();
  const startInput = document.getElementById('bulkStartDate');
  const endInput = document.getElementById('bulkEndDate');
  if (startInput) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    startInput.value = formatDateTimeForInput(tomorrow);
  }
  if (endInput) {
    const tomorrowEnd = new Date(now);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 0, 0);
    endInput.value = formatDateTimeForInput(tomorrowEnd);
  }

  const timingInput = document.getElementById('bulkTimingText');
  if (timingInput) timingInput.value = '00:10 Hours';

  const urlInput = document.getElementById('bulkBannerUrl');
  if (urlInput) urlInput.value = '/img/hindidiwas.png';

  const img = document.getElementById('bulkBannerPreviewImg');
  if (img) img.src = '/img/hindidiwas.png';

  const nameEl = document.getElementById('bulkBannerPreviewName');
  if (nameEl) nameEl.textContent = 'Hindi Diwas Banner';

  const presetEl = document.getElementById('bulkBannerPreset');
  if (presetEl) presetEl.value = '/img/hindidiwas.png';

  const editBanner = document.getElementById('editingBatchBanner');
  if (editBanner) editBanner.classList.add('hidden');

  const btnLabel = document.getElementById('applyBatchBtnLabel');
  if (btnLabel) btnLabel.textContent = 'Save & Apply Schedule';

  updateSelectedCountUI();

  if (!silent) {
    toast('Schedule form cleared. You can now choose quizzes to schedule a new competition.', 'info');
  }
}

function formatDateTimeForInput(date) {
  if (!date || isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toggleSelectQuiz(id, isChecked) {
  if (isChecked) {
    selectedQuizIds.add(id);
  } else {
    selectedQuizIds.delete(id);
  }
  updateSelectedCountUI();
}

function selectAllQuizzes(select) {
  const cbs = document.querySelectorAll('.sched-quiz-cb');
  cbs.forEach((cb) => {
    cb.checked = select;
    const id = cb.value;
    if (select) {
      selectedQuizIds.add(id);
    } else {
      selectedQuizIds.delete(id);
    }
  });
  updateSelectedCountUI();
}

function updateSelectedCountUI() {
  const badge = document.getElementById('selectedCountBadge');
  const label = document.getElementById('quizDropdownLabel');
  const pills = document.getElementById('selectedQuizPills');
  const count = selectedQuizIds.size;

  if (badge) {
    badge.textContent = `${count} Selected`;
    badge.className = count > 0
      ? 'px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm'
      : 'px-2 py-0.5 rounded-full text-xs font-bold bg-slate-700 text-slate-300';
  }

  if (label) {
    if (count === 0) {
      label.textContent = 'Choose quizzes from list...';
      label.className = 'text-slate-400 truncate';
    } else if (count === 1) {
      const selectedId = Array.from(selectedQuizIds)[0];
      const match = allQuizzes.find(q => q._id === selectedId);
      label.textContent = match ? match.name : '1 Quiz Selected';
      label.className = 'text-white font-medium truncate';
    } else {
      label.textContent = `${count} quizzes selected`;
      label.className = 'text-white font-medium truncate';
    }
  }

  if (pills) {
    if (count === 0) {
      pills.innerHTML = '<span class="text-xs text-slate-500 italic">No quizzes selected yet. Click the dropdown above to choose.</span>';
    } else {
      pills.innerHTML = Array.from(selectedQuizIds).map(id => {
        const q = allQuizzes.find(item => item._id === id);
        const name = q ? q.name : id;
        return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs font-medium">
          <span class="truncate max-w-[200px]">${esc(name)}</span>
          <button type="button" onclick="removeSelectedQuiz('${id}')" class="text-indigo-400 hover:text-white font-bold text-xs">✕</button>
        </span>
        `;
      }).join('');
    }
  }

  const titleInput = document.getElementById('bulkCompetitionTitle');
  if (titleInput && selectedQuizIds.size > 0) {
    const firstId = Array.from(selectedQuizIds)[0];
    const match = allQuizzes.find((q) => q._id === firstId);
    if (match) {
      const cleanBase = (match.name || '')
        .replace(/\s*[-–—]\s*(Class|Grade|Kaksha)\s*\d+/i, '')
        .trim();
      titleInput.placeholder = cleanBase || 'e.g. Gandhi Jayanti Special Quiz';
      if (!titleInput.value) {
        titleInput.value = cleanBase;
      }
    }
  }
}

function removeSelectedQuiz(id) {
  selectedQuizIds.delete(id);
  const cb = document.querySelector(`.sched-quiz-cb[value="${id}"]`);
  if (cb) cb.checked = false;
  updateSelectedCountUI();
}

function autoCalculateScheduleTiming() {
  const startVal = document.getElementById('bulkStartDate')?.value;
  const endVal = document.getElementById('bulkEndDate')?.value;
  const timingInput = document.getElementById('bulkTimingText');
  if (!startVal || !endVal || !timingInput) return;

  const s = new Date(startVal);
  const e = new Date(endVal);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e <= s) return;

  const diffMs = e.getTime() - s.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));

  const formatTime12 = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  if (diffMins <= 1440) {
    const timeRange = `${formatTime12(s)} – ${formatTime12(e)}`;
    const durStr = diffMins % 60 === 0 ? `${diffMins / 60} Hr` : `${(diffMins / 60).toFixed(1)} Hr`;
    timingInput.value = `${timeRange} (${durStr})`;
  } else {
    const days = Math.round(diffMins / 1440);
    timingInput.value = `${days} Days Window`;
  }
}

async function applyBatchSchedule() {
  if (selectedQuizIds.size === 0) {
    toast('Please select at least one quiz from the dropdown.', 'error');
    const trigger = document.getElementById('quizDropdownTrigger');
    if (trigger) trigger.focus();
    return;
  }

  const startVal = document.getElementById('bulkStartDate').value;
  const endVal = document.getElementById('bulkEndDate').value;
  const timingVal = document.getElementById('bulkTimingText').value.trim();
  const bannerUrl = document.getElementById('bulkBannerUrl')?.value?.trim() || '/img/hindidiwas.png';
  const competitionTitle = document.getElementById('bulkCompetitionTitle')?.value?.trim() || '';

  const showOnPortal = document.getElementById('bulkShowOnPortal').checked;
  const showTiming = document.getElementById('bulkShowTiming').checked;
  const btn = document.getElementById('applyBatchBtn');

  if (!startVal) {
    toast('Please select a Start Date & Time.', 'error');
    document.getElementById('bulkStartDate').focus();
    return;
  }
  if (!endVal) {
    toast('Please select an End Date & Time.', 'error');
    document.getElementById('bulkEndDate').focus();
    return;
  }

  const startDate = new Date(startVal);
  const endDate = new Date(endVal);

  if (endDate <= startDate) {
    toast('End Date & Time must be after Start Date & Time.', 'error');
    return;
  }

  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));

  const origBtnText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Applying Schedule…';

  try {
    const quizIdsArray = Array.from(selectedQuizIds);
    const res = await API('POST', '/api/admin/quizzes/schedule/batch', {
      quizIds: quizIdsArray,
      batchId: editingBatchId || null,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      timing: timingVal || '00:10 Hours',
      durationMinutes: diffMinutes,
      showTiming,
      isFeaturedOnPortal: showOnPortal,
      bannerUrl: bannerUrl || '/img/hindidiwas.png',
      competitionTitle,
      status: 'Published',
    });

    toast(res.message || 'Schedule applied successfully!', 'success');
    resetScheduleForm(true); // Resets form cleanly so old quizzes are cleared and admin can add new quizzes
    await loadScheduleQuizzes();
    await loadScheduledBatches();
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = origBtnText;
  }
}

async function loadScheduledBatches() {
  const container = document.getElementById('scheduledBatchesList');
  if (!container) return;

  try {
    const res = await API('GET', '/api/admin/quizzes/schedule/batches');
    const batches = res.batches || [];
    if (!batches.length) {
      container.innerHTML = `
        <div class="p-8 text-center card col-span-full border border-slate-700/60 text-slate-400">
          <p class="text-sm font-semibold text-white mb-1">No scheduled batches or competitions yet</p>
          <p class="text-xs text-slate-500">Select multiple class quizzes above, set their date and banner, and click "Save & Apply Schedule".</p>
        </div>
      `;
      return;
    }

    container.innerHTML = batches.map((b) => {
      const sDate = b.startDate ? new Date(b.startDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Immediate';
      const eDate = b.endDate ? new Date(b.endDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'No Expiry';

      let badgeCls = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      if (b.scheduleStatus === 'Past') badgeCls = 'bg-slate-700 text-slate-300 border-slate-600';
      if (b.scheduleStatus === 'Upcoming') badgeCls = 'bg-amber-500/20 text-amber-300 border-amber-500/30';

      const classTags = (b.quizzes || []).map((q) => {
        const clsLabel = q.targetClass && q.targetClass !== 'All' ? q.targetClass : 'All';
        return `<span class="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">${esc(clsLabel)}</span>`;
      }).join(' ');

      return `
        <div class="card p-4 border border-slate-700/80 bg-slate-800/90 rounded-2xl shadow-xl flex flex-col justify-between gap-3 relative overflow-hidden group hover:border-indigo-500/50 transition">
          <div class="flex items-start gap-3.5">
            <img src="${esc(b.bannerUrl || '/img/hindidiwas.png')}" alt="Thumb" class="w-20 h-14 object-cover rounded-xl border border-slate-700 bg-slate-900 shrink-0 shadow-md">
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2 mb-1">
                <h4 class="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition">${esc(b.batchName)}</h4>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badgeCls}">${b.scheduleStatus}</span>
              </div>
              <p class="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 mb-1.5">
                <span class="inline-flex items-center gap-1"><svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>1 Showcase Card on Portal</span>
                <span class="text-slate-500">·</span>
                <span class="text-slate-300">${b.quizCount} Class Quiz${b.quizCount > 1 ? 'zes' : ''}</span>
              </p>
              <div class="flex flex-wrap gap-1">
                ${classTags}
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <div class="space-y-0.5">
              <div><span class="text-slate-500 font-medium">Schedule:</span> <span class="text-slate-200">${sDate} → ${eDate}</span></div>
              <div><span class="text-slate-500 font-medium">Timing:</span> <span class="text-amber-300 font-medium">${esc(b.timing)}</span></div>
            </div>
            <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button onclick="editScheduledBatch('${esc(b.batchId)}')" class="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1.5" title="Load into scheduler">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                <span>Edit</span>
              </button>
              <button onclick="deleteScheduledBatch('${esc(b.batchId)}')" class="btn-danger text-xs py-1.5 px-2.5 flex items-center gap-1.5" title="Unpublish batch">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                <span>Unpublish</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-rose-400 card col-span-full border border-slate-700/60">Failed to load batches: ${err.message}</div>`;
  }
}

async function deleteScheduledBatch(batchId) {
  if (!confirm('Are you sure you want to remove/unpublish this scheduled competition batch? The quizzes will be set back to draft.')) return;
  try {
    const res = await API('DELETE', `/api/admin/quizzes/schedule/batch/${encodeURIComponent(batchId)}`);
    toast(res.message || 'Batch unpublished successfully!', 'success');
    resetScheduleForm(true);
    await loadScheduleQuizzes();
    await loadScheduledBatches();
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

async function editScheduledBatch(batchId) {
  try {
    const res = await API('GET', '/api/admin/quizzes/schedule/batches');
    const batch = (res.batches || []).find((b) => b.batchId === batchId);
    if (!batch) return toast('Batch details not found', 'error');

    editingBatchId = batch.batchId;

    // Show editing banner
    const editBanner = document.getElementById('editingBatchBanner');
    const editNameDisplay = document.getElementById('editingBatchNameDisplay');
    if (editBanner) editBanner.classList.remove('hidden');
    if (editNameDisplay) editNameDisplay.textContent = batch.batchName || 'Competition';

    const btnLabel = document.getElementById('applyBatchBtnLabel');
    if (btnLabel) btnLabel.textContent = 'Update Batch Schedule';

    // Pre-fill fields
    if (batch.batchName) document.getElementById('bulkCompetitionTitle').value = batch.batchName;
    if (batch.startDate) document.getElementById('bulkStartDate').value = formatDateTimeForInput(new Date(batch.startDate));
    if (batch.endDate) document.getElementById('bulkEndDate').value = formatDateTimeForInput(new Date(batch.endDate));
    if (batch.timing) document.getElementById('bulkTimingText').value = batch.timing;
    if (batch.bannerUrl) {
      document.getElementById('bulkBannerUrl').value = batch.bannerUrl;
      const img = document.getElementById('bulkBannerPreviewImg');
      if (img) img.src = batch.bannerUrl;
      const nameEl = document.getElementById('bulkBannerPreviewName');
      if (nameEl) nameEl.textContent = 'Batch Banner';
    }

    // Select the batch quizzes
    selectedQuizIds.clear();
    (batch.quizzes || []).forEach((q) => selectedQuizIds.add(q._id));

    // Check all corresponding checkboxes
    const cbs = document.querySelectorAll('.sched-quiz-cb');
    cbs.forEach((cb) => {
      cb.checked = selectedQuizIds.has(cb.value);
    });
    updateSelectedCountUI();

    // Scroll smoothly to top of scheduler
    document.getElementById('section-schedule').scrollIntoView({ behavior: 'smooth' });
    toast(`Loaded "${batch.batchName}" for editing. Update fields and save, or click "Schedule New Quiz" to reset.`, 'info');
  } catch (err) {
    toast('Error loading batch: ' + err.message, 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════
//  STANDALONE QUESTIONS VIEW
// ═══════════════════════════════════════════════════════════════════
async function loadQuestions() {
  try {
    const qFilter = document.getElementById('qQuizFilter').value;
    const sFilter = document.getElementById('qSubjectFilter').value;
    const search = document.getElementById('qSearch').value;
    let url = '/api/admin/questions?';
    if (qFilter) url += `quizId=${qFilter}&`;
    if (sFilter) url += `subjectId=${sFilter}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    const data = await API('GET', url);
    populateQuizFilter('qQuizFilter');
    populateSubjectFilter('qSubjectFilter');

    const container = document.getElementById('questionsList');
    if (!data.questions.length) {
      container.innerHTML = `<div class="card p-12 text-center text-slate-500">No questions found.</div>`;
      return;
    }
    container.innerHTML = data.questions.map((q, i) => `
      <div class="card p-4 flex items-start gap-4 fade-in">
        <div class="text-slate-600 font-mono text-xs pt-1 min-w-[2rem] text-right">${i + 1}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1">
              <p class="text-white text-sm font-medium leading-snug">${esc(q.question)}</p>
              <div class="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                ${q.quizId ? `<span class="px-2 py-0.5 bg-slate-700 rounded-md text-slate-300 font-medium">${esc(q.quizId.name || '')}</span>` : ''}
                ${q.subjectId ? `<span class="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md font-semibold">${esc(q.subjectId.name || '')}</span>` : ''}
                <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md font-bold">Ans: ${q.correctAnswer}</span>
                ${q.imageUrl ? `<span class="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md inline-flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>Image</span>` : ''}
                ${q.audioUrl ? `<span class="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-md inline-flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M9 19V6l12-3v13"/></svg>Audio</span>` : ''}
              </div>
            </div>
            <div class="flex gap-1.5 flex-shrink-0">
              <button onclick="previewQuestion(${JSON.stringify(q).replace(/"/g, '&quot;')})" class="btn-sm bg-slate-700 text-slate-200 hover:bg-slate-600 inline-flex items-center gap-1" title="Preview"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>Preview</button>
              <button onclick="editQuestion(${JSON.stringify(q).replace(/"/g, '&quot;')})" class="btn-sm bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30">Edit</button>
              <button onclick="deleteQuestion('${q._id}')" class="btn-sm bg-rose-600/20 text-rose-400 hover:bg-rose-600/30">Del</button>
            </div>
          </div>
        </div>
      </div>`).join('');
  } catch (e) { toast('Failed to load questions: ' + e.message, 'error'); }
}

function filterQuestions() { loadQuestions(); }

function openAddQuestionModal(preselectedQuizId = '') {
  document.getElementById('questionId').value = '';
  document.getElementById('questionQuizId').value = preselectedQuizId;
  document.getElementById('questionSubjectId').value = '';
  document.getElementById('questionText').value = '';
  document.getElementById('optionA').value = '';
  document.getElementById('optionB').value = '';
  document.getElementById('optionC').value = '';
  document.getElementById('optionD').value = '';
  document.getElementById('correctAnswer').value = '';
  document.getElementById('explanation').value = '';
  document.getElementById('questionImageUrl').value = '';
  document.getElementById('questionImagePublicId').value = '';
  document.getElementById('questionAudioUrl').value = '';
  document.getElementById('questionAudioPublicId').value = '';
  document.getElementById('imagePreview').classList.add('hidden');
  document.getElementById('audioPreview').classList.add('hidden');
  document.getElementById('imageUploadStatus').textContent = '';
  document.getElementById('audioUploadStatus').textContent = '';
  document.getElementById('questionModalTitle').textContent = 'Add Question';
  document.getElementById('questionSaveLabel').textContent = 'Add Question';
  populateSelectDropdowns();
  openModal('questionModal');
}

function editQuestion(q) {
  document.getElementById('questionId').value = q._id;
  document.getElementById('questionText').value = q.question;
  document.getElementById('optionA').value = q.options?.A || '';
  document.getElementById('optionB').value = q.options?.B || '';
  document.getElementById('optionC').value = q.options?.C || '';
  document.getElementById('optionD').value = q.options?.D || '';
  document.getElementById('correctAnswer').value = q.correctAnswer;
  document.getElementById('explanation').value = q.explanation || '';
  document.getElementById('questionImageUrl').value = q.imageUrl || '';
  document.getElementById('questionImagePublicId').value = q.imagePublicId || '';
  document.getElementById('questionAudioUrl').value = q.audioUrl || '';
  document.getElementById('questionAudioPublicId').value = q.audioPublicId || '';
  document.getElementById('questionModalTitle').textContent = 'Edit Question';
  document.getElementById('questionSaveLabel').textContent = 'Update Question';

  if (q.imageUrl) {
    document.getElementById('imagePreviewImg').src = q.imageUrl;
    document.getElementById('imagePreview').classList.remove('hidden');
  } else {
    document.getElementById('imagePreview').classList.add('hidden');
  }
  if (q.audioUrl) {
    document.getElementById('audioPreviewPlayer').src = q.audioUrl;
    document.getElementById('audioPreview').classList.remove('hidden');
  } else {
    document.getElementById('audioPreview').classList.add('hidden');
  }

  populateSelectDropdowns(q);
  openModal('questionModal');
}

function populateSelectDropdowns(q = null) {
  const quizSel = document.getElementById('questionQuizId');
  const subSel = document.getElementById('questionSubjectId');
  quizSel.innerHTML = '<option value="">Select Quiz</option>' + allQuizzes.map(quiz => `<option value="${quiz._id}" ${q && (q.quizId?._id || q.quizId) == quiz._id ? 'selected' : ''}>${esc(quiz.name)}</option>`).join('');
  subSel.innerHTML = '<option value="">No Subject</option>' + allSubjects.map(s => `<option value="${s._id}" ${q && (q.subjectId?._id || q.subjectId) == s._id ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
}

async function saveQuestion() {
  const id = document.getElementById('questionId').value;
  const body = {
    quizId: document.getElementById('questionQuizId').value,
    subjectId: document.getElementById('questionSubjectId').value || null,
    question: document.getElementById('questionText').value.trim(),
    options: {
      A: document.getElementById('optionA').value.trim(),
      B: document.getElementById('optionB').value.trim(),
      C: document.getElementById('optionC').value.trim(),
      D: document.getElementById('optionD').value.trim(),
    },
    correctAnswer: document.getElementById('correctAnswer').value,
    explanation: document.getElementById('explanation').value.trim(),
    imageUrl: document.getElementById('questionImageUrl').value,
    imagePublicId: document.getElementById('questionImagePublicId').value,
    audioUrl: document.getElementById('questionAudioUrl').value,
    audioPublicId: document.getElementById('questionAudioPublicId').value,
  };
  if (!body.quizId || !body.question || !body.options.A || !body.options.B || !body.options.C || !body.options.D || !body.correctAnswer) {
    toast('Please fill in all required fields.', 'error'); return;
  }
  try {
    if (id) {
      await API('PUT', `/api/admin/questions/${id}`, body);
      toast('Question updated', 'success');
    } else {
      await API('POST', '/api/admin/questions', body);
      toast('Question added', 'success');
    }
    closeModal('questionModal');
    loadQuestions();
    loadQuizzesData();
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteQuestion(id) {
  confirmAction('Delete Question', 'Are you sure you want to permanently delete this question?', async () => {
    try {
      await API('DELETE', `/api/admin/questions/${id}`);
      toast('Question deleted', 'success');
      loadQuestions();
      loadQuizzesData();
    } catch (e) { toast(e.message, 'error'); }
  });
}

function previewQuestion(q) {
  const optionColors = { A: 'bg-indigo-500/10 text-indigo-300', B: 'bg-purple-500/10 text-purple-300', C: 'bg-sky-500/10 text-sky-300', D: 'bg-teal-500/10 text-teal-300' };
  document.getElementById('previewContent').innerHTML = `
    ${q.imageUrl ? `<img src="${q.imageUrl}" alt="Question image" class="max-h-64 rounded-xl border border-slate-700 object-cover mb-4">` : ''}
    ${q.audioUrl ? `<audio controls class="w-full mb-4"><source src="${q.audioUrl}"></audio>` : ''}
    <p class="text-white text-base font-medium mb-4">${esc(q.question)}</p>
    <div class="space-y-2">
      ${['A', 'B', 'C', 'D'].map(k => `
        <div class="flex items-center gap-3 p-3 rounded-xl border ${q.correctAnswer === k ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-700/30'}">
          <span class="font-bold text-sm ${optionColors[k]} px-2 py-0.5 rounded-lg">${k}</span>
          <span class="text-sm text-slate-200">${esc(q.options?.[k] || '')}</span>
          ${q.correctAnswer === k ? '<span class="ml-auto text-emerald-400 text-xs font-bold">✓ Correct</span>' : ''}
        </div>`).join('')}
    </div>
    ${q.explanation ? `<div class="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl"><p class="text-amber-300 text-xs"><span class="font-bold">Explanation:</span> ${esc(q.explanation)}</p></div>` : ''}
  `;
  openModal('previewModal');
}

// ─── Standalone Media Upload Handlers ────────────────────────────────────────
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const status = document.getElementById('imageUploadStatus');
  status.textContent = 'Uploading image…';
  try {
    const fd = new FormData();
    fd.append('image', file);
    const data = await API('POST', '/api/admin/upload/image', fd, true);
    document.getElementById('questionImageUrl').value = data.imageUrl;
    document.getElementById('questionImagePublicId').value = data.publicId || '';
    document.getElementById('imagePreviewImg').src = data.imageUrl;
    document.getElementById('imagePreview').classList.remove('hidden');
    status.textContent = '✓ Image uploaded';
    status.className = 'text-xs text-emerald-400 mt-1';
  } catch (e) {
    status.textContent = '✕ Upload failed: ' + e.message;
    status.className = 'text-xs text-rose-400 mt-1';
  }
}

function removeImage() {
  document.getElementById('questionImageUrl').value = '';
  document.getElementById('questionImagePublicId').value = '';
  document.getElementById('imagePreview').classList.add('hidden');
  document.getElementById('imageFileInput').value = '';
  document.getElementById('imageUploadStatus').textContent = '';
}

async function handleAudioUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const status = document.getElementById('audioUploadStatus');
  status.textContent = 'Uploading audio…';
  try {
    const fd = new FormData();
    fd.append('audio', file);
    const data = await API('POST', '/api/admin/upload/audio', fd, true);
    document.getElementById('questionAudioUrl').value = data.audioUrl;
    document.getElementById('questionAudioPublicId').value = data.publicId || '';
    document.getElementById('audioPreviewPlayer').src = data.audioUrl;
    document.getElementById('audioPreview').classList.remove('hidden');
    status.textContent = '✓ Audio uploaded';
    status.className = 'text-xs text-emerald-400 mt-1';
  } catch (e) {
    status.textContent = '✕ Upload failed: ' + e.message;
    status.className = 'text-xs text-rose-400 mt-1';
  }
}

function removeAudio() {
  document.getElementById('questionAudioUrl').value = '';
  document.getElementById('questionAudioPublicId').value = '';
  document.getElementById('audioPreview').classList.add('hidden');
  document.getElementById('audioFileInput').value = '';
  document.getElementById('audioUploadStatus').textContent = '';
}

// ═══════════════════════════════════════════════════════════════════
//  SUBJECTS
// ═══════════════════════════════════════════════════════════════════
async function loadSubjectsData() {
  const data = await fetch('/api/subjects').then(r => r.json());
  allSubjects = data.subjects || [];
}

async function loadSubjects() {
  try {
    await loadSubjectsData();
    const container = document.getElementById('subjectsList');
    if (!allSubjects.length) {
      container.innerHTML = `<div class="card p-12 text-center text-slate-500 col-span-3">No subjects yet. Add your first subject.</div>`;
      return;
    }
    container.innerHTML = allSubjects.map(s => `
      <div class="card p-5 flex items-center justify-between fade-in">
        <div>
          <div class="text-white font-semibold">${esc(s.name)}</div>
          <div class="text-slate-500 text-xs mt-1">Created ${fmtDate(s.createdAt)}</div>
        </div>
        <div class="flex gap-2">
          <button onclick="editSubject('${s._id}','${esc(s.name)}')" class="btn-sm bg-slate-700 text-slate-200 hover:bg-slate-600">Edit</button>
          <button onclick="deleteSubject('${s._id}')" class="btn-sm bg-rose-600/20 text-rose-400 hover:bg-rose-600/30">Del</button>
        </div>
      </div>`).join('');
  } catch (e) { toast('Failed to load subjects: ' + e.message, 'error'); }
}

function openSubjectModal() {
  document.getElementById('subjectId').value = '';
  document.getElementById('subjectName').value = '';
  document.getElementById('subjectModalTitle').textContent = 'Add Subject';
  document.getElementById('subjectSaveLabel').textContent = 'Add Subject';
  openModal('subjectModal');
}

function editSubject(id, name) {
  document.getElementById('subjectId').value = id;
  document.getElementById('subjectName').value = name;
  document.getElementById('subjectModalTitle').textContent = 'Edit Subject';
  document.getElementById('subjectSaveLabel').textContent = 'Update Subject';
  openModal('subjectModal');
}

async function saveSubject() {
  const id = document.getElementById('subjectId').value;
  const name = document.getElementById('subjectName').value.trim();
  if (!name) { toast('Subject name required', 'error'); return; }
  try {
    if (id) {
      await API('PUT', `/api/admin/subjects/${id}`, { name });
      toast('Subject updated', 'success');
    } else {
      await API('POST', '/api/admin/subjects', { name });
      toast('Subject added', 'success');
    }
    closeModal('subjectModal');
    await loadSubjectsData();
    loadSubjects();
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteSubject(id) {
  confirmAction('Delete Subject', 'Are you sure you want to delete this subject?', async () => {
    try {
      await API('DELETE', `/api/admin/subjects/${id}`);
      toast('Subject deleted', 'success');
      await loadSubjectsData();
      loadSubjects();
    } catch (e) { toast(e.message, 'error'); }
  });
}

// ═══════════════════════════════════════════════════════════════════
//  STUDENTS MANAGEMENT (REPLACED RESULTS)
// ═══════════════════════════════════════════════════════════════════

let currentStudentsList = [];
let studentSearchTimer = null;
let currentStudentPage = 1;

function debounceLoadStudents() {
  if (studentSearchTimer) clearTimeout(studentSearchTimer);
  studentSearchTimer = setTimeout(() => {
    loadStudents(1);
  }, 250);
}

function clearStudentFilters() {
  const ids = ['stSearch', 'stClassFilter', 'stQuizFilter', 'stStatusFilter', 'stResultFilter', 'stGenderFilter', 'stStateFilter'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const sortEl = document.getElementById('stSortBy');
  if (sortEl) sortEl.value = 'newest';

  toast('Filters cleared — showing all registered students', 'info');
  loadStudents(1);
}

async function loadStudents(page = 1) {
  try {
    currentStudentPage = page;
    const search = document.getElementById('stSearch')?.value || document.getElementById('rSearch')?.value || '';
    const studentClass = document.getElementById('stClassFilter')?.value || '';
    const quizId = document.getElementById('stQuizFilter')?.value || document.getElementById('rQuizFilter')?.value || '';
    const status = document.getElementById('stStatusFilter')?.value || '';
    const completionStatus = document.getElementById('stResultFilter')?.value || document.getElementById('rResultFilter')?.value || '';
    const gender = document.getElementById('stGenderFilter')?.value || '';
    const state = document.getElementById('stStateFilter')?.value || '';
    const sortBy = document.getElementById('stSortBy')?.value || document.getElementById('rSortBy')?.value || 'newest';

    let url = `/api/admin/students?limit=50&page=${page}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (studentClass) url += `class=${encodeURIComponent(studentClass)}&`;
    if (quizId) url += `quizId=${encodeURIComponent(quizId)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;
    if (completionStatus) url += `completionStatus=${encodeURIComponent(completionStatus)}&`;
    if (gender) url += `gender=${encodeURIComponent(gender)}&`;
    if (state) url += `state=${encodeURIComponent(state)}&`;
    url += `sortBy=${sortBy}`;

    const data = await API('GET', url);
    populateQuizFilter('stQuizFilter');
    populateQuizFilter('rQuizFilter');

    currentStudentsList = data.students || [];

    // Update Quick Stats Counter
    if (data.stats) {
      const elTotal = document.getElementById('stStatTotal');
      const elAtt = document.getElementById('stStatAttempted');
      const elNotAtt = document.getElementById('stStatNotAttempted');
      const elPass = document.getElementById('stStatPassed');
      const elFail = document.getElementById('stStatFailed');
      if (elTotal) elTotal.textContent = data.stats.total;
      if (elAtt) elAtt.textContent = data.stats.attempted;
      if (elNotAtt) elNotAtt.textContent = data.stats.notAttempted;
      if (elPass) elPass.textContent = data.stats.passed;
      if (elFail) elFail.textContent = data.stats.failed;
    }

    const tbody = document.getElementById('studentsTable') || document.getElementById('resultsTable');
    if (!tbody) return;

    if (!data.students || !data.students.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" class="py-12 text-center text-slate-500">
            <div class="flex flex-col items-center justify-center gap-2">
              <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span class="font-semibold text-slate-400">No students found matching your criteria.</span>
              <button onclick="clearStudentFilters()" class="btn-sm bg-indigo-600/80 text-white hover:bg-indigo-600 mt-2">
                Clear Filters
              </button>
            </div>
          </td>
        </tr>`;
      renderStudentPagination(0, 1, 1);
      return;
    }

    tbody.innerHTML = data.students.map((s, idx) => {
      // Determine rank display
      let rankHtml = '<span class="text-slate-500 font-mono text-xs">—</span>';
      if (s.rank && (sortBy === 'completed_earliest' || sortBy === 'score_high' || sortBy === 'completed_latest')) {
        let badgeColor = 'bg-slate-700 text-slate-300';
        if (s.rank === 1) badgeColor = 'bg-amber-400 text-slate-950 font-black shadow-sm';
        else if (s.rank === 2) badgeColor = 'bg-slate-200 text-slate-900 font-black';
        else if (s.rank === 3) badgeColor = 'bg-amber-700 text-amber-100 font-black';
        rankHtml = `<span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${badgeColor}">${s.rank}</span>`;
      } else {
        const rowNum = (page - 1) * 50 + idx + 1;
        rankHtml = `<span class="text-slate-500 font-mono text-xs">${rowNum}</span>`;
      }

      // Quiz Status Badge
      let statusBadge = `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-700/60 text-slate-400">Not Attempted</span>`;
      if (s.quizStatus === 'Pass' || s.quizStatus === 'Passed') {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Passed</span>`;
      } else if (s.quizStatus === 'Fail' || s.quizStatus === 'Better Luck Next Time') {
        statusBadge = `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">Better Luck Next Time</span>`;
      }

      // Score & Completion
      const scoreDisplay = s.latestScore !== '—'
        ? `<span class="font-bold text-white">${s.latestScore}</span> <span class="text-slate-400 text-[11px]">(${s.latestPercentage}%)</span>`
        : `<span class="text-slate-500">—</span>`;

      const completionDisplay = s.completionTime
        ? `<span class="text-slate-300 font-mono text-xs">${fmtDateTime(s.completionTime)}</span>`
        : `<span class="text-slate-500 text-xs">Not taken yet</span>`;

      return `
        <tr class="hover:bg-slate-700/25 transition group">
          <td class="px-3.5 py-3 text-center">${rankHtml}</td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2.5 cursor-pointer" onclick="viewStudentProfile('${s._id}')">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                ${esc((s.firstName || s.name || '?')[0].toUpperCase())}
              </div>
              <div>
                <div class="font-bold text-white hover:text-indigo-400 transition text-sm flex items-center gap-1.5">
                  <span>${esc(s.name || `${s.firstName} ${s.lastName}`)}</span>
                </div>
                <div class="font-mono text-[10px] text-slate-400">${esc(s.studentIdentifier || '')}</div>
              </div>
            </div>
          </td>
          <td class="px-4 py-3 text-slate-300 text-xs break-all">${esc(s.email)}</td>
          <td class="px-3 py-3">
            <span class="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              ${esc(s.class || '—')}
            </span>
          </td>
          <td class="px-4 py-3 text-slate-300 text-xs max-w-[160px] truncate" title="${esc(s.schoolName || '')}">
            ${esc(s.schoolName || '—')}
          </td>
          <td class="px-3.5 py-3 text-slate-400 text-xs whitespace-nowrap">
            ${fmtDateOnly(s.createdAt)}
          </td>
          <td class="px-3 py-3 text-center whitespace-nowrap">
            ${statusBadge}
          </td>
          <td class="px-4 py-3 text-slate-300 text-xs max-w-[150px] truncate" title="${esc(s.latestQuizName)}">
            <span class="font-medium">${esc(s.latestQuizName)}</span>
            ${s.latestSubject ? `<span class="block text-[10px] text-indigo-400">${esc(s.latestSubject)}</span>` : ''}
          </td>
          <td class="px-3 py-3 text-center whitespace-nowrap">
            ${scoreDisplay}
          </td>
          <td class="px-4 py-3 text-xs whitespace-nowrap">
            ${completionDisplay}
          </td>
          <td class="px-3.5 py-3 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="viewStudentProfile('${s._id}')"
                class="btn-sm bg-slate-700/80 hover:bg-slate-600 text-slate-200 text-xs px-2.5 py-1 flex items-center gap-1.5 cursor-pointer"
                title="View student profile and quiz history">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </button>
              ${s.certificateId ? `
                <button onclick="downloadPdf('${s.latestAttemptId}', 'certificate', '${esc(s.studentIdentifier)}')"
                  class="btn-sm bg-indigo-700/80 hover:bg-indigo-600 text-white text-xs px-2.5 py-1 flex items-center gap-1.5 cursor-pointer"
                  title="Download Certificate">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>Certificate</span>
                </button>
              ` : ''}
              <button onclick="deleteStudent('${s._id}', '${esc(s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student')}')"
                class="btn-sm bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs px-2.5 py-1 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Delete Student">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');

    renderStudentPagination(data.total, data.page, data.pages);
  } catch (e) {
    toast('Failed to load students: ' + e.message, 'error');
  }
}

function renderStudentPagination(total, page, pages) {
  const infoEl = document.getElementById('stPaginationInfo');
  const btnsEl = document.getElementById('stPaginationBtns');
  if (infoEl) {
    infoEl.textContent = `Showing page ${page} of ${pages || 1} (${total} registered student${total === 1 ? '' : 's'})`;
  }
  if (!btnsEl) return;

  if (pages <= 1) {
    btnsEl.innerHTML = '';
    return;
  }

  let html = '';
  if (page > 1) {
    html += `<button onclick="loadStudents(${page - 1})" class="btn-secondary text-xs px-2.5 py-1">Previous</button>`;
  }
  html += `<span class="px-2 text-xs text-slate-400 font-bold">${page} / ${pages}</span>`;
  if (page < pages) {
    html += `<button onclick="loadStudents(${page + 1})" class="btn-secondary text-xs px-2.5 py-1">Next</button>`;
  }
  btnsEl.innerHTML = html;
}

// ─── Single Student Profile Detail Modal ──────────────────────────────────────
async function viewStudentProfile(studentId) {
  try {
    toast('Loading student profile...', 'info');
    const res = await API('GET', `/api/admin/students/${studentId}`);
    if (!res.success || !res.student) {
      toast('Student details not found.', 'error');
      return;
    }

    const s = res.student;
    const attempts = res.attempts || [];

    // Header elements
    const avatarEl = document.getElementById('sdAvatar');
    if (avatarEl) avatarEl.textContent = (s.firstName || s.name || '?')[0].toUpperCase();

    const nameEl = document.getElementById('sdName');
    if (nameEl) nameEl.textContent = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim();

    const idEl = document.getElementById('sdIdentifier');
    if (idEl) idEl.textContent = s.studentIdentifier || 'No ID';

    const classSchoolEl = document.getElementById('sdClassSchool');
    if (classSchoolEl) classSchoolEl.textContent = `${s.class || s.className || 'Class —'} • ${s.schoolName || 'School —'}`;

    // Profile Details
    const fill = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || '—';
    };

    fill('sdFullName', `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name);
    fill('sdEmail', s.email);
    fill('sdMobile', s.mobileNumber || 'Not Provided');
    fill('sdClass', s.class || s.className);
    fill('sdSchool', s.schoolName);
    fill('sdDob', s.dateOfBirth || s.dob);
    fill('sdGender', s.gender);
    fill('sdState', s.state);
    fill('sdPinCode', s.pinCode);
    fill('sdAddress', s.address);
    fill('sdParticipation', s.previousQuizParticipation || s.participatedEarlier || 'No');
    fill('sdRegisteredAt', fmtDateTime(s.createdAt));

    // Attempts
    const countEl = document.getElementById('sdAttemptsCount');
    if (countEl) countEl.textContent = `${attempts.length} Quiz Attempt${attempts.length === 1 ? '' : 's'}`;

    const attemptsTbody = document.getElementById('sdAttemptsTable');
    if (attemptsTbody) {
      if (!attempts.length) {
        attemptsTbody.innerHTML = '<tr><td colspan="7" class="py-6 text-center text-slate-500">This student has not attempted any quizzes yet.</td></tr>';
      } else {
        attemptsTbody.innerHTML = attempts.map(att => `
          <tr class="hover:bg-slate-700/30 transition">
            <td class="px-3 py-2.5 font-medium text-white">${esc(att.quizName)}</td>
            <td class="px-3 py-2.5 text-indigo-400 font-semibold">${esc(att.subject || 'General')}</td>
            <td class="px-3 py-2.5 text-center font-bold text-white">${att.score}/${att.totalQuestions}</td>
            <td class="px-3 py-2.5 text-center text-slate-300 font-mono">${att.percentage}%</td>
            <td class="px-3 py-2.5 text-center">
              <span class="${att.percentage >= 50 ? 'badge-pass' : 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30'} text-[10px] px-2 py-0.5">${att.percentage >= 50 ? (att.result || 'Passed') : 'Better Luck Next Time'}</span>
            </td>
            <td class="px-3 py-2.5 text-slate-300 font-mono text-[11px]">${fmtDateTime(att.submittedAt)}</td>
            <td class="px-3 py-2.5 text-right whitespace-nowrap">
              <div class="flex items-center justify-end gap-1.5">
                <button onclick="downloadPdf('${att._id}', 'pdf', '${esc(s.studentIdentifier)}')"
                  class="btn-sm bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-2.5 py-1 flex items-center gap-1"
                  title="Download Result PDF">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span>Result</span>
                </button>
                ${att.certificateId ? `
                  <button onclick="downloadPdf('${att._id}', 'certificate', '${esc(s.studentIdentifier)}')"
                    class="btn-sm bg-indigo-700/80 hover:bg-indigo-600 text-white text-xs px-2.5 py-1 flex items-center gap-1"
                    title="Download Certificate PDF">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                    <span>Certificate</span>
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `).join('');
      }
    }

    // Connect Delete Student button in profile modal
    const delBtn = document.getElementById('sdDeleteBtn');
    if (delBtn) {
      delBtn.onclick = () => {
        const studentDisplayName = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student';
        deleteStudent(s._id, studentDisplayName, true);
      };
    }

    openModal('studentDetailModal');
  } catch (e) {
    toast('Error loading profile: ' + e.message, 'error');
  }
}

// ─── Delete Student Action ───────────────────────────────────────────────────
async function deleteStudent(studentId, studentName = 'this student', closeDetailModal = false) {
  confirmAction(
    'Delete Student',
    `Are you sure you want to permanently delete "${studentName}" and all associated quiz attempts? This action cannot be undone.`,
    async () => {
      try {
        const res = await API('DELETE', `/api/admin/students/${studentId}`);
        toast(res.message || `Student "${studentName}" deleted successfully.`, 'success');
        if (closeDetailModal) {
          closeModal('studentDetailModal');
        }
        await loadStudents();
      } catch (e) {
        toast('Failed to delete student: ' + e.message, 'error');
      }
    }
  );
}

// Helper: Format date only (e.g. 19 Sep 2026)
function fmtDateOnly(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return d; }
}

// ─── Backward compatibility alias ────────────────────────────────────────────
const loadResults = loadStudents;

let currentResultsList = [];

async function downloadAllCertificates() {
  const listToDownload = currentStudentsList.filter(s => s.certificateId && s.latestAttemptId);
  if (!listToDownload.length) {
    toast('No student certificates available to download in current view.', 'error');
    return;
  }
  toast(`Downloading ${listToDownload.length} certificates...`, 'info');
  for (let i = 0; i < listToDownload.length; i++) {
    const s = listToDownload[i];
    await downloadPdf(s.latestAttemptId, 'certificate', s.studentIdentifier || 'student');
    if (i < listToDownload.length - 1) {
      await new Promise(r => setTimeout(r, 600));
    }
  }
  toast('All certificates downloaded!', 'success');
}

// ─── PDF Download ────────────────────────────────────────────────────────────
async function downloadPdf(attemptId, type, studentIdentifier) {
  try {
    toast('Generating PDF…', 'info');
    const endpoint = type === 'certificate'
      ? `/api/results/${attemptId}/certificate?adminDownload=true`
      : `/api/results/${attemptId}/pdf?studentIdentifier=${encodeURIComponent(studentIdentifier)}`;

    const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${authToken}` } });
    if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${studentIdentifier}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast('PDF downloaded!', 'success');
  } catch (e) { toast('PDF error: ' + e.message, 'error'); }
}

// ─── Filter helpers ───────────────────────────────────────────────────────────
function populateQuizFilter(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">All Quizzes</option>' + allQuizzes.map(q => `<option value="${q._id}" ${q._id === current ? 'selected' : ''}>${esc(q.name)}</option>`).join('');
}

function populateSubjectFilter(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">All Subjects</option>' + allSubjects.map(s => `<option value="${s._id}" ${s._id === current ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
}

// ─── XSS escape ──────────────────────────────────────────────────────────────
function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ═══════════════════════════════════════════════════════════════════
//  CLASSES MANAGEMENT
// ═══════════════════════════════════════════════════════════════════
async function loadClassesData() {
  const data = await API('GET', '/api/admin/classes');
  allClasses = data.classes || [];
}

async function loadClasses() {
  const tbody = document.getElementById('classesTableBody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-slate-500">Loading classes...</td></tr>';
  try {
    if (!allQuizzes.length) {
      await loadQuizzesData();
    }
    await loadClassesData();
    renderClasses();
  } catch (e) {
    toast('Failed to load classes: ' + e.message, 'error');
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-rose-400">Error: ${esc(e.message)}</td></tr>`;
  }
}

function renderClasses() {
  const tbody = document.getElementById('classesTableBody');
  if (!tbody) return;

  if (!allClasses.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500">No classes found. Click "+ Add Class" to create one.</td></tr>`;
    return;
  }

  tbody.innerHTML = allClasses.map(c => {
    const assignedQuiz = c.assignedQuizId;
    const currentQuizId = assignedQuiz?._id || assignedQuiz || '';
    const isActive = c.isActive !== false;

    return `
      <tr class="hover:bg-slate-700/20 transition">
        <td class="px-4 py-3 font-mono text-xs text-slate-400 font-bold">${c.order ?? 0}</td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="font-bold text-white text-sm">${esc(c.name)}</span>
            ${c.displayHindi ? `<span class="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">${esc(c.displayHindi)}</span>` : ''}
          </div>
        </td>
        <td class="px-4 py-3">
          <button onclick="toggleClassActive('${c._id}')"
            class="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${isActive
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
        : 'bg-slate-700/60 text-slate-400 border border-slate-600 hover:bg-slate-700'
      }" title="Click to toggle active on student portal">
            <span class="w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}"></span>
            ${isActive ? 'Active (Visible to students)' : 'Inactive (Hidden)'}
          </button>
        </td>
        <td class="px-4 py-3">
          <select onchange="changeClassQuiz('${c._id}', this.value)"
            class="form-input text-xs py-1.5 px-2.5 max-w-sm bg-slate-800 border-slate-700 focus:border-indigo-500">
            <option value="">-- No Quiz Assigned (None) --</option>
            ${allQuizzes.map(q => `
              <option value="${q._id}" ${q._id === currentQuizId ? 'selected' : ''}>
                ${esc(q.name)} (${q.numberOfQuestions || 10} Qs) [${q.status}]
              </option>
            `).join('')}
          </select>
        </td>
        <td class="px-4 py-3 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="openClassModal('${c._id}')" class="btn-sm bg-slate-700 text-slate-200 hover:bg-slate-600">Edit</button>
            <button onclick="deleteClass('${c._id}')" class="btn-sm bg-rose-600/20 text-rose-400 hover:bg-rose-600/30">Del</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openClassModal(classId = '') {
  const modal = document.getElementById('classModal');
  if (!modal) return;

  const sel = document.getElementById('classAssignedQuiz');
  if (sel) {
    sel.innerHTML = '<option value="">-- No Quiz Assigned (None) --</option>' +
      allQuizzes.map(q => `<option value="${q._id}">${esc(q.name)} (${q.numberOfQuestions || 10} Qs)</option>`).join('');
  }

  if (classId) {
    const c = allClasses.find(item => item._id === classId);
    if (!c) return;
    document.getElementById('classId').value = c._id;
    document.getElementById('className').value = c.name || '';
    document.getElementById('classDisplayHindi').value = c.displayHindi || '';
    document.getElementById('classOrder').value = c.order ?? 0;
    document.getElementById('classIsActive').checked = c.isActive !== false;
    if (sel) {
      sel.value = c.assignedQuizId?._id || c.assignedQuizId || '';
    }
    document.getElementById('classModalTitle').textContent = 'Edit Class';
    document.getElementById('classSaveLabel').textContent = 'Update Class';
  } else {
    document.getElementById('classId').value = '';
    document.getElementById('className').value = '';
    document.getElementById('classDisplayHindi').value = '';
    document.getElementById('classOrder').value = (allClasses.length + 3);
    document.getElementById('classIsActive').checked = true;
    if (sel) sel.value = '';
    document.getElementById('classModalTitle').textContent = 'Add Class';
    document.getElementById('classSaveLabel').textContent = 'Save Class';
  }

  openModal('classModal');
}

async function saveClass() {
  const id = document.getElementById('classId').value;
  const name = document.getElementById('className').value.trim();
  const displayHindi = document.getElementById('classDisplayHindi').value.trim();
  const order = parseInt(document.getElementById('classOrder').value, 10) || 0;
  const isActive = document.getElementById('classIsActive').checked;
  const assignedQuizId = document.getElementById('classAssignedQuiz').value || null;

  if (!name) {
    toast('Class name is required (e.g. Class 9).', 'error');
    return;
  }

  const payload = { name, displayHindi, order, isActive, assignedQuizId };

  try {
    if (id) {
      await API('PUT', `/api/admin/classes/${id}`, payload);
      toast(`Class "${name}" updated successfully.`, 'success');
    } else {
      await API('POST', '/api/admin/classes', payload);
      toast(`Class "${name}" added successfully.`, 'success');
    }
    closeModal('classModal');
    await loadClasses();
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function toggleClassActive(id) {
  try {
    const res = await API('PATCH', `/api/admin/classes/${id}/toggle`);
    toast(res.message || 'Status updated', 'success');
    await loadClasses();
  } catch (e) {
    toast('Failed to toggle status: ' + e.message, 'error');
  }
}

async function changeClassQuiz(id, quizId) {
  try {
    const res = await API('PATCH', `/api/admin/classes/${id}/assign-quiz`, { quizId: quizId || null });
    toast(res.message || 'Quiz assignment updated', 'success');
    const item = allClasses.find(c => c._id === id);
    if (item) item.assignedQuizId = quizId || null;
  } catch (e) {
    toast('Failed to assign quiz: ' + e.message, 'error');
    await loadClasses();
  }
}

async function deleteClass(id) {
  const c = allClasses.find(item => item._id === id);
  const name = c ? c.name : 'this class';
  confirmAction('Delete Class', `Are you sure you want to permanently delete "${name}"?`, async () => {
    try {
      await API('DELETE', `/api/admin/classes/${id}`);
      toast(`Class "${name}" deleted`, 'success');
      await loadClasses();
    } catch (e) {
      toast(e.message, 'error');
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
//  THEME & EXAMINATION BRANDING MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

let currentThemeSettings = {
  topRightImage: '/img/ghadhi.png',
  showTopRightImage: true,
  topRightImageWidth: 160,
  enableBgImage: true,
  bgImage: '/img/polygon_bg.jpg',
  bgColor: '#f3f8fa',
};

async function loadThemeSettings() {
  try {
    const res = await API('GET', '/api/admin/theme');
    if (res && res.theme) {
      currentThemeSettings = { ...currentThemeSettings, ...res.theme };
    }
    populateThemeForm();
  } catch (err) {
    console.warn('Could not load theme settings, using defaults:', err);
    populateThemeForm();
  }
}

function populateThemeForm() {
  const showTopRightEl = document.getElementById('themeShowTopRight');
  const topRightUrlEl = document.getElementById('themeTopRightUrl');
  const topRightWidthEl = document.getElementById('themeTopRightWidth');
  const topRightTopEl = document.getElementById('themeTopRightTop');
  const topRightRightEl = document.getElementById('themeTopRightRight');
  const enableBgImageEl = document.getElementById('themeEnableBgImage');
  const bgColorTextEl = document.getElementById('themeBgColorText');
  const bgImageUrlEl = document.getElementById('themeBgImageUrl');

  if (showTopRightEl) showTopRightEl.value = currentThemeSettings.showTopRightImage !== false ? 'true' : 'false';
  if (topRightUrlEl) topRightUrlEl.value = currentThemeSettings.topRightImage || '/img/ghadhi.png';
  if (topRightWidthEl) topRightWidthEl.value = currentThemeSettings.topRightImageWidth || 160;
  if (topRightTopEl) topRightTopEl.value = currentThemeSettings.topRightTop ?? 80;
  if (topRightRightEl) topRightRightEl.value = currentThemeSettings.topRightRight ?? 40;
  if (enableBgImageEl) enableBgImageEl.value = currentThemeSettings.enableBgImage !== false ? 'true' : 'false';
  if (bgColorTextEl) bgColorTextEl.value = currentThemeSettings.bgColor || '#FAF9F5';
  if (bgImageUrlEl) bgImageUrlEl.value = currentThemeSettings.bgImage || '/img/background.jpg';

  handleThemeControlChange();
}

function handleThemeControlChange() {
  const showTopRight = document.getElementById('themeShowTopRight')?.value !== 'false';
  const topRightUrl = document.getElementById('themeTopRightUrl')?.value.trim() || '/img/ghadhi.png';
  const topRightWidth = Number(document.getElementById('themeTopRightWidth')?.value) || 160;
  const topRightTop = Number(document.getElementById('themeTopRightTop')?.value) ?? 80;
  const topRightRight = Number(document.getElementById('themeTopRightRight')?.value) ?? 40;
  const enableBgImage = document.getElementById('themeEnableBgImage')?.value !== 'false';
  const bgColor = document.getElementById('themeBgColorText')?.value.trim() || '#FAF9F5';
  const bgImageUrl = document.getElementById('themeBgImageUrl')?.value.trim() || '/img/background.jpg';

  // Update Live Simulator
  const simFrame = document.getElementById('themeLiveSimulatorFrame');
  const simTopRightWrapper = document.getElementById('simulatedTopRightWrapper');
  const simTopRightImg = document.getElementById('simulatedTopRightImg');

  // Update Illustration Toggle Button
  const illusBtn = document.getElementById('themeIllustrationToggleBtn');
  const illusDot = document.getElementById('themeIllustrationDot');
  const illusLabel = document.getElementById('themeIllustrationToggleLabel');
  if (illusBtn && illusDot && illusLabel) {
    if (showTopRight) {
      illusBtn.className = 'text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition flex items-center gap-1.5 cursor-pointer';
      illusDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
      illusLabel.textContent = 'Illustration: ON';
    } else {
      illusBtn.className = 'text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-400 border border-slate-600 hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer';
      illusDot.className = 'w-2 h-2 rounded-full bg-slate-500';
      illusLabel.textContent = 'Illustration: OFF';
    }
  }

  // Update Background Image Toggle Button
  const bgBtn = document.getElementById('themeBgToggleBtn');
  const bgDot = document.getElementById('themeBgDot');
  const bgLabel = document.getElementById('themeBgToggleLabel');
  if (bgBtn && bgDot && bgLabel) {
    if (enableBgImage) {
      bgBtn.className = 'text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition flex items-center gap-1.5 cursor-pointer';
      bgDot.className = 'w-2 h-2 rounded-full bg-indigo-400';
      bgLabel.textContent = 'Background: ON';
    } else {
      bgBtn.className = 'text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-400 border border-slate-600 hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer';
      bgDot.className = 'w-2 h-2 rounded-full bg-slate-500';
      bgLabel.textContent = 'Background: OFF';
    }
  }

  if (simFrame) {
    simFrame.style.backgroundColor = bgColor;
    if (enableBgImage && bgImageUrl) {
      simFrame.style.backgroundImage = `url('${bgImageUrl}')`;
      simFrame.style.backgroundSize = 'cover';
      simFrame.style.backgroundPosition = 'center';
    } else {
      simFrame.style.backgroundImage = 'none';
    }
  }

  if (simTopRightWrapper) {
    simTopRightWrapper.style.display = showTopRight ? 'block' : 'none';
    simTopRightWrapper.style.top = `${topRightTop}px`;
    simTopRightWrapper.style.right = `${topRightRight}px`;
  }
  if (simTopRightImg) {
    simTopRightImg.src = topRightUrl;
    const scaledWidth = Math.min(280, Math.max(60, topRightWidth));
    simTopRightImg.style.width = `${scaledWidth}px`;
  }
}

function toggleThemeIllustration() {
  const inputEl = document.getElementById('themeShowTopRight');
  const current = inputEl ? inputEl.value !== 'false' : true;
  const nextVal = !current;
  if (inputEl) inputEl.value = nextVal ? 'true' : 'false';
  currentThemeSettings.showTopRightImage = nextVal;
  handleThemeControlChange();
  toast(nextVal ? 'Illustration enabled (ON)' : 'Illustration disabled (OFF)', 'info');
}

function toggleThemeBg() {
  const inputEl = document.getElementById('themeEnableBgImage');
  const current = inputEl ? inputEl.value !== 'false' : true;
  const nextVal = !current;
  if (inputEl) inputEl.value = nextVal ? 'true' : 'false';
  currentThemeSettings.enableBgImage = nextVal;
  handleThemeControlChange();
  toast(nextVal ? 'Background image enabled (ON)' : 'Background image disabled (OFF)', 'info');
}

function compressImageBeforeUpload(file, maxWidth, quality = 0.82) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/') || file.type.includes('svg')) {
      return resolve(file);
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob((blob) => {
          if (!blob || blob.size >= file.size) {
            return resolve(file);
          }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '') + (mime === 'image/png' ? '.png' : '.jpg'), { type: mime });
          resolve(compressed);
        }, mime, quality);
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

async function handleThemeFileUpload(event, targetField) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const isGraphic = targetField === 'topRightImage';
  const statusEl = document.getElementById(isGraphic ? 'themeTopRightUploadStatus' : 'themeBgUploadStatus');
  const origText = statusEl ? statusEl.textContent : '';

  if (statusEl) {
    statusEl.textContent = 'Optimizing & Uploading...';
  }

  try {
    const fileToUpload = await compressImageBeforeUpload(file, isGraphic ? 600 : 1920, isGraphic ? 0.85 : 0.80);
    const formData = new FormData();
    formData.append('image', fileToUpload);

    const res = await API('POST', '/api/admin/theme/upload', formData, true);
    if (res && res.url) {
      if (isGraphic) {
        document.getElementById('themeTopRightUrl').value = res.url;
        document.getElementById('themeShowTopRight').value = 'true';
      } else {
        document.getElementById('themeBgImageUrl').value = res.url;
        document.getElementById('themeEnableBgImage').value = 'true';
      }
      handleThemeControlChange();
      if (statusEl) {
        statusEl.textContent = isGraphic ? '✓ Illustration Uploaded' : '✓ Background Uploaded';
      }
      toast('Image uploaded! Click "Save" to apply permanently.', 'success');
    }
  } catch (err) {
    console.error('File upload failed:', err);
    if (statusEl) {
      statusEl.textContent = isGraphic ? '✕ Upload Failed' : '✕ Upload Failed';
    }
    toast('Upload failed: ' + err.message, 'error');
  } finally {
    // Restore label after 3s
    setTimeout(() => {
      if (statusEl) statusEl.textContent = origText;
    }, 3000);
    event.target.value = '';
  }
}

async function saveThemeSettings() {
  const saveBtn = document.getElementById('saveThemeBtn');
  const saveBtnText = document.getElementById('saveThemeBtnText');

  const payload = {
    showTopRightImage: document.getElementById('themeShowTopRight')?.value !== 'false',
    topRightImage: document.getElementById('themeTopRightUrl')?.value.trim() || '/img/ghadhi.png',
    topRightImageWidth: Number(document.getElementById('themeTopRightWidth')?.value) || 160,
    topRightTop: Number(document.getElementById('themeTopRightTop')?.value) || 80,
    topRightRight: Number(document.getElementById('themeTopRightRight')?.value) || 40,
    enableBgImage: document.getElementById('themeEnableBgImage')?.value !== 'false',
    bgColor: document.getElementById('themeBgColorText')?.value.trim() || '#FAF9F5',
    bgImage: document.getElementById('themeBgImageUrl')?.value.trim() || '/img/background.jpg',
  };

  if (saveBtn) saveBtn.disabled = true;
  if (saveBtnText) saveBtnText.textContent = 'Saving...';

  try {
    const res = await API('PUT', '/api/admin/theme', payload);
    if (res && res.theme) {
      currentThemeSettings = res.theme;
      toast('Theme settings saved successfully!', 'success');
      handleThemeControlChange();
    }
  } catch (err) {
    console.error('Failed to save theme settings:', err);
    toast('Failed to save theme: ' + err.message, 'error');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
    if (saveBtnText) saveBtnText.textContent = 'Save Theme';
  }
}

function resetThemeToDefault() {
  confirmAction(
    'Reset Theme Settings',
    'Reset all visuals to default? Click "Save" to persist.',
    () => {
      currentThemeSettings = {
        topRightImage: '/img/ghadhi.png',
        showTopRightImage: true,
        topRightImageWidth: 160,
        topRightTop: 80,
        topRightRight: 40,
        enableBgImage: true,
        bgImage: '/img/background.jpg',
        bgColor: '#FAF9F5',
      };
      populateThemeForm();
      toast('Reset to defaults. Click "Save" to persist.', 'info');
    }
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DRAG & DROP + RESIZE for the illustration image in the live preview
// ═══════════════════════════════════════════════════════════════════════════

let _isDragging = false;
let _isResizing = false;
let _dragStartX = 0;
let _dragStartY = 0;
let _elemStartTop = 0;
let _elemStartRight = 0;
let _resizeStartX = 0;
let _resizeStartWidth = 140;

function _getPointerXY(e) {
  if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}

function _showTooltip(text) {
  const tip = document.getElementById('themeImageInfoTooltip');
  if (tip) { tip.textContent = text; tip.classList.remove('hidden'); }
}
function _hideTooltip() {
  const tip = document.getElementById('themeImageInfoTooltip');
  if (tip) tip.classList.add('hidden');
}

/* ── DRAG ── */
function startDragImage(e) {
  // Don't start drag if it was the resize handle
  if (_isResizing) return;
  if (e.target.closest('[onmousedown*="startResizeImage"]') || e.target.closest('[ontouchstart*="startResizeImage"]')) return;

  e.preventDefault();
  e.stopPropagation();

  _isDragging = true;
  const { x, y } = _getPointerXY(e);
  _dragStartX = x;
  _dragStartY = y;

  const wrapper = document.getElementById('simulatedTopRightWrapper');
  _elemStartTop = parseInt(wrapper.style.top) || 48;
  // right is stored but we convert to left-based to simplify dragging
  const frame = document.getElementById('themeLiveSimulatorFrame');
  const frameRect = frame.getBoundingClientRect();
  const wrapperRect = wrapper.getBoundingClientRect();
  _elemStartRight = frameRect.right - wrapperRect.right;

  wrapper.style.outline = '2px solid rgba(99,102,241,0.6)';
  wrapper.style.outlineOffset = '2px';
  _showTooltip('Drag to reposition');

  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('mouseup', onDragEnd);
  document.addEventListener('touchmove', onDragMove, { passive: false });
  document.addEventListener('touchend', onDragEnd);
}

function onDragMove(e) {
  if (!_isDragging) return;
  e.preventDefault();
  const { x, y } = _getPointerXY(e);
  const dx = x - _dragStartX;
  const dy = y - _dragStartY;

  const wrapper = document.getElementById('simulatedTopRightWrapper');
  const newTop = Math.max(0, Math.round(_elemStartTop + dy));
  const newRight = Math.max(0, Math.round(_elemStartRight - dx));

  wrapper.style.top = `${newTop}px`;
  wrapper.style.right = `${newRight}px`;

  const topInput = document.getElementById('themeTopRightTop');
  const rightInput = document.getElementById('themeTopRightRight');
  if (topInput) topInput.value = newTop;
  if (rightInput) rightInput.value = newRight;

  _showTooltip(`Position: Top ${newTop}px, Right ${newRight}px`);
}

function onDragEnd() {
  _isDragging = false;
  const wrapper = document.getElementById('simulatedTopRightWrapper');
  if (wrapper) {
    wrapper.style.outline = '';
    wrapper.style.outlineOffset = '';
  }
  _hideTooltip();

  document.removeEventListener('mousemove', onDragMove);
  document.removeEventListener('mouseup', onDragEnd);
  document.removeEventListener('touchmove', onDragMove);
  document.removeEventListener('touchend', onDragEnd);
}

/* ── RESIZE ── */
function startResizeImage(e) {
  e.preventDefault();
  e.stopPropagation();

  _isResizing = true;
  const { x } = _getPointerXY(e);
  _resizeStartX = x;

  const img = document.getElementById('simulatedTopRightImg');
  _resizeStartWidth = parseInt(img.style.width) || 140;

  _showTooltip(`Width: ${_resizeStartWidth}px`);

  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('mouseup', onResizeEnd);
  document.addEventListener('touchmove', onResizeMove, { passive: false });
  document.addEventListener('touchend', onResizeEnd);
}

function onResizeMove(e) {
  if (!_isResizing) return;
  e.preventDefault();
  const { x } = _getPointerXY(e);
  const dx = x - _resizeStartX;
  const newWidth = Math.min(400, Math.max(40, _resizeStartWidth + dx));

  const img = document.getElementById('simulatedTopRightImg');
  img.style.width = `${newWidth}px`;

  // Sync hidden field
  document.getElementById('themeTopRightWidth').value = newWidth;

  _showTooltip(`Width: ${Math.round(newWidth)}px`);
}

function onResizeEnd() {
  _isResizing = false;
  _hideTooltip();

  document.removeEventListener('mousemove', onResizeMove);
  document.removeEventListener('mouseup', onResizeEnd);
  document.removeEventListener('touchmove', onResizeMove);
  document.removeEventListener('touchend', onResizeEnd);
}

