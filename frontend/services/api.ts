/**
 * Student API Client for Quiz System
 * Connects to NEXT_PUBLIC_API_URL or relative proxy
 * Includes exponential backoff with jitter and automated JWT token refresh
 */

const TOKEN_KEY = 'eduline_student_token';
const REFRESH_TOKEN_KEY = 'eduline_student_refresh_token';
const STUDENT_KEY = 'eduline_student_profile';

export const getStudentToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setStudentToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setRefreshToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const clearStudentToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(STUDENT_KEY);

  // Clear any persisted quiz answers on logout
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('quiz_answers_')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
};

export const getCachedStudent = (): any | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STUDENT_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCachedStudent = (student: any): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STUDENT_KEY, JSON.stringify(student));
};

const getApiBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost') {
      if (/^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))/.test(window.location.hostname)) {
        return `http://${window.location.hostname}:5000`;
      }
      return ''; // Use relative path in production (Vercel rewrites)
    }
  }
  return 'http://localhost:5000';
};

// Helper: Sleep with random jitter to prevent thundering herd
const sleepWithJitter = (baseMs: number, attempt: number) => {
  const exponential = Math.min(baseMs * Math.pow(2, attempt), 4000);
  const jitter = Math.random() * 250;
  return new Promise((resolve) => setTimeout(resolve, exponential + jitter));
};

// Singleton in-flight token refresh promise to prevent duplicate refresh calls
let refreshPromise: Promise<string | null> | null = null;

async function executeTokenRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const refreshRes = await fetch(`${baseUrl}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const refreshData = await refreshRes.json().catch(() => ({}));
      if (refreshRes.ok && refreshData.token) {
        setStudentToken(refreshData.token);
        if (refreshData.refreshToken) {
          setRefreshToken(refreshData.refreshToken);
        }
        return refreshData.token;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = getStudentToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        headers,
      });

      // 1. Handle Automatic Token Refresh on 401 (Exam > 30 min duration resilience)
      if (
        res.status === 401 &&
        endpoint !== '/api/auth/refresh-token' &&
        endpoint !== '/api/auth/student-login'
      ) {
        const refreshedToken = await executeTokenRefresh();
        if (refreshedToken) {
          headers.Authorization = `Bearer ${refreshedToken}`;
          // Retry original request immediately with new token
          const retryRes = await fetch(url, { ...options, headers });
          const retryData = await retryRes.json().catch(() => ({}));
          if (!retryRes.ok) {
            const error: any = new Error(retryData.message || `Server error (${retryRes.status}): ${retryRes.statusText}`);
            error.status = retryRes.status;
            error.code = retryData.code;
            error.data = retryData;
            throw error;
          }
          return retryData;
        }
      }

      // 2. Retry on 429 (Rate Limit), 503 (Database Busy / Warming up), or 504 (Gateway Timeout)
      if ((res.status === 429 || res.status === 503 || res.status === 504) && attempt < retries) {
        const retryHeader = res.headers.get('Retry-After');
        const retryAfterMs = retryHeader ? parseInt(retryHeader, 10) * 1000 : 500;
        await sleepWithJitter(retryAfterMs, attempt);
        continue;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const error: any = new Error(data.message || `Server error (${res.status}): ${res.statusText}`);
        error.status = res.status;
        error.code = data.code;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error: any) {
      lastError = error;

      // Retry on network drops / connection timeouts with exponential backoff & jitter
      const isNetworkOrTimeoutErr =
        error.name === 'AbortError' ||
        (error.message && (
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('timeout') ||
          error.message.includes('aborted')
        ));

      if (isNetworkOrTimeoutErr && attempt < retries) {
        await sleepWithJitter(500, attempt);
        continue;
      }

      // Fallback for localhost testing
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && !url.startsWith('http://localhost:5000')) {
        try {
          const fallbackUrl = `http://localhost:5000${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
          const fbRes = await fetch(fallbackUrl, { ...options, headers });
          if (fbRes.ok) return await fbRes.json();
        } catch {}
      }

      if (attempt >= retries) {
        break;
      }
    }
  }

  if (lastError?.message && (lastError.message.includes('Failed to fetch') || lastError.message.includes('NetworkError'))) {
    throw new Error(`Unable to reach examination server at ${baseUrl || 'backend'}. Please check your connection.`);
  }

  throw lastError;
}

// 1. Fetch Published Quizzes Available for Students (Public & Class Filtered)
export async function apiGetAvailableQuizzes(studentIdentifier?: string) {
  const qs = studentIdentifier ? `?studentIdentifier=${encodeURIComponent(studentIdentifier)}` : '';
  return apiRequest(`/api/quizzes/available${qs}`);
}

// 1.1 Fetch Subjects (Public Cached Data)
export async function apiGetSubjects() {
  return apiRequest('/api/subjects');
}

// 1.2 Fetch Active Classes for Student Portal (Public Cached Data)
export async function apiGetClasses() {
  return apiRequest('/api/classes');
}


// 2. Start Quiz: Retrieve Questions & Instructions (Secured by Student Auth)
export async function apiStartQuiz(quizId: string, studentIdentifier?: string) {
  const qs = studentIdentifier ? `?studentIdentifier=${encodeURIComponent(studentIdentifier)}` : '';
  return apiRequest(`/api/quizzes/${quizId}/start${qs}`);
}

// 3. Submit Quiz Attempt for Server-side Grading
export async function apiSubmitAttempt(
  quizId: string,
  payload: {
    studentIdentifier?: string;
    name?: string;
    className?: string;
    schoolName?: string;
    answers: Record<string, string>;
    clientExpiredAt?: string;
    examToken?: string | null;
  }
) {
  const safePayload = {
    ...payload,
    clientExpiredAt:
      typeof payload.clientExpiredAt === 'string' && payload.clientExpiredAt.trim()
        ? payload.clientExpiredAt.trim()
        : new Date().toISOString(),
  };
  return apiRequest(`/api/quizzes/${quizId}/attempt`, {
    method: 'POST',
    body: JSON.stringify(safePayload),
  });
}

// 4. Get Result for a specific attempt
export async function apiGetResult(attemptId: string, studentIdentifier?: string) {
  const qs = studentIdentifier ? `?studentIdentifier=${encodeURIComponent(studentIdentifier)}` : '';
  return apiRequest(`/api/results/${attemptId}${qs}`);
}

// 5. Download Result or Certificate PDF as blob
export async function apiDownloadPdf(
  attemptId: string,
  type: 'pdf' | 'certificate',
  studentIdentifier?: string
): Promise<Blob> {
  const baseUrl = getApiBaseUrl();
  const token = getStudentToken();
  const qs = studentIdentifier ? `?studentIdentifier=${encodeURIComponent(studentIdentifier)}` : '';
  const endpoint = type === 'certificate'
    ? `/api/results/${attemptId}/certificate${qs}`
    : `/api/results/${attemptId}/pdf${qs}`;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res = await fetch(`${baseUrl}${endpoint}`, { headers });
  if (!res.ok && typeof window !== 'undefined' && window.location.hostname === 'localhost' && !baseUrl.startsWith('http://localhost:5000')) {
    res = await fetch(`http://localhost:5000${endpoint}`, { headers });
  }

  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.message || 'PDF generation failed');
  }
  return res.blob();
}

// 6. Student Authentication & Registration APIs (Email + PIN, No OTP)
export async function apiCheckEmail(email: string) {
  return apiRequest('/api/auth/check-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function apiStudentLogin(email: string, pin: string) {
  const res = await apiRequest('/api/auth/student-login', {
    method: 'POST',
    body: JSON.stringify({ email, pin, password: pin }),
  });
  if (res.token) {
    setStudentToken(res.token);
  }
  if (res.refreshToken) {
    setRefreshToken(res.refreshToken);
  }
  if (res.student) {
    setCachedStudent(res.student);
  }
  return res;
}

export interface IRegisterStudentPayload {
  firstName: string;
  lastName?: string;
  email: string;
  pin: string;
  confirmPin?: string;
  createPin?: string;
  password?: string;
  schoolName: string;
  class: string;
  dateOfBirth: string;
  gender: string;
  state: string;
  address: string;
  pinCode: string;
  previousQuizParticipation: boolean | string;
  participatedEarlier?: string;
  mobileNumber?: string;
}

export async function apiRegisterStudent(payload: IRegisterStudentPayload) {
  const res = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.token) {
    setStudentToken(res.token);
  }
  if (res.refreshToken) {
    setRefreshToken(res.refreshToken);
  }
  if (res.student) {
    setCachedStudent(res.student);
  }
  return res;
}


export async function apiGetMe() {
  const token = getStudentToken();
  if (!token) return { success: false, student: null };
  try {
    const res = await apiRequest('/api/auth/me');
    if (res.student) {
      setCachedStudent(res.student);
    }
    return res;
  } catch (err: any) {
    if (err.status === 401) {
      clearStudentToken();
    }
    throw err;
  }
}

// 8. Get student's own quiz attempt history
export async function apiGetMyAttempts() {
  const token = getStudentToken();
  if (!token) return { success: false, attempts: [] };
  return apiRequest('/api/auth/my-attempts');
}

// 9. Update student profile
export async function apiUpdateProfile(payload: Partial<Parameters<typeof apiRegisterStudent>[0]>) {
  const res = await apiRequest('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (res.student) {
    setCachedStudent(res.student);
  }
  return res;
}

// 10. Theme & Examination Branding
export interface IThemeSettings {
  topRightImage?: string;
  showTopRightImage?: boolean;
  topRightImageWidth?: number;
  topRightTop?: number;
  topRightRight?: number;
  enableBgImage?: boolean;
  bgImage?: string;
  bgColor?: string;
}

export const DEFAULT_THEME_SETTINGS: IThemeSettings = {
  topRightImage: '',
  showTopRightImage: false,
  topRightImageWidth: 160,
  topRightTop: 80,
  topRightRight: 40,
  enableBgImage: true,
  bgImage: '/img/background.jpg',
  bgColor: '#FAF9F5',
};

export const resolveMediaUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const baseUrl = getApiBaseUrl();
  if (url.startsWith('/uploads/')) {
    return `${baseUrl}${url}`;
  }
  return url;
};

export async function apiGetTheme(): Promise<IThemeSettings> {
  try {
    const res = await apiRequest('/api/theme');
    if (res && res.theme) {
      return { ...DEFAULT_THEME_SETTINGS, ...res.theme };
    }
    return DEFAULT_THEME_SETTINGS;
  } catch (err) {
    console.warn('Could not load theme from backend, using defaults:', err);
    return DEFAULT_THEME_SETTINGS;
  }
}

