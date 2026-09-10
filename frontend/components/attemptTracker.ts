// Utilities for tracking single attempt per quiz per browser/device using Cookies and LocalStorage

export interface ISavedAttempt {
  quizId: string;
  attemptId: string;
  studentName: string;
  studentIdentifier: string;
  submittedAt: string;
  score?: number;
  totalQuestions?: number;
  percentage?: number;
  result?: 'Pass' | 'Fail';
  certificateId?: string;
  review?: any[];
  className?: string;
  schoolName?: string;
}

const COOKIE_PREFIX = 'attempted_quiz_';
const DEVICE_ID_KEY = 'quiz_student_uid';
const STORAGE_MAP_KEY = 'all_attempted_quizzes';

// Cookie setter with 1-year lifespan
export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// Cookie getter
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const matches = document.cookie.match(
    new RegExp('(?:^|; )' + encodeURIComponent(name).replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
  );
  return matches ? decodeURIComponent(matches[1]) : null;
}

// 1. Persistent device student identifier (survives browser restarts and reloads)
export function getDeviceStudentId(): string {
  if (typeof window === 'undefined') return 'STU_DEVICE';

  // Check cookie
  let uid = getCookie(DEVICE_ID_KEY);
  if (!uid) {
    // Check localStorage
    try {
      uid = localStorage.getItem(DEVICE_ID_KEY);
    } catch {}
  }

  // If not existing, generate a new stable unique ID
  if (!uid) {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timeCode = Date.now().toString(36).toUpperCase();
    uid = `STU_${timeCode}_${randomHex}`;
  }

  // Sync to both cookie and localStorage
  setCookie(DEVICE_ID_KEY, uid);
  try {
    localStorage.setItem(DEVICE_ID_KEY, uid);
  } catch {}

  return uid;
}

// 2. Check if a specific quiz has already been attempted in this browser
export function hasAttemptedQuiz(quizId: string): boolean {
  if (!quizId || typeof window === 'undefined') return false;

  // Check cookie
  const cookieVal = getCookie(`${COOKIE_PREFIX}${quizId}`);
  if (cookieVal) return true;

  // Check specific localStorage key
  try {
    if (localStorage.getItem(`${COOKIE_PREFIX}${quizId}`)) return true;

    // Check all_attempted_quizzes map
    const mapStr = localStorage.getItem(STORAGE_MAP_KEY);
    if (mapStr) {
      const map = JSON.parse(mapStr);
      if (map && map[quizId]) return true;
    }
  } catch {}

  return false;
}

// 3. Retrieve saved attempt data for a specific quiz
export function getSavedAttempt(quizId: string): ISavedAttempt | null {
  if (!quizId || typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(`${COOKIE_PREFIX}${quizId}`);
    if (item) return JSON.parse(item);

    const mapStr = localStorage.getItem(STORAGE_MAP_KEY);
    if (mapStr) {
      const map = JSON.parse(mapStr);
      if (map && map[quizId]) return map[quizId];
    }
  } catch {}
  return null;
}

// 4. Save attempt record upon quiz completion
export function recordQuizAttempt(quizId: string, data: Partial<ISavedAttempt>) {
  if (!quizId || typeof window === 'undefined') return;

  const record: ISavedAttempt = {
    quizId,
    attemptId: data.attemptId || `ATT_${Date.now()}`,
    studentName: data.studentName || 'Student',
    studentIdentifier: data.studentIdentifier || getDeviceStudentId(),
    submittedAt: data.submittedAt || new Date().toISOString(),
    score: data.score,
    totalQuestions: data.totalQuestions,
    percentage: data.percentage,
    result: data.result,
    certificateId: data.certificateId,
    review: data.review,
    className: data.className,
    schoolName: data.schoolName,
  };

  // 1. Set 1-year Cookie
  setCookie(`${COOKIE_PREFIX}${quizId}`, record.attemptId);

  // 2. Set LocalStorage specific key
  try {
    localStorage.setItem(`${COOKIE_PREFIX}${quizId}`, JSON.stringify(record));

    // 3. Update master map
    const mapStr = localStorage.getItem(STORAGE_MAP_KEY);
    const map = mapStr ? JSON.parse(mapStr) : {};
    map[quizId] = record;
    localStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(map));
  } catch {}
}
