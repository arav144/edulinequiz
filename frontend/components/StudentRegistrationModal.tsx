'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  KeyRound,
  User,
  GraduationCap,
  Building2,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  LogIn,
  UserPlus,
  UserX,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { IStudentProfile } from './types';
import {
  apiStudentLogin,
  apiRegisterStudent,
  apiUpdateProfile,
  setCachedStudent,
  getCachedStudent,
} from '../services/api';

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: IStudentProfile) => void;
  initialClass?: string;
  initialSchool?: string;
  /** 'signup' = register flow; 'signin' = sign-in flow; 'edit' = edit profile */
  initialMode?: 'signup' | 'signin' | 'edit';
}

const INDIAN_STATES = [
  'Andaman and Nicobar Islands','Andhra Pradesh','Arunachal Pradesh','Assam','Bihar',
  'Chandigarh','Chhattisgarh','Dadra and Nagar Haveli and Daman and Diu','Delhi (NCT)',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand',
  'Karnataka','Kerala','Ladakh','Lakshadweep','Madhya Pradesh','Maharashtra',
  'Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal',
];

/** Build a normalised IStudentProfile from a raw API student object */
function buildProfile(s: any): IStudentProfile {
  const rawClass = s.class || s.className || '';
  const normalizedClass = rawClass.startsWith('Class ') ? rawClass : rawClass ? `Class ${rawClass}` : '';
  return {
    _id: s._id,
    email: s.email,
    firstName: s.firstName,
    lastName: s.lastName,
    fullName: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Student',
    mobileNumber: s.mobileNumber || '',
    schoolName: s.schoolName,
    className: normalizedClass,
    class: normalizedClass,
    dob: s.dateOfBirth || s.dob || '',
    dateOfBirth: s.dateOfBirth || s.dob || '',
    gender: s.gender,
    state: s.state,
    address: s.address,
    pinCode: s.pinCode,
    participatedEarlier: s.previousQuizParticipation === 'Yes' || s.participatedEarlier === 'Yes' ? 'Yes' : 'No',
    previousQuizParticipation: s.previousQuizParticipation,
    studentIdentifier: s.studentIdentifier,
    isVerifiedEmail: true,
  };
}

type View = 'signin' | 'register' | 'edit';

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialClass = '',
  initialSchool = '',
  initialMode = 'signup',
}) => {
  // ── Top-level view ─────────────────────────────────────────────────────────
  const [view, setView] = useState<View>(
    initialMode === 'signup' ? 'register' : initialMode === 'edit' ? 'edit' : 'signin'
  );

  // ── Sign-in state ──────────────────────────────────────────────────────────
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPin, setSigninPin] = useState('');
  const [showSigninPin, setShowSigninPin] = useState(false);
  const [accountNotFoundEmail, setAccountNotFoundEmail] = useState<string | null>(null);

  // ── Registration / Edit form fields ────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [schoolName, setSchoolName] = useState(initialSchool || '');
  const [className, setClassName] = useState(initialClass || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [stateVal, setStateVal] = useState('Delhi (NCT)');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [participatedEarlier, setParticipatedEarlier] = useState<'Yes' | 'No' | ''>('No');

  // ── Shared UI state ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  // ── Reset & Initialize on open / initialMode change ────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setSuccessMsg(null);
    setIsSubmittedSuccess(false);
    setAccountNotFoundEmail(null);

    const activeView = initialMode === 'signup' ? 'register' : initialMode === 'edit' ? 'edit' : 'signin';
    setView(activeView);

    // Pre-fill profile fields if editing or if cached profile exists
    const cached = getCachedStudent();
    if (cached) {
      if (activeView === 'edit') {
        setEmail(cached.email || '');
      }
      setFirstName(cached.firstName || '');
      setLastName(cached.lastName || '');
      setSchoolName(cached.schoolName || initialSchool || '');
      const rawClass = cached.class || initialClass || '';
      setClassName(rawClass ? (rawClass.toString().includes('Class') ? rawClass : `Class ${rawClass}`) : '');
      setDob(cached.dateOfBirth || cached.dob || '');
      setGender(cached.gender || '');
      setStateVal(cached.state || 'Delhi (NCT)');
      setAddress(cached.address || '');
      setPinCode(cached.pinCode || '');
      setParticipatedEarlier(cached.previousQuizParticipation === 'Yes' || cached.participatedEarlier === 'Yes' ? 'Yes' : 'No');
    }
  }, [isOpen, initialMode, initialClass, initialSchool]);

  if (!isOpen) return null;

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const switchToSignIn = () => {
    setView('signin');
    setError(null);
    setSuccessMsg(null);
    setAccountNotFoundEmail(null);
  };

  const switchToRegister = (prefillEmail?: string) => {
    setView('register');
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
    setError(null);
    setSuccessMsg(null);
    setAccountNotFoundEmail(null);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SIGN IN HANDLER (Email + PIN)
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setAccountNotFoundEmail(null);

    const cleanEmail = signinEmail.trim().toLowerCase();
    const cleanPin = signinPin.trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!cleanPin) {
      setError('Please enter your PIN.');
      return;
    }

    try {
      setLoading(true);
      const res = await apiStudentLogin(cleanEmail, cleanPin);

      if (res.success && res.student) {
        setSuccessMsg('Sign in successful! Redirecting...');
        setTimeout(() => {
          onSuccess(buildProfile(res.student));
          onClose();
        }, 800);
      } else {
        setError(res.message || 'Invalid email or PIN.');
      }
    } catch (err: any) {
      // Check for specific error codes returned from backend
      if (err.data?.errorCode === 'ACCOUNT_NOT_FOUND' || err.message?.includes('Account Not Found') || err.message?.includes('No account found')) {
        setAccountNotFoundEmail(cleanEmail);
      } else if (err.data?.errorCode === 'INCORRECT_PIN' || err.message?.includes('Incorrect PIN') || err.message?.includes('Incorrect password')) {
        setError('Incorrect PIN. Please try again.');
      } else {
        setError(err.message || 'Sign in failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SIGN UP / REGISTER & EDIT DETAILS HANDLER
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // ── Field Validations ──
    if (!firstName.trim() || firstName.trim().length < 2) {
      setError('First Name is required (minimum 2 characters).');
      return;
    }
    if (!schoolName.trim() || schoolName.trim().length < 2) {
      setError('Name of School is required.');
      return;
    }
    if (!className) {
      setError('Please select your Class (Class 3 to 8).');
      return;
    }
    if (!dob.trim()) {
      setError('Date of Birth is required.');
      return;
    }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dob.trim())) {
      setError('Date of Birth must be in DD/MM/YYYY format (e.g. 15/08/2012).');
      return;
    }
    if (!gender) {
      setError('Please select your Gender.');
      return;
    }
    if (!stateVal) {
      setError('Please select your State.');
      return;
    }
    if (!address.trim()) {
      setError('Address is required.');
      return;
    }
    const cleanPinCode = pinCode.replace(/\D/g, '');
    if (!cleanPinCode || cleanPinCode.length !== 6) {
      setError('Please enter a valid 6-digit Pin Code.');
      return;
    }
    if (!participatedEarlier) {
      setError("Please indicate if you took part in Eduline Publishers' last Hindi Diwas quiz.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // ── Registration-specific validations (Email & PIN) ──
    if (view === 'register') {
      if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
        setError('Please enter a valid Email ID.');
        return;
      }
      const cleanPin = pin.trim();
      const cleanConfirmPin = confirmPin.trim();

      if (!cleanPin || cleanPin.length < 4) {
        setError('Create PIN is required (minimum 4 characters/digits).');
        return;
      }
      if (cleanPin !== cleanConfirmPin) {
        setError('Create PIN and Confirm PIN do not match. Please re-enter.');
        return;
      }
    }

    const rawClass = className.replace('Class ', '').trim();

    try {
      setLoading(true);

      if (view === 'edit') {
        const payload = {
          firstName: firstName.trim(),
          lastName: (lastName || '').trim(),
          schoolName: schoolName.trim(),
          class: rawClass,
          className: `Class ${rawClass}`,
          dateOfBirth: dob.trim(),
          gender,
          state: stateVal,
          address: address.trim(),
          pinCode: cleanPinCode,
          previousQuizParticipation: participatedEarlier === 'Yes' ? 'Yes' : 'No',
          participatedEarlier: participatedEarlier === 'Yes' ? 'Yes' : 'No',
        };

        const res = await apiUpdateProfile(payload);
        if (res.success && res.student) {
          setCachedStudent(res.student);
          setIsSubmittedSuccess(true);
          const updatedProfile = buildProfile(res.student);
          onSuccess(updatedProfile);
          setTimeout(() => {
            onClose();
          }, 600);
        } else {
          setError(res.message || 'Could not update profile.');
        }
      } else {
        // Register new student
        const payload = {
          email: cleanEmail,
          pin: pin.trim(),
          confirmPin: confirmPin.trim(),
          firstName: firstName.trim(),
          lastName: (lastName || '').trim(),
          schoolName: schoolName.trim(),
          class: rawClass,
          dateOfBirth: dob.trim(),
          gender,
          state: stateVal,
          address: address.trim(),
          pinCode: cleanPinCode,
          previousQuizParticipation: participatedEarlier === 'Yes' ? 'Yes' : 'No',
          participatedEarlier: participatedEarlier === 'Yes' ? 'Yes' : 'No',
        };

        const res = await apiRegisterStudent(payload);
        if (res.success && res.student) {
          setCachedStudent(res.student);
          setIsSubmittedSuccess(true);
          setSuccessMsg('Account Created Successfully');
          setTimeout(() => {
            onSuccess(buildProfile(res.student));
            onClose();
          }, 1500);
        } else {
          setError(res.message || 'Registration failed. Please try again.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Modal Header Title ─────────────────────────────────────────────────────
  const headerTitle =
    isSubmittedSuccess
      ? view === 'edit'
        ? 'Profile Updated'
        : 'Account Created Successfully'
      : view === 'edit'
      ? 'Edit Your Details'
      : view === 'signin'
      ? 'Sign In'
      : 'Sign Up Yourself for the Quiz';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn select-none overflow-y-auto">
      <div className={`w-full ${view === 'signin' ? 'max-w-md' : 'max-w-2xl'} bg-white rounded-3xl shadow-2xl border border-slate-100/90 overflow-hidden relative my-auto max-h-[92vh] flex flex-col transition-all duration-300`}>

        {/* ── MODAL HEADER ──────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-[#194c5f] via-[#24677f] to-[#2d7995] px-5 sm:px-6 py-4 text-white flex items-center justify-between shadow-xs shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 shadow-inner">
              {view === 'signin' ? (
                <LogIn className="w-5 h-5 text-white" />
              ) : view === 'edit' ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <GraduationCap className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg md:text-xl font-black tracking-tight leading-tight text-white truncate">
                {headerTitle}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition cursor-pointer shrink-0 ml-2"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── ALERT BANNERS ─────────────────────────────────────────────── */}
        {error && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-fadeIn shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            VIEW 1: SIGN IN (Email + PIN only — NO OTP)
        ════════════════════════════════════════════════════════════ */}
        {view === 'signin' && !isSubmittedSuccess && (
          <div className="p-6 overflow-y-auto flex-1 space-y-5 modern-scrollbar">
            {accountNotFoundEmail ? (
              <div className="space-y-5 py-2 animate-fadeIn">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-[#2d7995]/15 text-[#2d7995] flex items-center justify-center mx-auto shadow-inner">
                    <UserX className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">Account Not Found</h4>
                  <div className="bg-[#2d7995]/10 border border-[#2d7995]/25 rounded-xl px-4 py-2.5 mx-auto max-w-sm">
                    <p className="text-xs font-bold text-[#194c5f] break-all">{accountNotFoundEmail}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-600 leading-relaxed max-w-xs mx-auto pt-1">
                    Please register first to continue.
                  </p>
                </div>

                <div className="space-y-2.5 max-w-sm mx-auto">
                  <button
                    type="button"
                    onClick={() => switchToRegister(accountNotFoundEmail)}
                    id="account-not-found-register-btn"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2d7995] to-[#1f576c] hover:from-[#266881] hover:to-[#1a4a5b] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountNotFoundEmail(null)}
                    className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs transition cursor-pointer"
                  >
                    Try a Different Email
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-[#2d7995]/10 text-[#2d7995] flex items-center justify-center mx-auto mb-2">
                    <LogIn className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Welcome Back</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Enter your registered Email ID and PIN to access the Quiz Portal.
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Email ID <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2d7995] transition-colors">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="signin-email-input"
                        type="email"
                        required
                        value={signinEmail}
                        onChange={(e) => setSigninEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-[#2d7995] focus:ring-4 focus:ring-[#2d7995]/15 text-sm font-medium text-slate-900 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      PIN <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2d7995] transition-colors">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="signin-pin-input"
                        type={showSigninPin ? 'text' : 'password'}
                        required
                        value={signinPin}
                        onChange={(e) => setSigninPin(e.target.value)}
                        placeholder="Enter your PIN"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-[#2d7995] focus:ring-4 focus:ring-[#2d7995]/15 text-sm font-medium text-slate-900 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSigninPin(!showSigninPin)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        aria-label={showSigninPin ? 'Hide PIN' : 'Show PIN'}
                      >
                        {showSigninPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    id="signin-submit-btn"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2d7995] to-[#1f576c] hover:from-[#266881] hover:to-[#1a4a5b] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-2 text-center border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchToRegister()}
                      className="font-bold text-[#2d7995] hover:underline cursor-pointer"
                    >
                      Click here to Register
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            VIEW 2: REGISTER (Direct, NO OTP) OR EDIT DETAILS
        ════════════════════════════════════════════════════════════ */}
        {(view === 'register' || view === 'edit') && !isSubmittedSuccess && (
          <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 overflow-hidden">
            
            {/* Scrollable Form Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 modern-scrollbar">
              {view === 'edit' ? (
                <div className="bg-[#2d7995]/5 rounded-2xl p-3.5 border border-[#2d7995]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-500 block">Registered Email</span>
                      <strong className="text-xs sm:text-sm font-bold text-slate-800 truncate block">{email}</strong>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md shrink-0">
                    Verified Account
                  </span>
                </div>
              ) : (
                <div className="text-center pb-0.5">
                  <p className="text-xs text-slate-500 font-medium">
                    Please fill out the information below to create your student account.
                  </p>
                </div>
              )}

              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2d7995] transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name (e.g. Aarav)"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-[#2d7995] focus:ring-4 focus:ring-[#2d7995]/15 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name (Optional)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-[#2d7995] focus:ring-4 focus:ring-[#2d7995]/15 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition"
                  />
                </div>
              </div>

              {/* Name of School */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Name of School <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2d7995] transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="Enter your school name (e.g. Delhi Public School)"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-[#2d7995] focus:ring-4 focus:ring-[#2d7995]/15 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition"
                  />
                </div>
              </div>

              {/* Class & Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-[#2d7995] focus:ring-4 focus:ring-[#2d7995]/15 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition cursor-pointer"
                  >
                    <option value="" disabled>-- Select Class --</option>
                    {[3, 4, 5, 6, 7, 8].map((c) => (
                      <option key={c} value={`Class ${c}`}>Class {c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Date of Birth – DD/MM/YYYY <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2d7995] transition-colors">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      placeholder="DD/MM/YYYY (e.g. 15/08/2012)"
                      maxLength={10}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-[#2d7995] focus:ring-4 focus:ring-[#2d7995]/15 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(['Male', 'Female', 'Other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs sm:text-sm font-bold transition cursor-pointer ${
                        gender === g
                          ? 'border-[#2d7995] bg-[#2d7995]/10 text-[#2d7995] shadow-xs ring-1 ring-[#2d7995]/30'
                          : 'border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition ${
                        gender === g ? 'border-[#2d7995] bg-[#2d7995]' : 'border-slate-300 bg-white'
                      }`}>
                        {gender === g && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      <span>{g}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* State & Pin Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-[#2d7995] focus:ring-4 focus:ring-[#2d7995]/15 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition cursor-pointer"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pin Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit PIN code"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-[#2d7995] focus:ring-4 focus:ring-[#2d7995]/15 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute top-3 left-3 pointer-events-none text-slate-400 group-focus-within:text-[#2d7995] transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter street, area, house or flat number"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-[#2d7995] focus:ring-4 focus:ring-[#2d7995]/15 text-xs sm:text-sm font-medium text-slate-900 outline-none transition resize-none"
                  />
                </div>
              </div>

              {/* Previous quiz participation */}
              <div className="bg-gradient-to-r from-slate-50 to-[#2d7995]/5 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="block text-xs font-bold text-slate-800 leading-snug">
                  Did you take part in Eduline Publishers&apos; last Hindi Diwas quiz too?{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3 pt-0.5">
                  {(['Yes', 'No'] as const).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setParticipatedEarlier(choice)}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                        participatedEarlier === choice
                          ? 'border-[#2d7995] bg-[#2d7995] text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full border flex items-center justify-center transition ${
                        participatedEarlier === choice ? 'border-white bg-white' : 'border-slate-300 bg-white'
                      }`}>
                        {participatedEarlier === choice && <span className="w-1.5 h-1.5 rounded-full bg-[#2d7995]" />}
                      </span>
                      <span>{choice}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── REGISTRATION SPECIFIC FIELDS: Email ID, Create PIN, Confirm PIN ── */}
              {view === 'register' && (
                <div className="space-y-3.5 pt-3 border-t border-slate-100">
                  {/* Email ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email ID <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2d7995] transition-colors">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-[#2d7995] focus:ring-4 focus:ring-[#2d7995]/15 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Create PIN & Confirm PIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Create PIN <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2d7995] transition-colors">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPin ? 'text' : 'password'}
                          required
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          placeholder="Create 4+ digit PIN"
                          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-[#2d7995] focus:ring-4 focus:ring-[#2d7995]/15 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                          {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Confirm PIN <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#2d7995] transition-colors">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showConfirmPin ? 'text' : 'password'}
                          required
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value)}
                          placeholder="Confirm your PIN"
                          className={`w-full pl-9 pr-9 py-2.5 rounded-xl border bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-4 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition ${
                            confirmPin && pin !== confirmPin
                              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15'
                              : confirmPin && pin === confirmPin
                              ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/15'
                              : 'border-slate-200/90 focus:border-[#2d7995] focus:ring-[#2d7995]/15'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPin(!showConfirmPin)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                          {showConfirmPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* ── FIXED STICKY ACTION FOOTER (Always Visible, Never Clipped) ── */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-50/90 backdrop-blur-md border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {view === 'register' ? (
                <p className="text-xs text-slate-500 text-center sm:text-left order-2 sm:order-1">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={switchToSignIn}
                    className="font-bold text-[#2d7995] hover:underline cursor-pointer"
                  >
                    Sign In here
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500 text-center sm:text-left order-2 sm:order-1">
                  Changes will update your active student profile.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                id="register-submit-btn"
                className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#2d7995] to-[#1f576c] hover:from-[#266881] hover:to-[#1a4a5b] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 order-1 sm:order-2 shrink-0 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{view === 'edit' ? 'Saving Changes...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    {view === 'edit' ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    <span>{view === 'edit' ? 'Save Changes' : 'Submit & Register'}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

        {/* ════════════════════════════════════════════════════════════
            SUCCESS STATE (Account Created or Profile Updated)
        ════════════════════════════════════════════════════════════ */}
        {isSubmittedSuccess && (
          <div className="p-8 text-center space-y-4 animate-fadeIn my-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900">
                {view === 'edit' ? 'Profile Updated!' : 'Account Created Successfully'}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto font-medium mt-2">
                {view === 'edit'
                  ? 'Your changes have been saved successfully.'
                  : 'Your account is ready. Taking you to the Quiz Portal…'}
              </p>
            </div>
            <div className="flex justify-center gap-1.5 pt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-[#2d7995] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentRegistrationModal;
