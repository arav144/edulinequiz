'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import nextDynamic from 'next/dynamic';
import {
  apiGetAvailableQuizzes,
  apiStartQuiz,
  apiSubmitAttempt,
  apiDownloadPdf,
  apiGetMe,
  clearStudentToken,
  getCachedStudent,
  setCachedStudent,
  IThemeSettings,
  DEFAULT_THEME_SETTINGS,
  apiGetTheme,
  resolveMediaUrl,
} from '@/services/api';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { QuizShowcaseSection } from '@/components/QuizShowcaseSection';
import { QuizInstructionsView } from '@/components/QuizInstructionsView';
import { SocialPlatformsFooter } from '@/components/SocialPlatformsFooter';
import {
  recordQuizAttempt,
  getSavedAttempt,
  ISavedAttempt,
} from '@/components/attemptTracker';
import {
  IQuizSummary,
  IQuestionItem,
  ISubmissionResult,
  IStudentProfile,
  TRANSLATIONS,
} from '@/components/types';
import { AlertCircle, X, CalendarDays, UserPlus, LogIn } from 'lucide-react';

// ── Code-split heavy modals and examination/result components (Zero initial bundle bloat) ──
const McqExamination = nextDynamic(
  () => import('@/components/McqExamination').then((m) => m.McqExamination),
  { ssr: false }
);
const CertificateView = nextDynamic(
  () => import('@/components/CertificateView').then((m) => m.CertificateView),
  { ssr: false }
);
const QuestionReview = nextDynamic(
  () => import('@/components/QuestionReview').then((m) => m.QuestionReview),
  { ssr: false }
);
const CertificateLoadingModal = nextDynamic(
  () => import('@/components/CertificateLoadingModal').then((m) => m.CertificateLoadingModal),
  { ssr: false }
);
const AlreadyAttemptedModal = nextDynamic(
  () => import('@/components/AlreadyAttemptedModal').then((m) => m.AlreadyAttemptedModal),
  { ssr: false }
);
const StudentRegistrationModal = nextDynamic(
  () => import('@/components/StudentRegistrationModal').then((m) => m.StudentRegistrationModal),
  { ssr: false }
);
const StudentProfileModal = nextDynamic(
  () => import('@/components/StudentProfileModal').then((m) => m.StudentProfileModal),
  { ssr: false }
);
const InstructionsModal = nextDynamic(
  () => import('@/components/Modals').then((m) => m.InstructionsModal),
  { ssr: false }
);
const ContactModal = nextDynamic(
  () => import('@/components/Modals').then((m) => m.ContactModal),
  { ssr: false }
);
const ConfirmSubmitModal = nextDynamic(
  () => import('@/components/Modals').then((m) => m.ConfirmSubmitModal),
  { ssr: false }
);

// ── Helper to format date nicely ──────────────────────────────────
function fmtDate(raw?: string | Date | null): string {
  if (!raw) return '';
  const d = typeof raw === 'string' ? new Date(raw) : raw;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function StudentPortalPage() {
  // ── Modals & UI State ─────────────────────────────────────────────
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCreatingCertificate, setIsCreatingCertificate] = useState(false);
  const [showAlreadyAttemptedModal, setShowAlreadyAttemptedModal] = useState(false);
  const [attemptedQuizData, setAttemptedQuizData] = useState<{
    quizName: string;
    savedAttempt: ISavedAttempt | null;
  } | null>(null);

  // ── Auth Modal: 'signup' | 'signin' | 'edit' | null ────────────────────────
  const [authModal, setAuthModal] = useState<'signup' | 'signin' | 'edit' | null>(null);
  
  // ── Profile / Results Modal ───────────────────────────────────────
  const [showProfileModal, setShowProfileModal] = useState(false);

  // ── "Please Register" gate modal for guests clicking Start Quiz ───
  const [showGuestGate, setShowGuestGate] = useState(false);
  const [guestGateQuiz, setGuestGateQuiz] = useState<IQuizSummary | null>(null);

  // ── Student session state ─────────────────────────────────────────
  const [cachedProfile, setCachedProfile] = useState<IStudentProfile | null>(null);
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [studentId, setStudentId] = useState('');

  // ── Quiz state ────────────────────────────────────────────────────
  const [quizzes, setQuizzes] = useState<IQuizSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<'quizzes_showcase' | 'instructions' | 'taking_quiz' | 'result'>('quizzes_showcase');
  const [selectedQuiz, setSelectedQuiz] = useState<IQuizSummary | null>(null);

  // ── Examination state ─────────────────────────────────────────────
  const [questions, setQuestions] = useState<IQuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<ISubmissionResult | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  // ── Theme & Examination Visuals ───────────────────────────────────
  const [theme, setTheme] = useState<IThemeSettings>(DEFAULT_THEME_SETTINGS);
  const [themeLoaded, setThemeLoaded] = useState<boolean>(false);

  useEffect(() => {
    apiGetTheme().then((t) => {
      if (t) setTheme(t);
      setThemeLoaded(true);
    }).catch(() => {
      setThemeLoaded(true);
    });
  }, []);


  // ── Per-question timer ────────────────────────────────────────────
  const [timePerQuestion, setTimePerQuestion] = useState<number>(40);
  const [timeLeft, setTimeLeft] = useState<number>(40);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const totalQuestionsRef = useRef(0);
  totalQuestionsRef.current = questions.length;

  const t = TRANSLATIONS.en;

  // ── Load quizzes (Fast 0ms cache + background sync) ─────────────
  const loadQuizzes = useCallback(async (studentIdentifier?: string) => {
    try {
      // 0ms instant display from local cache if present
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('eduline_cached_quizzes');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setQuizzes(parsed);
              setLoading(false);
            }
          }
        } catch {}
      }

      const res = await apiGetAvailableQuizzes(studentIdentifier);
      if (res?.success && Array.isArray(res.quizzes)) {
        setQuizzes(res.quizzes);
        try {
          localStorage.setItem('eduline_cached_quizzes', JSON.stringify(res.quizzes));
        } catch {}
      }
    } catch (err: any) {
      console.warn('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial auth & quiz load (Fast-path + Parallelized) ────────
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fast-path: immediately hydrate from cached profile to eliminate UI delay
      const cached = getCachedStudent();
      let activeIdentifier: string | undefined = undefined;

      if (cached) {
        const rawClass = cached.class || cached.className || '';
        const normalizedClass = rawClass.startsWith('Class ') ? rawClass : rawClass ? `Class ${rawClass}` : '';
        const profile: IStudentProfile = {
          _id: cached._id,
          email: cached.email,
          firstName: cached.firstName,
          lastName: cached.lastName,
          fullName: `${cached.firstName || ''} ${cached.lastName || ''}`.trim(),
          mobileNumber: cached.mobileNumber,
          schoolName: cached.schoolName,
          className: normalizedClass,
          class: normalizedClass,
          dob: cached.dateOfBirth,
          dateOfBirth: cached.dateOfBirth,
          gender: cached.gender,
          state: cached.state,
          address: cached.address,
          pinCode: cached.pinCode,
          participatedEarlier: cached.previousQuizParticipation ? 'Yes' : 'No',
          previousQuizParticipation: cached.previousQuizParticipation,
          studentIdentifier: cached.studentIdentifier,
          isVerifiedEmail: true,
        };
        setCachedProfile(profile);
        setStudentName(profile.fullName);
        setClassName(profile.className);
        setSchoolName(profile.schoolName);
        if (profile.studentIdentifier) {
          setStudentId(profile.studentIdentifier);
          activeIdentifier = profile.studentIdentifier;
        }
      }

      // Parallelize background auth verification & quiz loading
      const quizPromise = loadQuizzes(activeIdentifier);
      const authPromise = apiGetMe()
        .then((meRes) => {
          if (meRes?.success && meRes.student) {
            const s = meRes.student;
            const rawClass = s.class || s.className || '';
            const normalizedClass = rawClass.startsWith('Class ') ? rawClass : rawClass ? `Class ${rawClass}` : '';
            const updatedProfile: IStudentProfile = {
              _id: s._id,
              email: s.email,
              firstName: s.firstName,
              lastName: s.lastName,
              fullName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
              mobileNumber: s.mobileNumber,
              schoolName: s.schoolName,
              className: normalizedClass,
              class: normalizedClass,
              dob: s.dateOfBirth,
              dateOfBirth: s.dateOfBirth,
              gender: s.gender,
              state: s.state,
              address: s.address,
              pinCode: s.pinCode,
              participatedEarlier: s.previousQuizParticipation ? 'Yes' : 'No',
              previousQuizParticipation: s.previousQuizParticipation,
              studentIdentifier: s.studentIdentifier,
              isVerifiedEmail: true,
            };
            setCachedProfile(updatedProfile);
            setStudentName(updatedProfile.fullName);
            setClassName(updatedProfile.className);
            setSchoolName(updatedProfile.schoolName);
            if (updatedProfile.studentIdentifier) setStudentId(updatedProfile.studentIdentifier);
          }
        })
        .catch(() => {});

      await Promise.all([quizPromise, authPromise]);
    } catch (err: any) {
      console.error('Initial portal load error:', err);
    } finally {
      setLoading(false);
    }
  }, [loadQuizzes]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  // ── Logout ────────────────────────────────────────────────────────
  const handleLogout = () => {
    clearStudentToken();
    setCachedProfile(null);
    setStudentName('');
    setClassName('');
    setSchoolName('');
    setStudentId('');
    setSelectedQuiz(null);
    setPhase('quizzes_showcase');
    loadQuizzes();
    // Redirect to sign-in view
    setAuthModal('signin');
  };

  // ── Quiz timer ────────────────────────────────────────────────────
  const handleNextQuestion = useCallback(() => {
    if (currentIndexRef.current < totalQuestionsRef.current - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(timePerQuestion);
    } else {
      setShowConfirmModal(true);
    }
  }, [timePerQuestion]);

  useEffect(() => {
    if (phase === 'taking_quiz' && timerActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (currentIndexRef.current < totalQuestionsRef.current - 1) {
              handleNextQuestion();
              return timePerQuestion;
            } else {
              setTimerActive(false);
              setShowConfirmModal(true);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [phase, timerActive, timePerQuestion, handleNextQuestion]);

  // ── Registration / Edit success callback ─────────────────────────
  const handleRegistrationSuccess = async (profile: IStudentProfile) => {
    const freshProfile = { ...profile };
    setCachedProfile(freshProfile);
    setStudentName(freshProfile.fullName);
    setClassName(freshProfile.className);
    setSchoolName(freshProfile.schoolName);
    if (freshProfile.studentIdentifier) setStudentId(freshProfile.studentIdentifier);
    setCachedStudent(freshProfile);
    setAuthModal(null);
    setShowGuestGate(false);

    // Re-load quizzes filtered to this student's class
    await loadQuizzes(profile.studentIdentifier);

    if (selectedQuiz) {
      setPhase('instructions');
    } else {
      setPhase('quizzes_showcase');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Filter quizzes by registered student class ────────────────────
  const filteredQuizzes: IQuizSummary[] = React.useMemo(() => {
    if (!cachedProfile) return quizzes; // guest sees all quizzes
    const studentClass = cachedProfile.className || `Class ${cachedProfile.class}`;
    if (!studentClass) return quizzes;
    return quizzes.filter(q => {
      // Match by classes array or targetClass
      if (q.classes && q.classes.length > 0) {
        return q.classes.some(c => {
          const normalized = c.startsWith('Class ') ? c : `Class ${c}`;
          return normalized === studentClass;
        });
      }
      if (q.targetClass) {
        const normalized = q.targetClass.startsWith('Class ') ? q.targetClass : `Class ${q.targetClass}`;
        return normalized === studentClass || q.targetClass === 'All';
      }
      return true;
    });
  }, [quizzes, cachedProfile]);

  // ── Quiz card click ───────────────────────────────────────────────
  const handleSelectQuizCard = (quiz: IQuizSummary) => {
    setSelectedQuiz(quiz);

    if (!cachedProfile) {
      // Guest: show gate modal with quiz info (upcoming date if applicable)
      setGuestGateQuiz(quiz);
      setShowGuestGate(true);
      return;
    }

    setPhase('instructions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Start Quiz (called from instructions screen) ──────────────────
  const handleStartQuiz = async (quiz: IQuizSummary) => {
    if (!cachedProfile) {
      setGuestGateQuiz(quiz);
      setShowGuestGate(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSelectedQuiz(quiz);

      const rollOrId = studentId.trim() || cachedProfile.studentIdentifier || '01';
      const res = await apiStartQuiz(quiz._id, rollOrId);

      if (res.code === 'ALREADY_ATTEMPTED' || res.alreadyAttempted) {
        recordQuizAttempt(quiz._id, { studentName: studentName.trim() || cachedProfile.fullName, studentIdentifier: rollOrId });
        setAttemptedQuizData({ quizName: quiz.name, savedAttempt: getSavedAttempt(quiz._id) });
        setShowAlreadyAttemptedModal(true);
        return;
      }

      const questionList = res.questions || res.data?.questions || [];
      if (res.success && questionList.length > 0) {
        setQuestions(questionList);
        setCurrentIndex(0);
        setAnswers({});
        const timerSeconds = quiz.timePerQuestion || 40;
        setTimePerQuestion(timerSeconds);
        setTimeLeft(timerSeconds);
        setTimerActive(true);
        setPhase('taking_quiz');
      } else if (res.success && questionList.length === 0) {
        setError('No questions are available for this quiz yet. Please check back later.');
      } else {
        setError(res.message || 'Could not start quiz.');
      }
    } catch (err: any) {
      if (err.code === 'ALREADY_ATTEMPTED' || err.message?.includes('already submitted an attempt')) {
        setAttemptedQuizData({ quizName: quiz.name, savedAttempt: getSavedAttempt(quiz._id) });
        setShowAlreadyAttemptedModal(true);
      } else {
        setError(err.message || 'Could not start quiz. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Answer selection ──────────────────────────────────────────────
  const handleSelectAnswer = (questionId: string, optionKey: 'A' | 'B' | 'C' | 'D') => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  // ── Final submission ──────────────────────────────────────────────
  const handleConfirmSubmit = async () => {
    if (!selectedQuiz) return;
    try {
      setSubmitting(true);
      setShowConfirmModal(false);
      setIsCreatingCertificate(true);
      setTimerActive(false);

      const rollOrId = studentId.trim() || cachedProfile?.studentIdentifier || '01';
      const submitPromise = apiSubmitAttempt(selectedQuiz._id, {
        studentIdentifier: rollOrId,
        name: studentName.trim() || cachedProfile?.fullName || 'Student',
        className: className || cachedProfile?.className,
        schoolName: schoolName.trim() || cachedProfile?.schoolName,
        answers,
      });
      const delayPromise = new Promise((resolve) => setTimeout(resolve, 2000));
      const [res] = await Promise.all([submitPromise, delayPromise]);

      const submissionData = res.data || res.result;
      if (res.success && submissionData) {
        recordQuizAttempt(selectedQuiz._id, {
          attemptId: submissionData.attemptId,
          studentName: submissionData.studentName || studentName.trim(),
          studentIdentifier: rollOrId,
          submittedAt: submissionData.submittedAt,
          score: submissionData.score,
          totalQuestions: submissionData.totalQuestions,
          percentage: submissionData.percentage,
          result: submissionData.result,
          certificateId: submissionData.certificateId,
          className: submissionData.className || className,
          schoolName: submissionData.schoolName || schoolName,
          review: submissionData.review,
        });
        setSubmissionResult(submissionData);
        setPhase('result');
      } else {
        setError(res.message || 'Failed to evaluate quiz submission.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate quiz submission.');
    } finally {
      setIsCreatingCertificate(false);
      setSubmitting(false);
    }
  };

  // ── PDF download ──────────────────────────────────────────────────
  const handleDownloadPdf = async (type: 'pdf' | 'certificate') => {
    const attemptId = submissionResult?.attemptId || (submissionResult as any)?._id || submissionResult?.certificateId;
    if (!attemptId) {
      alert('Result or Attempt ID not found. Please try again.');
      return;
    }
    const rollOrId = submissionResult?.studentIdentifier || studentId.trim() || cachedProfile?.studentIdentifier || '01';
    try {
      setDownloadingPdf(type);
      const blob = await apiDownloadPdf(String(attemptId), type, rollOrId);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${type === 'certificate' ? 'Certificate' : 'Result'}_${(submissionResult?.studentName || 'Student').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 8000);
    } catch (err: any) {
      alert(`Could not download ${type}: ${err.message || 'Unknown error'}`);
    } finally {
      setDownloadingPdf(null);
    }
  };

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  // ── RENDER ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-slate-800 flex flex-col font-sans selection:bg-[#2d7995] selection:text-white relative overflow-x-hidden">
      {/* ── Dynamic Body Background Layer (Full Frontend) ── */}
      <div
        className="portal-bg-layer"
        style={{
          backgroundColor: theme?.bgColor || '#FAF9F5',
          backgroundImage:
            theme?.enableBgImage !== false && theme?.bgImage
              ? `url(${resolveMediaUrl(theme.bgImage)})`
              : 'none',
        }}
        aria-hidden="true"
      />

      {/* ── Fixed Illustration on Body Background (Positioned from Backend Theme) ── */}
      {themeLoaded && theme?.showTopRightImage && theme?.topRightImage && (
        <div
          className="fixed pointer-events-none select-none z-0 transition-all duration-300 will-change-transform"
          style={{
            top: `${theme?.topRightTop ?? 80}px`,
            right: `${theme?.topRightRight ?? 40}px`,
            width: `${theme?.topRightImageWidth ?? 160}px`,
            maxWidth: '35vw',
            transform: 'translateZ(0)',
          }}
          aria-hidden="true"
        >
          <img
            src={resolveMediaUrl(theme.topRightImage)}
            alt=""
            loading="eager"
            decoding="async"
            className="w-full h-auto object-contain drop-shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ── HEADER ──────────────────────────────────────────── */}
        <Header
          t={{ navHome: 'Home', navInstructions: 'Instructions', navContact: 'Contact Us' }}
          isQuizActive={phase === 'taking_quiz'}
          registeredStudentName={cachedProfile?.fullName || cachedProfile?.firstName}
          registeredStudentClass={cachedProfile?.class || cachedProfile?.className?.replace('Class ', '')}
          onOpenInstructions={() => setShowInstructionsModal(true)}
          onOpenContact={() => setShowContactModal(true)}
          onNavigateHome={() => setPhase('quizzes_showcase')}
          onOpenRegister={() => setAuthModal('signup')}
          onOpenSignIn={() => setAuthModal('signin')}
          onOpenProfile={() => setShowProfileModal(true)}
          onLogout={handleLogout}
        />

        {/* ── MAIN ────────────────────────────────────────────── */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col justify-start">
          {/* Global error banner — only show non-auth, user-relevant errors */}
          {error && !error.toLowerCase().includes('authentication') && !error.toLowerCase().includes('unauthorized') && !error.toLowerCase().includes('register or verify') && (
            <div className="max-w-2xl mx-auto mb-6 p-4 rounded-2xl bg-rose-900/90 border border-rose-400 text-rose-100 text-xs font-semibold flex items-center justify-between backdrop-blur-md shadow-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-rose-300 hover:text-white font-bold ml-4 cursor-pointer">✕</button>
            </div>
          )}

          {/* ── VIEW 1: HOME / QUIZZES ───────────────────────── */}
          {phase === 'quizzes_showcase' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Hero welcome banner */}
              <HeroSection
                studentProfile={cachedProfile}
                onOpenRegister={() => setAuthModal('signup')}
                onRegistrationSuccess={handleRegistrationSuccess}
                onScrollToQuizzes={() => {
                  const el = document.getElementById('quiz-showcase-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />

              {/* Quiz grid */}
              {loading ? (
                <div className="py-16 text-center text-sm font-semibold text-slate-500">Loading quizzes...</div>
              ) : (
                <QuizShowcaseSection
                  quizzes={filteredQuizzes}
                  selectedClassName={className}
                  onSelectQuiz={handleSelectQuizCard}
                />
              )}
            </div>
          )}

          {/* ── VIEW 2: INSTRUCTIONS ────────────────────────── */}
          {phase === 'instructions' && (
            <QuizInstructionsView
              quiz={selectedQuiz}
              studentProfile={cachedProfile}
              onStartQuiz={() => selectedQuiz && handleStartQuiz(selectedQuiz)}
              onBack={() => setPhase('quizzes_showcase')}
              onEditProfile={() => setAuthModal('signup')}
            />
          )}

          {/* ── VIEW 3: ACTIVE EXAMINATION ──────────────────── */}
          {phase === 'taking_quiz' && currentQ && (
            <div className="relative w-full">

              <McqExamination
                t={selectedQuiz?.language === 'hi' || /हिंदी|गांधी/i.test(selectedQuiz?.name || '') ? TRANSLATIONS.hi : t}
                isHindiMode={selectedQuiz?.language === 'hi' || /हिंदी|गांधी/i.test(selectedQuiz?.name || '')}
                currentQ={currentQ}
                currentIndex={currentIndex}
                totalQuestions={totalQuestions}
                selectedQuiz={selectedQuiz}
                timeLeft={timeLeft}
                answeredCount={answeredCount}
                answers={answers}
                onSelectAnswer={handleSelectAnswer}
                onNextQuestion={handleNextQuestion}
                onRequestSubmit={() => setShowConfirmModal(true)}
                theme={theme}
              />
            </div>
          )}

          {/* ── VIEW 4: RESULT & CERTIFICATE ────────────────── */}
          {phase === 'result' && submissionResult && (
            <div className="max-w-4xl mx-auto w-full space-y-8 pb-12">
              <CertificateView
                submissionResult={submissionResult}
                lang="en"
                classNameVal={className}
                schoolNameVal={schoolName}
                downloadingPdf={downloadingPdf}
                onDownloadPdf={handleDownloadPdf}
                onBackToDashboard={() => setPhase('quizzes_showcase')}
              />
              <QuestionReview
                review={
                  submissionResult.review && submissionResult.review.length > 0
                    ? submissionResult.review
                    : questions.map((q) => {
                        const studentChoice = answers[q._id] || 'Unanswered';
                        const correctAnswer = (q as any).correctAnswer || 'A';
                        return { questionId: q._id, question: q.question, options: q.options, studentChoice, correctAnswer, isCorrect: studentChoice === correctAnswer };
                      })
                }
                lang="en"
              />
            </div>
          )}
        </main>

        {/* ── CERTIFICATE LOADING OVERLAY ──────────────────── */}
        <CertificateLoadingModal isOpen={isCreatingCertificate} lang="en" studentName={studentName || cachedProfile?.fullName} />

        {/* ── ALREADY ATTEMPTED MODAL ──────────────────────── */}
        <AlreadyAttemptedModal
          isOpen={showAlreadyAttemptedModal}
          onClose={() => setShowAlreadyAttemptedModal(false)}
          lang="en"
          quizName={attemptedQuizData?.quizName}
          classNameVal={className}
          savedAttempt={attemptedQuizData?.savedAttempt}
          onViewPreviousCertificate={
            attemptedQuizData?.savedAttempt
              ? () => {
                  const saved = attemptedQuizData.savedAttempt;
                  if (saved) {
                    setSubmissionResult({ attemptId: saved.attemptId, studentName: saved.studentName, studentIdentifier: saved.studentIdentifier, className: saved.className || className || '', section: 'A', schoolName: saved.schoolName || schoolName || '', quizName: attemptedQuizData.quizName || 'Academic Assessment', score: saved.score ?? 0, totalQuestions: saved.totalQuestions ?? 10, percentage: saved.percentage ?? 0, result: (saved.result as any) || 'Pass', submittedAt: saved.submittedAt, certificateId: saved.certificateId, review: saved.review || [] });
                    setShowAlreadyAttemptedModal(false);
                    setPhase('result');
                  }
                }
              : undefined
          }
        />

        {/* ── INSTRUCTIONS / CONTACT / CONFIRM MODALS ──────── */}
        <InstructionsModal isOpen={showInstructionsModal} onClose={() => setShowInstructionsModal(false)} quiz={selectedQuiz || (quizzes.length > 0 ? quizzes[0] : null)} classNameVal={className} lang="en" />
        <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} quiz={selectedQuiz || (quizzes.length > 0 ? quizzes[0] : null)} lang="en" />
        <ConfirmSubmitModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirmSubmit} answeredCount={answeredCount} totalQuestions={totalQuestions} submitting={submitting} lang="en" />

        {/* ── STUDENT REGISTRATION / SIGN-IN MODAL ─────────── */}
        <StudentRegistrationModal
          isOpen={authModal !== null}
          onClose={() => setAuthModal(null)}
          onSuccess={handleRegistrationSuccess}
          initialClass={className}
          initialSchool={schoolName}
          initialMode={authModal === 'signin' ? 'signin' : authModal === 'edit' ? 'edit' : 'signup'}
        />

        {/* ── STUDENT PROFILE & RESULTS MODAL ──────────────── */}
        <StudentProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          profile={cachedProfile}
          onEditProfile={() => {
            setShowProfileModal(false);
            setAuthModal('edit');
          }}
        />

        {/* ── GUEST GATE MODAL ────────────────────────────── */}
        {showGuestGate && guestGateQuiz && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#2d7995] to-[#1f576c] px-6 py-4 flex items-center justify-between">
                <h2 className="text-white font-black text-base">Registration Required</h2>
                <button onClick={() => setShowGuestGate(false)} className="text-white/70 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Quiz info */}
                <div className="bg-[#2d7995]/10 border border-[#2d7995]/25 rounded-xl p-4">
                  <p className="text-xs text-[#2d7995] font-bold uppercase tracking-wide mb-1">
                    {guestGateQuiz.scheduleStatus === 'Upcoming' ? 'Upcoming Quiz' : 'Quiz'}
                  </p>
                  <p className="font-black text-slate-900 text-sm">{guestGateQuiz.name}</p>
                  {guestGateQuiz.scheduleStatus === 'Upcoming' && guestGateQuiz.startDate && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#194c5f] font-semibold">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                      <span>Quiz starts on: {fmtDate(guestGateQuiz.startDate)}</span>
                    </div>
                  )}
                  {guestGateQuiz.scheduleStatus === 'Upcoming' && guestGateQuiz.timing && (
                    <p className="text-xs text-[#194c5f] mt-1 pl-5">⏰ Time: {guestGateQuiz.timing}</p>
                  )}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {guestGateQuiz.scheduleStatus === 'Upcoming'
                    ? 'This quiz is coming soon. Register now so you\'re ready to attempt it on the quiz date!'
                    : 'You need to register or sign in to attempt this quiz and receive your certificate.'}
                </p>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowGuestGate(false); setAuthModal('signin'); }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-bold text-sm transition cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowGuestGate(false); setAuthModal('signup'); }}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#2d7995] to-[#1f576c] hover:from-[#266881] hover:to-[#1a4a5b] text-white font-bold text-sm transition shadow-md cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Register Free
                  </button>
                </div>

                <p className="text-center text-[11px] text-slate-400">
                  Registration is free. Takes less than 2 minutes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER ───────────────────────────────────────── */}
        {phase !== 'taking_quiz' && <SocialPlatformsFooter />}
      </div>
    </div>
  );
}