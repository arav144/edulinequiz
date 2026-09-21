'use client';

import React from 'react';
import {
  HelpCircle,
  Clock,
  BookOpen,
  Globe,
  Timer,
  User,
  GraduationCap,
  Building2,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { IQuizSummary, IStudentProfile } from './types';

interface QuizInstructionsViewProps {
  quiz?: IQuizSummary | null;
  studentProfile?: IStudentProfile | null;
  onStartQuiz: () => void;
  onBack: () => void;
  onEditProfile?: () => void;
}

const QuizInstructionsViewComponent: React.FC<QuizInstructionsViewProps> = ({
  quiz,
  studentProfile,
  onStartQuiz,
  onBack,
  onEditProfile,
}) => {
  const numQuestions = quiz?.numberOfQuestions || 15;
  const timePerQ = quiz?.timePerQuestion || 40;
  const totalMinutes = quiz?.durationMinutes || Math.max(1, Math.ceil((numQuestions * timePerQ) / 60));
  
  const classEligibility = (() => {
    const rawList = (quiz?.classes || [])
      .map((c: string) => c.replace(/classes|class/gi, '').trim())
      .filter(Boolean);
    if (rawList.length >= 2) {
      const nums = rawList
        .map((n: string) => parseInt(n, 10))
        .filter((n: number) => !isNaN(n))
        .sort((a: number, b: number) => a - b);
      if (nums.length >= 2) return `Classes ${nums[0]} to ${nums[nums.length - 1]}`;
      return `Classes ${rawList.join(', ')}`;
    }
    if (rawList.length === 1) return `Class ${rawList[0]}`;
    const target = (quiz?.targetClass || '').replace(/classes|class/gi, '').trim();
    return target ? `Class ${target}` : 'Classes 3 to 8';
  })();

  const isHindiQuiz = quiz?.language === 'hi' || /हिंदी|गांधी/i.test(quiz?.name || '');
  const mediumOfQuiz = isHindiQuiz ? 'Hindi (हिंदी)' : 'English';

  return (
    <div className="max-w-3xl mx-auto w-full py-4 sm:py-8 px-3 sm:px-6 animate-fadeIn">
      {/* BACK BUTTON */}
      <div className="mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#194c5f] hover:text-[#2d7995] px-3.5 py-1.5 rounded-xl bg-white border border-[#2d7995]/20 hover:bg-[#2d7995]/5 transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back to Quizzes</span>
        </button>
      </div>

      {/* MAIN INSTRUCTIONS CARD */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 md:p-10 shadow-xl border border-slate-200/90 relative overflow-hidden space-y-6">
        {/* TOP ACCENT DECORATION */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#194c5f] via-[#2d7995] to-[#4ba1c0]" />

        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#2d7995]/10 border border-[#2d7995]/20 text-[#2d7995] flex items-center justify-center mx-auto shadow-xs">
            <HelpCircle className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2d7995]/10 text-[#194c5f] border border-[#2d7995]/25 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#2d7995]" />
            <span>Eduline Publishers Assessment</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Instructions of the quiz
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Please read the competition rules and parameters carefully before starting.
          </p>
        </div>

        {/* INSTRUCTIONS BULLETS */}
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-widest font-black text-[#2d7995]">
            Rules & Format
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Multiple Choice Questions */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start gap-3 hover:border-[#2d7995]/40 hover:bg-white transition duration-200">
              <div className="w-9 h-9 rounded-xl bg-[#2d7995]/10 text-[#2d7995] flex items-center justify-center shrink-0 font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 block">Question Count</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">
                  {numQuestions} Multiple Choice Questions
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Choose the correct option among A, B, C, or D.
                </span>
              </div>
            </div>

            {/* 2. Passing Requirement */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start gap-3 hover:border-[#2d7995]/40 hover:bg-white transition duration-200">
              <div className="w-9 h-9 rounded-xl bg-[#2d7995]/10 text-[#2d7995] flex items-center justify-center shrink-0 font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 block">Passing Criteria</span>
                <span className="text-sm font-black text-[#194c5f] block mt-0.5">
                  50% Passing Mark
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Achieve 50% or above to qualify for certificate of achievement.
                </span>
              </div>
            </div>

            {/* 3. Class Eligibility */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start gap-3 hover:border-[#2d7995]/40 hover:bg-white transition duration-200">
              <div className="w-9 h-9 rounded-xl bg-[#2d7995]/10 text-[#2d7995] flex items-center justify-center shrink-0 font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 block">Eligible Grade Level</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">
                  {classEligibility}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Grade-appropriate syllabus and evaluation criteria.
                </span>
              </div>
            </div>

            {/* 4. Medium of Assessment */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-start gap-3 hover:border-[#2d7995]/40 hover:bg-white transition duration-200">
              <div className="w-9 h-9 rounded-xl bg-[#2d7995]/10 text-[#2d7995] flex items-center justify-center shrink-0 font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 block">Medium of Assessment</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">
                  Language of the quiz – {mediumOfQuiz}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Standardized questions with single-attempt integrity.
                </span>
              </div>
            </div>
          </div>

          {/* 5. Single Attempt Rule */}
          <div className="p-4 rounded-2xl bg-[#2d7995]/5 border border-[#2d7995]/20 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2d7995]/15 text-[#2d7995] flex items-center justify-center shrink-0 font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#194c5f] block">Evaluation Guidelines</span>
              <span className="text-sm sm:text-base font-black text-slate-900 block mt-0.5">
                Official Student Assessment
              </span>
              <span className="text-xs text-slate-600 block mt-0.5 font-medium">
                Each verified student may attempt this quiz only once. Immediate score and verifiable certificate are generated upon submission.
              </span>
            </div>
          </div>
        </div>

        {/* START QUIZ BUTTON (Unified on #2d7995) */}
        <div className="pt-3 text-center space-y-3">
          <button
            type="button"
            onClick={onStartQuiz}
            className="w-full max-w-md mx-auto py-3.5 sm:py-4 px-8 rounded-2xl bg-gradient-to-r from-[#2d7995] via-[#24677f] to-[#194c5f] hover:from-[#266881] hover:to-[#1a4a5b] text-white font-black text-base sm:text-lg tracking-wide shadow-xl shadow-[#2d7995]/25 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer select-none"
          >
            <span>Start quiz</span>
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Clicking &ldquo;Start quiz&rdquo; begins your assessment session.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export const QuizInstructionsView = React.memo(QuizInstructionsViewComponent);
export default QuizInstructionsView;
