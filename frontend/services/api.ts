/**
 * Student API Client for Quiz System
 * Connects to NEXT_PUBLIC_API_URL or relative proxy
 */

const TOKEN_KEY = 'eduline_student_token';
const STUDENT_KEY = 'eduline_student_profile';

export const getStudentToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setStudentToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStudentToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(STUDENT_KEY);
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
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = getStudentToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers,
    });

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
    if (typeof window !== 'undefined' && !url.startsWith('http://localhost:5000')) {
      try {
        const fallbackUrl = `http://localhost:5000${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        const fbRes = await fetch(fallbackUrl, {
          cache: 'no-store',
          ...options,
          headers,
        });
        const fbData = await fbRes.json().catch(() => ({}));
        if (fbRes.ok) return fbData;
      } catch {
        // Continue to throw original
      }
    }
    if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      throw new Error(
        `Unable to reach examination server at ${baseUrl || 'backend'}. Please ensure the backend is running.`
      );
    }
    throw error;
  }
}

// 1. Fetch Published Quizzes Available for Students (class filtered by student session)
export async function apiGetAvailableQuizzes(studentIdentifier?: string) {
  const t = Date.now();
  const qs = studentIdentifier
    ? `?studentIdentifier=${encodeURIComponent(studentIdentifier)}&_t=${t}`
    : `?_t=${t}`;
  return apiRequest(`/api/quizzes/available${qs}`, { cache: 'no-store' });
}

// 1.1 Fetch Subjects
export async function apiGetSubjects() {
  return apiRequest('/api/subjects');
}

// 1.2 Fetch Active Classes for Student Portal
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
  }
) {
  return apiRequest(`/api/quizzes/${quizId}/attempt`, {
    method: 'POST',
    body: JSON.stringify(payload),
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
  if (!res.ok && typeof window !== 'undefined' && !baseUrl.startsWith('http://localhost:5000')) {
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
  if (res.student) {
    setCachedStudent(res.student);
  }
  return res;
}

export interface IRegisterStudentPayload {
  firstName: string;
  lastName: string;
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

