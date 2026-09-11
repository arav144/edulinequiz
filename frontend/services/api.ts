/**
 * Student API Client for Quiz System
 * Connects exclusively via HTTP to NEXT_PUBLIC_API_URL
 */

const getApiBaseUrl = (): string => {
  // In the browser, relative '' is universally compatible with Next.js rewrites
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
      throw new Error(data.message || `Server error (${res.status}): ${res.statusText}`);
    }

    return data;
  } catch (error: any) {
    // If relative fetch failed or direct failed, attempt fallback to localhost:5000
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
        // Fall through to error
      }
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error(
        `Unable to reach examination server at ${baseUrl || 'backend'}. Please ensure the backend is running.`
      );
    }
    throw error;
  }
}

// 1. Fetch Published Quizzes Available for Students (Always live, no cache)
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

// 2. Verify Student Identification & 1-Attempt Status
export async function apiVerifyStudent(
  quizId: string,
  studentIdentifier: string,
  name: string,
  extra?: { className?: string; section?: string; schoolName?: string }
) {
  return apiRequest(`/api/quizzes/${quizId}/verify-student`, {
    method: 'POST',
    body: JSON.stringify({ studentIdentifier, name, ...extra }),
  });
}

// 3. Start Quiz: Retrieve Instructions & Questions (includes imageUrl, audioUrl)
export async function apiStartQuiz(quizId: string, studentIdentifier: string) {
  return apiRequest(`/api/quizzes/${quizId}/start?studentIdentifier=${encodeURIComponent(studentIdentifier)}`);
}

// 4. Submit Quiz Attempt for Server-side Grading
export async function apiSubmitAttempt(
  quizId: string,
  payload: {
    studentIdentifier: string;
    name: string;
    className?: string;
    section?: string;
    schoolName?: string;
    answers: Record<string, string>;
  }
) {
  return apiRequest(`/api/quizzes/${quizId}/attempt`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 5. Get Result for a specific attempt (validated by studentIdentifier)
export async function apiGetResult(attemptId: string, studentIdentifier: string) {
  return apiRequest(`/api/results/${attemptId}?studentIdentifier=${encodeURIComponent(studentIdentifier)}`);
}

// 6. Download Result or Certificate PDF as blob
export async function apiDownloadPdf(
  attemptId: string,
  type: 'pdf' | 'certificate',
  studentIdentifier: string
): Promise<Blob> {
  const baseUrl = getApiBaseUrl();
  const endpoint = type === 'certificate'
    ? `/api/results/${attemptId}/certificate?studentIdentifier=${encodeURIComponent(studentIdentifier)}`
    : `/api/results/${attemptId}/pdf?studentIdentifier=${encodeURIComponent(studentIdentifier)}`;

  const res = await fetch(`${baseUrl}${endpoint}`);
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.message || 'PDF generation failed');
  }
  return res.blob();
}

