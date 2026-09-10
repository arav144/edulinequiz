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
const API = async (method, endpoint, body = null, isFormData = false) => {
  const headers = { Authorization: `Bearer ${authToken}` };
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  const res = await fetch(endpoint, opts);
  if (res.status === 401) { logout(); return; }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }
  // For binary (PDF) responses, return the raw response
  if (!res.ok) throw new Error('Download failed');
  return res;
};

// ─── Toast ───────────────────────────────────────────────────────────────────
let toastTimeout;
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  const msgEl = document.getElementById('toastMsg');
  const colors = { success: 'bg-emerald-600 text-white', error: 'bg-rose-600 text-white', info: 'bg-indigo-600 text-white', warn: 'bg-amber-500 text-white' };
  msgEl.className = `px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-2xl flex items-center gap-2.5 fade-in ${colors[type] || colors.info}`;
  const icons = { success: '✓', error: '✕', info: 'ℹ', warn: '⚠' };
  msgEl.innerHTML = `<span>${icons[type] || '·'}</span><span>${msg}</span>`;
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
  ['dashboard', 'classes', 'quizzes', 'questions', 'subjects', 'results'].forEach(s => {
    const el = document.getElementById(`section-${s}`);
    const nav = document.getElementById(`nav-${s}`);
    if (el) el.classList.add('hidden');
    if (nav) nav.classList.remove('active');
  });
  document.getElementById(`section-${name}`).classList.remove('hidden');
  document.getElementById(`nav-${name}`).classList.add('active');
  document.getElementById('pageTitle').textContent = {
    dashboard: 'Dashboard', classes: 'Class Management (कक्षा प्रबंधन)',
    quizzes: 'Quiz Management',
    questions: 'Question Management', subjects: 'Subject Management', results: 'Student Results'
  }[name];
  currentSection = name;
  if (name === 'dashboard') loadDashboard();
  if (name === 'classes') loadClasses();
  if (name === 'quizzes') loadQuizzes();
  if (name === 'questions') loadQuestions();
  if (name === 'subjects') loadSubjects();
  if (name === 'results') loadResults();
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

    document.getElementById('statsGrid').innerHTML = `
      ${statCard('Total Students', stats.totalStudents, '👤', 'indigo')}
      ${statCard('Total Quizzes', stats.totalQuizzes, '📋', 'purple')}
      ${statCard('Published', stats.publishedQuizzes, '✅', 'emerald')}
      ${statCard('Draft', stats.draftQuizzes, '📝', 'amber')}
      ${statCard('Total Questions', stats.totalQuestions, '❓', 'sky')}
      ${statCard('Total Attempts', stats.totalAttempts, '🎯', 'violet')}
      ${statCard("Today's Attempts", stats.todayAttempts, '⚡', 'rose')}
      ${statCard('Avg Score', stats.avgScore + '%', '📊', 'teal')}
      ${statCard('Highest Score', stats.highestScore + '%', '🏆', 'yellow')}
      ${statCard('Pass Rate', stats.passRate + '%', '🎓', 'green')}
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
            <div class="flex gap-1">
              <button onclick="downloadPdf('${att._id}','pdf','${esc(att.studentIdentifier)}')" class="btn-sm bg-slate-700 hover:bg-slate-600 text-slate-200" title="Download Result">📄</button>
              <button onclick="downloadPdf('${att._id}','certificate','${esc(att.studentIdentifier)}')" class="btn-sm bg-indigo-700 hover:bg-indigo-600 text-white" title="Download Certificate">🏆</button>
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
            ${q.targetClass && q.targetClass !== 'All' ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">🎯 ${esc(q.targetClass)}</span>` : '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">All Classes</span>'}
            ${q.subject ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">${esc(q.subject)}</span>` : ''}
          </div>
          <div class="flex flex-wrap gap-4 text-xs text-slate-400 mb-3">
            <span>❓ ${q.numberOfQuestions} questions required</span>
            <span>🌐 ${q.language === 'hi' ? 'Hindi (हिंदी)' : 'English'}</span>
            <span>⏱️ ${q.timePerQuestion || 30}s / question</span>
            <span>🎯 Passing: ${q.passingPercentage || 50}%</span>
            <span>👥 ${q.attemptCount || 0} student attempts</span>
            <span>📅 Created: ${fmtDate(q.createdAt)}</span>
          </div>
          <div>
            <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Questions: <strong>${quota} / ${target}</strong></span>
              <span>${pct}%</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            ${!q.isReadyToPublish && q.status === 'Draft' ? `<p class="text-amber-400 text-xs mt-1">⚠ Need ${target - quota} more question${target - quota !== 1 ? 's' : ''} to publish</p>` : ''}
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
  document.getElementById('quizTimePerQuestion').value = isEdit ? (fullQuiz.timePerQuestion || 30) : 30;
  document.getElementById('quizPassingPct').value = isEdit ? (fullQuiz.passingPercentage || 50) : 50;
  document.getElementById('quizLanguage').value = isEdit ? (fullQuiz.language || 'en') : 'en';
  document.getElementById('quizTargetClass').value = isEdit ? (fullQuiz.targetClass || 'All') : 'All';
  document.getElementById('quizDescription').value = isEdit ? (fullQuiz.description || '') : '';
  document.getElementById('quizInstructions').value = isEdit ? (fullQuiz.instructions || '') : '';
  document.getElementById('quizContactInfo').value = isEdit ? (fullQuiz.contactInfo || '') : '';
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
          ${q.imageUrl ? `<span class="text-[11px] text-amber-300">🖼</span>` : ''}
          ${q.audioUrl ? `<span class="text-[11px] text-purple-300">🔊</span>` : ''}
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
              <span>🖼 Question Image (Optional)</span>
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
              <span>🔊 Question Audio (Optional)</span>
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
  const timePerQuestion = Number(document.getElementById('quizTimePerQuestion').value) || 30;
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
                <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md font-bold">✓ Ans: ${q.correctAnswer}</span>
                ${q.imageUrl ? `<span class="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md">🖼 Image</span>` : ''}
                ${q.audioUrl ? `<span class="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-md">🔊 Audio</span>` : ''}
              </div>
            </div>
            <div class="flex gap-1.5 flex-shrink-0">
              <button onclick="previewQuestion(${JSON.stringify(q).replace(/"/g, '&quot;')})" class="btn-sm bg-slate-700 text-slate-200 hover:bg-slate-600">👁</button>
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
      ${['A','B','C','D'].map(k => `
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
//  RESULTS
// ═══════════════════════════════════════════════════════════════════
async function loadResults() {
  try {
    const search = document.getElementById('rSearch')?.value || '';
    const quizId = document.getElementById('rQuizFilter')?.value || '';
    const result = document.getElementById('rResultFilter')?.value || '';
    const sortBy = document.getElementById('rSortBy')?.value || 'date';

    let url = '/api/admin/attempts?limit=100&';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (quizId) url += `quizId=${quizId}&`;
    if (result) url += `result=${result}&`;
    url += `sortBy=${sortBy}`;

    const data = await API('GET', url);
    populateQuizFilter('rQuizFilter');

    currentResultsList = data.attempts || [];
    const tbody = document.getElementById('resultsTable');
    if (!data.attempts.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="py-8 text-center text-slate-500">No results found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.attempts.map(att => `
      <tr class="hover:bg-slate-700/20 transition">
        <td class="px-4 py-3 font-medium text-white">${esc(att.studentName)}</td>
        <td class="px-4 py-3 font-mono text-xs text-slate-400">${esc(att.studentIdentifier)}</td>
        <td class="px-4 py-3 text-slate-300 text-sm font-medium">${esc(att.quizName)}</td>
        <td class="px-4 py-3 text-xs text-indigo-400 font-semibold">${esc(att.subject || 'General')}</td>
        <td class="px-4 py-3 font-semibold text-white">${att.score}/${att.totalQuestions}</td>
        <td class="px-4 py-3 text-slate-300">${att.percentage}%</td>
        <td class="px-4 py-3"><span class="${att.result === 'Pass' ? 'badge-pass' : 'badge-fail'}">${att.result || '—'}</span></td>
        <td class="px-4 py-3 font-mono text-xs text-indigo-400">${att.certificateId || '—'}</td>
        <td class="px-4 py-3 text-slate-400 text-xs">${fmtDateTime(att.submittedAt)}</td>
        <td class="px-4 py-3">
          <div class="flex gap-1">
            <button onclick="downloadPdf('${att._id}','pdf','${esc(att.studentIdentifier)}')" class="btn-sm bg-slate-700 text-slate-200 hover:bg-slate-600 text-xs" title="Download Result PDF">📄 Result</button>
            <button onclick="downloadPdf('${att._id}','certificate','${esc(att.studentIdentifier)}')" class="btn-sm bg-indigo-700/80 text-white hover:bg-indigo-600 text-xs" title="Download Certificate">🏆 Cert</button>
          </div>
        </td>
      </tr>`).join('');
  } catch (e) { toast('Failed to load results: ' + e.message, 'error'); }
}

let currentResultsList = [];

async function downloadAllCertificates() {
  if (!currentResultsList || !currentResultsList.length) {
    toast('No student attempts found to download.', 'error');
    return;
  }
  toast(`Downloading ${currentResultsList.length} certificates...`, 'info');
  for (let i = 0; i < currentResultsList.length; i++) {
    const att = currentResultsList[i];
    await downloadPdf(att._id, 'certificate', att.studentIdentifier || 'student');
    if (i < currentResultsList.length - 1) {
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
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ═══════════════════════════════════════════════════════════════════
//  CLASSES (कक्षा प्रबंधन)
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
            class="px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                : 'bg-slate-700/60 text-slate-400 border border-slate-600 hover:bg-slate-700'
            }" title="Click to toggle active on student portal">
            <span class="w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}"></span>
            ${isActive ? 'Active (छात्रों को दिखेगी)' : 'Inactive (छिपी हुई)'}
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

