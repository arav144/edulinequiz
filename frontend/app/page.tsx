'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  apiGetAvailableQuizzes,
  apiGetSubjects,
  apiVerifyStudent,
  apiStartQuiz,
  apiSubmitAttempt,
  apiDownloadPdf,
} from '@/services/api';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { McqExamination } from '@/components/McqExamination';
import { CertificateView } from '@/components/CertificateView';
import { QuestionReview } from '@/components/QuestionReview';
import { CertificateLoadingModal } from '@/components/CertificateLoadingModal';
import { AlreadyAttemptedModal } from '@/components/AlreadyAttemptedModal';
import {
  getDeviceStudentId,
  hasAttemptedQuiz,
  recordQuizAttempt,
  getSavedAttempt,
  ISavedAttempt,
} from '@/components/attemptTracker';
import {
  InstructionsModal,
  ContactModal,
  ConfirmSubmitModal,
} from '@/components/Modals';
import { FloatingHindiLetters } from '@/components/FloatingHindiLetters';
import {
  IQuizSummary,
  IQuestionItem,
  ISubmissionResult,
  Language,
  TRANSLATIONS,
} from '@/components/types';

export default function StudentPortalPage() {
  // Navigation & modals
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCreatingCertificate, setIsCreatingCertificate] = useState(false);
  const [showAlreadyAttemptedModal, setShowAlreadyAttemptedModal] = useState(false);
  const [attemptedQuizData, setAttemptedQuizData] = useState<{
    quizName: string;
    savedAttempt: ISavedAttempt | null;
  } | null>(null);

  // Student registration form state
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('A');
  const [studentId, setStudentId] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [selectedSubjectName, setSelectedSubjectName] = useState('');

  // Dropdown lists
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  // Quizzes & Flow state
  const [quizzes, setQuizzes] = useState<IQuizSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [phase, setPhase] = useState<
    'registration' | 'quizzes_list' | 'taking_quiz' | 'result'
  >('registration');
  const [verifiedStudent, setVerifiedStudent] = useState<any | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<IQuizSummary | null>(null);

  // Examination state
  const [questions, setQuestions] = useState<IQuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<ISubmissionResult | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  // Per-question timer state
  const [timePerQuestion, setTimePerQuestion] = useState<number>(30);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  // References
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const totalQuestionsRef = useRef(0);
  totalQuestionsRef.current = questions.length;

  // Language selection strictly determined by quiz configuration
  const currentSubjectQuiz =
    selectedQuiz ||
    quizzes.find((q) => q.subject?.toLowerCase() === selectedSubjectName?.toLowerCase()) ||
    quizzes[0];
  const lang: Language = currentSubjectQuiz?.language === 'en' ? 'en' : 'hi';
  const isHindiMode = lang === 'hi';
  const t = TRANSLATIONS[lang];

  // -------------------------------------------------------------
  // Initial Load: Fetch Quizzes & Subjects
  // -------------------------------------------------------------
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [quizRes, subRes] = await Promise.allSettled([
        apiGetAvailableQuizzes(),
        apiGetSubjects(),
      ]);

      const subSet = new Set<string>();

      // Add subjects from subjects collection
      if (subRes.status === 'fulfilled' && subRes.value?.success && subRes.value?.subjects) {
        subRes.value.subjects.forEach((s: any) => {
          if (s.name) subSet.add(s.name);
        });
      }

      // Add quizzes & subjects from quizzes
      if (quizRes.status === 'fulfilled' && quizRes.value?.success) {
        const rawQuizzes: IQuizSummary[] =
          quizRes.value?.quizzes || quizRes.value?.data || [];
        const fetchedQuizzes = rawQuizzes.map((q) => ({
          ...q,
          name: (q.name || '')
            .replace(/हिंदी दिवस क्विज़/g, 'हिंदी दिवस प्रतियोगिता')
            .replace(/क्विज़/g, 'प्रतियोगिता'),
          instructions: (q.instructions || '')
            .replace(/हिंदी दिवस क्विज़/g, 'हिंदी दिवस प्रतियोगिता')
            .replace(/क्विज़/g, 'प्रतियोगिता'),
        }));
        if (fetchedQuizzes.length > 0) {
          setQuizzes(fetchedQuizzes);
          fetchedQuizzes.forEach((q: any) => {
            if (q.subject) subSet.add(q.subject);
          });
        }
      } else if (quizRes.status === 'rejected') {
        console.warn('Backend connection notice:', quizRes.reason);
      }

      // Standard defaults
      const defaults = ['Hindi', 'English', 'General Knowledge'];
      defaults.forEach((d) => subSet.add(d));

      const subs = Array.from(subSet);
      setAvailableSubjects(subs);
      setSelectedSubjectName((prev) => (prev && subs.includes(prev) ? prev : subs[0] || 'Hindi'));
    } catch (err: any) {
      console.error('Initial load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // -------------------------------------------------------------
  // Handle Next Question Navigation
  // -------------------------------------------------------------
  const handleNextQuestion = useCallback(() => {
    if (currentIndexRef.current < totalQuestionsRef.current - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(timePerQuestion);
    } else {
      setShowConfirmModal(true);
    }
  }, [timePerQuestion]);

  // -------------------------------------------------------------
  // Timer Countdown Effect
  // -------------------------------------------------------------
  useEffect(() => {
    if (phase === 'taking_quiz' && timerActive) {
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Auto advance when time runs out
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

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [phase, timerActive, timePerQuestion, handleNextQuestion]);

  // -------------------------------------------------------------
  // Student Form Registration & Verification
  // -------------------------------------------------------------
  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError(lang === 'hi' ? 'कृपया छात्र का नाम दर्ज करें' : 'Please enter student name');
      return;
    }
    if (!className) {
      setError(lang === 'hi' ? 'कृपया कक्षा चुनें' : 'Please select a class');
      return;
    }
    if (!schoolName.trim()) {
      setError(lang === 'hi' ? 'कृपया विद्यालय का नाम दर्ज करें' : 'Please enter school name');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use persistent stable device student ID so attempts are reliably bound to this browser/device
      const effectiveStudentId = studentId.trim() || getDeviceStudentId();
      if (!studentId.trim()) {
        setStudentId(effectiveStudentId);
      }

      // 1. Ensure quizzes are available: if list is empty, try an immediate fetch
      let currentQuizzes = [...quizzes];
      if (currentQuizzes.length === 0) {
        try {
          const freshRes = await apiGetAvailableQuizzes();
          if (freshRes?.success && Array.isArray(freshRes.quizzes) && freshRes.quizzes.length > 0) {
            currentQuizzes = freshRes.quizzes.map((q: any) => ({
              ...q,
              name: (q.name || '')
                .replace(/हिंदी दिवस क्विज़/g, 'हिंदी दिवस प्रतियोगिता')
                .replace(/क्विज़/g, 'प्रतियोगिता'),
              instructions: (q.instructions || '')
                .replace(/हिंदी दिवस क्विज़/g, 'हिंदी दिवस प्रतियोगिता')
                .replace(/क्विज़/g, 'प्रतियोगिता'),
            }));
            setQuizzes(currentQuizzes);
          }
        } catch (e) {
          console.warn('Direct quiz fetch retry on submit failed:', e);
        }
      }

      // Find target quiz for selected subject
      let targetQuiz =
        currentQuizzes.find((q) => {
          if (!q.subject || !selectedSubjectName) return false;
          const s1 = q.subject.trim().toLowerCase();
          const s2 = selectedSubjectName.trim().toLowerCase();
          if (s1 === s2) return true;
          if ((s1 === 'hindi' || s1 === 'हिन्दी' || s1 === 'हिंदी') && (s2 === 'hindi' || s2 === 'हिन्दी' || s2 === 'हिंदी')) return true;
          if ((s1 === 'english' || s1 === 'अंग्रेजी') && (s2 === 'english' || s2 === 'अंग्रेजी')) return true;
          return false;
        }) ||
        currentQuizzes.find((q) => q.isPlayable) ||
        currentQuizzes[0];

      // Safe Fallback for deployed instances: If backend query was temporarily delayed
      // use the pre-configured Hindi Diwas Quiz ID from DB so student is never stuck
      if (!targetQuiz) {
        targetQuiz = {
          _id: '6aa135e7c6fef42f692e825f',
          name: 'हिंदी दिवस प्रतियोगिता',
          subject: 'Hindi',
          numberOfQuestions: 10,
          passingPercentage: 50,
          timePerQuestion: 30,
          isPlayable: true,
          status: 'Published',
          language: 'hi',
        } as IQuizSummary;
      }

      // Check Cookies & LocalStorage: Has this user already attempted this specific quiz?
      if (hasAttemptedQuiz(targetQuiz._id)) {
        const saved = getSavedAttempt(targetQuiz._id);
        setAttemptedQuizData({
          quizName: targetQuiz.name,
          savedAttempt: saved,
        });
        setShowAlreadyAttemptedModal(true);
        setLoading(false);
        return;
      }

      const res = await apiVerifyStudent(
        targetQuiz._id,
        effectiveStudentId,
        studentName.trim(),
        {
          className,
          section: section || '',
          schoolName: schoolName.trim(),
        }
      );

      if (res.alreadyAttempted || res.code === 'ALREADY_ATTEMPTED') {
        recordQuizAttempt(targetQuiz._id, {
          studentName: studentName.trim(),
          studentIdentifier: effectiveStudentId,
        });
        setAttemptedQuizData({
          quizName: targetQuiz.name,
          savedAttempt: getSavedAttempt(targetQuiz._id),
        });
        setShowAlreadyAttemptedModal(true);
        setLoading(false);
        return;
      }

      const verified = res.data || res.student;
      if (res.success && (res.canAttempt || verified)) {
        setVerifiedStudent(verified || { studentIdentifier: studentId.trim(), name: studentName.trim() });
        await handleStartQuiz(targetQuiz);
      } else {
        setError(res.message || (lang === 'hi' ? 'सत्यापन विफल रहा' : 'Verification failed'));
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Start Quiz
  // -------------------------------------------------------------
  const handleStartQuiz = async (quiz: IQuizSummary) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedQuiz(quiz);

      const rollOrId = studentId.trim() || verifiedStudent?.studentIdentifier || '01';
      const res = await apiStartQuiz(quiz._id, rollOrId);

      if (res.code === 'ALREADY_ATTEMPTED' || res.alreadyAttempted) {
        recordQuizAttempt(quiz._id, {
          studentName: studentName.trim(),
          studentIdentifier: rollOrId,
        });
        setAttemptedQuizData({
          quizName: quiz.name,
          savedAttempt: getSavedAttempt(quiz._id),
        });
        setShowAlreadyAttemptedModal(true);
        return;
      }

      const questionList = res.questions || res.data?.questions || [];
      if (res.success && questionList.length > 0) {
        setQuestions(questionList);
        setCurrentIndex(0);
        setAnswers({});

        // Configure timer
        const timerSeconds =
          res.timePerQuestion || res.data?.timePerQuestion || quiz.timePerQuestion || 30;
        setTimePerQuestion(timerSeconds);
        setTimeLeft(timerSeconds);
        setTimerActive(true);

        setPhase('taking_quiz');
      } else if (res.success && questionList.length === 0) {
        setError(
          lang === 'hi'
            ? 'इस प्रतियोगिता में अभी कोई प्रश्न उपलब्ध नहीं हैं।'
            : 'No questions are available for this quiz yet.'
        );
      } else {
        setError(res.message || (lang === 'hi' ? 'प्रतियोगिता शुरू करने में असमर्थ' : 'Could not start quiz.'));
      }
    } catch (err: any) {
      setError(err.message || 'Could not start quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Option Selection
  // -------------------------------------------------------------
  const handleSelectAnswer = (questionId: string, optionKey: 'A' | 'B' | 'C' | 'D') => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  // -------------------------------------------------------------
  // Final Submission with 2-second Certificate Creation Screen
  // -------------------------------------------------------------
  const handleConfirmSubmit = async () => {
    if (!selectedQuiz) return;
    try {
      setSubmitting(true);
      setShowConfirmModal(false);
      setIsCreatingCertificate(true);
      setTimerActive(false);

      const rollOrId = studentId.trim() || verifiedStudent?.studentIdentifier || '01';
      
      const submitPromise = apiSubmitAttempt(selectedQuiz._id, {
        studentIdentifier: rollOrId,
        name: studentName.trim() || verifiedStudent?.name || 'Student',
        className: className || verifiedStudent?.className,
        section: section || verifiedStudent?.section,
        schoolName: schoolName.trim() || verifiedStudent?.schoolName,
        answers,
      });

      // Enforce at least 2 full seconds for the certificate creation loading screen
      const delayPromise = new Promise((resolve) => setTimeout(resolve, 2000));

      const [res] = await Promise.all([submitPromise, delayPromise]);

      const submissionData = res.data || res.result;
      if (res.success && submissionData) {
        // Record in Cookies & LocalStorage that this specific quiz was completed
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
        setError(res.message || 'Failed to evaluate quiz submission');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate quiz submission');
    } finally {
      setIsCreatingCertificate(false);
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // PDF / Certificate Download
  // -------------------------------------------------------------
  const handleDownloadPdf = async (type: 'pdf' | 'certificate') => {
    if (!submissionResult?.attemptId) return;
    const rollOrId =
      submissionResult.studentIdentifier ||
      studentId.trim() ||
      verifiedStudent?.studentIdentifier ||
      '01';

    try {
      setDownloadingPdf(type);
      const blob = await apiDownloadPdf(submissionResult.attemptId, type, rollOrId);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${type === 'certificate' ? 'Certificate' : 'Result'}_${submissionResult.studentName || 'Student'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(`Could not download: ${err.message}`);
    } finally {
      setDownloadingPdf(null);
    }
  };

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div
      className="min-h-screen text-slate-800 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-900 bg-cover bg-center bg-fixed bg-no-repeat relative overflow-x-hidden"
      style={{
        backgroundImage: "url('/img/background.jpg')",
      }}
    >
      {/* Floating Hindi Letters with interactive cursor repulsion */}
      <FloatingHindiLetters />

      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-white/10 pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* TOP HEADER */}
        <Header
          t={t}
          isQuizActive={phase === 'taking_quiz'}
          onOpenInstructions={() => setShowInstructionsModal(true)}
          onOpenContact={() => setShowContactModal(true)}
          onNavigateHome={() => setPhase('registration')}
        />

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-2 sm:py-6 lg:py-8 flex flex-col justify-start sm:justify-center">
          {/* Global Alert / Notification */}
          {error && (
            <div className="max-w-2xl mx-auto mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-semibold flex items-center justify-between backdrop-blur-md shadow-lg animate-fadeIn">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-rose-400 hover:text-white font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}

          {/* VIEW 1: HERO & STUDENT REGISTRATION */}
          {phase === 'registration' && (
            <HeroSection
              t={t}
              lang={lang}
              isHindiMode={isHindiMode}
              studentName={studentName}
              setStudentName={setStudentName}
              className={className}
              setClassName={setClassName}
              section={section}
              setSection={setSection}
              studentId={studentId}
              setStudentId={setStudentId}
              selectedSubjectName={selectedSubjectName}
              setSelectedSubjectName={setSelectedSubjectName}
              schoolName={schoolName}
              setSchoolName={setSchoolName}
              availableSubjects={availableSubjects}
              currentSubjectQuiz={currentSubjectQuiz}
              loading={loading}
              onSubmit={handleRegisterStudent}
            />
          )}

          {/* VIEW 2: QUIZZES LIST (IF MULTIPLE AVAILABLE) */}
          {phase === 'quizzes_list' && (
            <div className="max-w-4xl mx-auto w-full space-y-6 animate-fadeIn">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {lang === 'hi' ? 'उपलब्ध प्रश्नोत्तरी' : 'Available Assessments'}
                </h2>
                <p className="text-xs text-slate-300">
                  {lang === 'hi'
                    ? 'कृपया अपनी परीक्षा शुरू करने के लिए प्रतियोगिता का चयन करें'
                    : 'Select your examination to begin test'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz._id}
                    className="bg-slate-900/85 border border-slate-700/80 hover:border-amber-500/60 p-6 rounded-3xl space-y-4 backdrop-blur-md shadow-xl transition hover:-translate-y-1"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {quiz.subject || 'General'}
                      </span>
                      <h3 className="text-lg font-bold text-white pt-1">{quiz.name}</h3>
                      <p className="text-xs text-slate-300 line-clamp-2">{quiz.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
                      <span>{quiz.numberOfQuestions} Questions</span>
                      <span>Pass: {quiz.passingPercentage || 50}%</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartQuiz(quiz)}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
                    >
                      <span>{lang === 'hi' ? 'परीक्षा शुरू करें ➔' : 'Start Assessment ➔'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 3: ACTIVE MCQ EXAMINATION (MATCHES IMAGE 1) */}
          {phase === 'taking_quiz' && currentQ && (
            <McqExamination
              t={t}
              isHindiMode={isHindiMode}
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
            />
          )}

          {/* VIEW 4: CERTIFICATE & REVIEW (MATCHES IMAGE 2) */}
          {phase === 'result' && submissionResult && (
            <div className="max-w-4xl mx-auto w-full space-y-8 animate-fadeIn pb-12">
              {/* 1. The Certificate */}
              <CertificateView
                submissionResult={submissionResult}
                lang={lang}
                classNameVal={className}
                sectionVal={section}
                schoolNameVal={schoolName}
                downloadingPdf={downloadingPdf}
                onDownloadPdf={handleDownloadPdf}
                onBackToDashboard={() => setPhase('registration')}
              />

              {/* 2. Question-by-Question Review (कौन-से सही, कौन-से गलत) */}
              <QuestionReview
                review={
                  submissionResult.review && submissionResult.review.length > 0
                    ? submissionResult.review
                    : questions.map((q) => {
                        const studentChoice = answers[q._id] || 'Unanswered';
                        const correctAnswer = (q as any).correctAnswer || 'A';
                        return {
                          questionId: q._id,
                          question: q.question,
                          options: q.options,
                          studentChoice,
                          correctAnswer,
                          isCorrect: studentChoice === correctAnswer,
                        };
                      })
                }
                lang={lang}
              />
            </div>
          )}
        </main>

        {/* 2-Second Certificate Creation Loading Screen */}
        <CertificateLoadingModal
          isOpen={isCreatingCertificate}
          lang={lang}
          studentName={studentName || verifiedStudent?.name}
        />

        {/* Modal: Quiz Already Attempted Notice */}
        <AlreadyAttemptedModal
          isOpen={showAlreadyAttemptedModal}
          onClose={() => setShowAlreadyAttemptedModal(false)}
          lang={lang}
          quizName={attemptedQuizData?.quizName}
          savedAttempt={attemptedQuizData?.savedAttempt}
          onViewPreviousCertificate={
            attemptedQuizData?.savedAttempt
              ? () => {
                  const saved = attemptedQuizData.savedAttempt;
                  if (saved) {
                    setSubmissionResult({
                      attemptId: saved.attemptId,
                      studentName: saved.studentName,
                      studentIdentifier: saved.studentIdentifier,
                      className: saved.className || className || '8',
                      section: section || 'A',
                      schoolName: saved.schoolName || schoolName || '',
                      quizName: attemptedQuizData.quizName || 'हिंदी दिवस प्रतियोगिता',
                      score: saved.score ?? 0,
                      totalQuestions: saved.totalQuestions ?? 10,
                      percentage: saved.percentage ?? 0,
                      result: saved.result || 'Pass',
                      submittedAt: saved.submittedAt,
                      certificateId: saved.certificateId,
                      review: saved.review || [],
                    });
                    setShowAlreadyAttemptedModal(false);
                    setPhase('result');
                  }
                }
              : undefined
          }
        />

        {/* MODALS */}
        <InstructionsModal
          isOpen={showInstructionsModal}
          onClose={() => setShowInstructionsModal(false)}
          quiz={currentSubjectQuiz}
          lang={lang}
        />

        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          quiz={currentSubjectQuiz}
          lang={lang}
        />

        <ConfirmSubmitModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmSubmit}
          answeredCount={answeredCount}
          totalQuestions={totalQuestions}
          submitting={submitting}
          lang={lang}
        />
      </div>
    </div>
  );
}