import { IStudentProfile } from './types';

const STUDENT_PROFILE_CACHE_KEY = 'eduline_registered_student_cache_v1';
const LEGACY_DEVICE_KEY = 'quiz_device_student_id_v2';

export function getStoredStudentProfile(): IStudentProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STUDENT_PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.email || parsed.firstName || parsed.fullName)) {
      return parsed as IStudentProfile;
    }
  } catch (e) {
    console.error('Error reading student profile from cache:', e);
  }
  return null;
}

export function saveStudentProfile(profile: IStudentProfile): void {
  if (typeof window === 'undefined') return;
  try {
    const enriched: IStudentProfile = {
      ...profile,
      fullName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
      registeredAt: profile.registeredAt || new Date().toISOString(),
      isVerifiedEmail: profile.isVerifiedEmail !== undefined ? profile.isVerifiedEmail : true,
    };
    localStorage.setItem(STUDENT_PROFILE_CACHE_KEY, JSON.stringify(enriched));

    // Also sync the identifier to the device key for attempt tracking compatibility
    if (enriched.studentIdentifier) {
      localStorage.setItem(LEGACY_DEVICE_KEY, enriched.studentIdentifier);
      // Also write cookie for cross-context tracking
      document.cookie = `${LEGACY_DEVICE_KEY}=${encodeURIComponent(enriched.studentIdentifier)}; path=/; max-age=31536000; SameSite=Lax`;
    }
  } catch (e) {
    console.error('Error saving student profile to cache:', e);
  }
}

export function clearStoredStudentProfile(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STUDENT_PROFILE_CACHE_KEY);
  } catch (e) {
    console.error('Error clearing student profile cache:', e);
  }
}

export function isStudentRegistered(): boolean {
  const profile = getStoredStudentProfile();
  return !!(profile && (profile.firstName || profile.fullName) && profile.className);
}
