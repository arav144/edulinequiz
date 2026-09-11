'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, Trophy, FileText, Timer, ChevronRight, Info, X } from 'lucide-react';
import { IQuizSummary, Language } from './types';
import {
  formatDisplayDate,
  formatOrdinalDate,
  formatDisplayTime,
  formatQuizTimingParts,
  formatQuizTitle,
} from './quizUtils';

interface QuizCardProps {
  quiz: IQuizSummary;
  selectedClassName?: string;
  lang: Language;
  onStartQuiz: (quiz: IQuizSummary) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  selectedClassName,
  lang,
  onStartQuiz,
}) => {
  const isHindi = lang === 'hi';
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute status: Ongoing, Upcoming, Past
  const scheduleStatus = quiz.scheduleStatus || 'Ongoing';

  function resolveBannerUrl(url?: string): string {
    if (!url || typeof url !== 'string' || !url.trim()) {
      return '/img/hindidiwas.png';
    }
    const cleanUrl = url.trim();
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:')) {
      return cleanUrl;
    }
    if (cleanUrl === '/admin/Edulinenew.jpg') {
      return '/img/Edulinenew.jpg';
    }
    return cleanUrl;
  }

  const isOngoing = scheduleStatus === 'Ongoing';
  const isUpcoming = scheduleStatus === 'Upcoming';
  const isPast = scheduleStatus === 'Past';

  // Timing breakdown: e.g. "00:10" and "Hours"
  const timingParts = formatQuizTimingParts(
    quiz.timing,
    quiz.durationMinutes,
    quiz.timePerQuestion,
    quiz.numberOfQuestions
  );

  // Clean title without class name
  const displayTitle = formatQuizTitle(quiz.name, selectedClassName);

  // Formatted date & time
  const startDateOrdinal = formatOrdinalDate(quiz.startDate, '13th Sep, 2026');
  const startDateFormatted = formatDisplayDate(quiz.startDate, '13 Sep, 2026');
  const startTimeFormatted = formatDisplayTime(quiz.startDate, '12:00 PM');
  const totalScore = quiz.totalScore || (quiz.numberOfQuestions ? quiz.numberOfQuestions * 2 : 10);

  // Calculate duration in minutes
  const durationMins = (() => {
    if (quiz.durationMinutes && quiz.durationMinutes > 0) return quiz.durationMinutes;
    if (timingParts.timeVal && timingParts.timeVal.includes(':')) {
      const [hStr, mStr] = timingParts.timeVal.split(':');
      const total = parseInt(hStr, 10) * 60 + parseInt(mStr, 10);
      if (total > 0) return total;
    }
    return 30;
  })();

  return (
    <>
      <div className="w-full max-w-[330px] sm:max-w-[340px] mx-auto bg-[#FFFDF9] rounded-2xl sm:rounded-3xl border border-[#F2E7D5] shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between relative group hover:-translate-y-0.5">
        {/* TOP BANNER: COMPACT, PROPORTIONAL & UNCLIPPED */}
        <div className="relative w-full h-36 sm:h-40 md:h-44 bg-gradient-to-b from-[#FFFDF9] via-[#FFF9F2] to-[#FFF3E4] p-1.5 sm:p-2 flex items-center justify-center overflow-hidden">
          <img
            src={resolveBannerUrl(quiz.bannerUrl)}
            alt={displayTitle}
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('/img/hindidiwas.png') && !target.src.includes('/img/gandhijayanti.png')) {
                target.src = '/img/hindidiwas.png';
              }
            }}
            className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-103 transition-transform duration-500"
          />

          {/* Floating Status Badge */}
          <div className="absolute top-2.5 right-2.5 z-10">
            {isOngoing && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-ping" />
                {isHindi ? 'जारी है' : 'Ongoing'}
              </span>
            )}
            {isUpcoming && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-sm flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-slate-950" />
                {isHindi ? 'आगामी' : 'Upcoming'}
              </span>
            )}
            {isPast && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-600 text-slate-100 shadow-sm">
                {isHindi ? 'समाप्त' : 'Past'}
              </span>
            )}
          </div>
        </div>

        {/* CARD BODY CONTENT: COMPACT TIGHT SPACING MATCHING REFERENCE IMAGE 2 */}
        <div className="p-3 sm:p-3.5 pt-1.5 space-y-2">
          {/* 1. Start Date & Time Row (Two Rounded Side-by-Side Pill Cards) */}
          <div className="grid grid-cols-2 gap-2">
            {/* Start Date Pill */}
            <div className="bg-[#FFF0ED] border border-[#FCD6D0] rounded-xl p-1.5 sm:p-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#D32F2F] shadow-xs shrink-0">
                <Calendar className="w-3.5 h-3.5 text-[#D32F2F]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 block leading-none">
                  Start Date
                </span>
                <span className="text-[11px] sm:text-xs font-black text-[#D32F2F] block leading-tight mt-0.5 font-sans whitespace-nowrap">
                  {startDateFormatted}
                </span>
              </div>
            </div>

            {/* Time Pill */}
            <div className="bg-[#F0F7FD] border border-[#CFE4FA] rounded-xl p-1.5 sm:p-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#0284C7] shadow-xs shrink-0">
                <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 block leading-none">
                  Time
                </span>
                <span className="text-[11px] sm:text-xs font-black text-[#0284C7] block leading-tight mt-0.5 font-sans whitespace-nowrap">
                  {startTimeFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Total Score Row (Centered Dashed Border Trophy Card) */}
          <div className="border border-dashed border-[#86EFAC] bg-[#F0FDF4]/80 rounded-xl py-1 px-3 flex items-center justify-center gap-1.5 max-w-[200px] mx-auto w-full">
            <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold text-slate-700">Total Score:</span>
            <span className="text-xs sm:text-sm font-black text-[#0369A1] font-mono">
              {totalScore}
            </span>
          </div>

          {/* 3. Questions & Minutes Row (Two Rounded Side-by-Side Pill Cards) */}
          <div className="grid grid-cols-2 gap-2">
            {/* Questions Pill */}
            <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-1.5 sm:p-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-black text-emerald-800 leading-none block font-mono">
                  {quiz.numberOfQuestions || 10}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 block leading-tight mt-0.5">
                  Questions
                </span>
              </div>
            </div>

            {/* Minutes Pill */}
            <div className="bg-[#FEF9EE] border border-[#FEF08A] rounded-xl p-1.5 sm:p-2 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-amber-600 shadow-xs shrink-0">
                <Timer className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-black text-amber-800 leading-none block font-mono">
                  {durationMins}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 block leading-tight mt-0.5">
                  Minutes
                </span>
              </div>
            </div>
          </div>

          {/* 4. Action CTA Button (Sleek Compact Pill Button) */}
          <div className="pt-0.5 flex justify-center">
            {isOngoing ? (
              <button
                type="button"
                onClick={() => onStartQuiz(quiz)}
                className="w-full max-w-[250px] py-2 sm:py-2.5 px-4 rounded-full bg-gradient-to-r from-[#0284C7] via-[#0369A1] to-[#0284C7] hover:from-[#0369A1] hover:to-[#075985] text-white font-black text-xs sm:text-sm shadow-md hover:shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-95 cursor-pointer group/btn"
              >
                <span className="text-cyan-200 text-[10px] hidden sm:inline font-bold">˗ˏˋ</span>
                <span>{isHindi ? 'प्रतियोगिता शुरू करें' : 'Start Quiz'}</span>
                <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center ml-0.5 group-hover/btn:translate-x-0.5 transition-transform">
                  <ChevronRight className="w-3 h-3 text-white" />
                </span>
                <span className="text-cyan-200 text-[10px] hidden sm:inline font-bold">ˎˊ˗</span>
              </button>
            ) : isUpcoming ? (
              <button
                type="button"
                onClick={() => setShowNoticeModal(true)}
                className="w-full max-w-[250px] py-2 sm:py-2.5 px-4 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-95 cursor-pointer"
                title={`प्रारंभ तिथि: ${startDateOrdinal}`}
              >
                <span>{isHindi ? 'आगामी (Upcoming)' : 'Upcoming Assessment'}</span>
                <Info className="w-3.5 h-3.5 text-white" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full max-w-[250px] py-2 px-4 rounded-full bg-slate-200 text-slate-500 font-bold text-xs cursor-not-allowed text-center"
              >
                {isHindi ? 'प्रतियोगिता समाप्त' : 'Assessment Concluded'}
              </button>
            )}
          </div>

          {/* 5. Publisher Branding Footer */}
          <div className="flex items-center justify-center pt-1 pb-0.5 border-t border-[#F2E7D5]/70">
            <img
              src="/img/eduline_logo.png"
              alt="Eduline Publishers"
              className="h-4 sm:h-4.5 w-auto object-contain opacity-90"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>

      {/* IN-SCREEN RESPONSIVE POPUP MODAL (PORTALED DIRECTLY TO BODY) */}
      {showNoticeModal && mounted && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowNoticeModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl border border-amber-200 max-w-md w-full overflow-hidden p-5 sm:p-6 relative transition-all transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-inner">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 font-hindi">
                    {isHindi ? 'प्रतियोगिता सूचना' : 'Competition Notice'}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">Scheduled Assessment</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNoticeModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Modal Body Message */}
            <div className="py-4 space-y-3">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5 text-center space-y-1 shadow-xs">
                <p className="text-sm font-bold text-amber-950 font-hindi leading-relaxed">
                  यह प्रतियोगिता <span className="text-[#D32F2F] font-black">{startDateFormatted}</span> को प्रारंभ होगी।
                </p>
                <p className="text-xs text-amber-800 font-hindi font-medium">
                  कृपया निर्धारित तिथि एवं समय पर भाग लें!
                </p>
              </div>

              {/* Scheduled Date & Time Details */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-[#FFF0ED] border border-[#FED7D2] rounded-xl p-2.5 text-center">
                  <span className="text-slate-500 text-[10px] block font-bold">प्रारंभ तिथि (Date)</span>
                  <span className="text-[#D32F2F] font-black text-xs sm:text-sm block mt-0.5 font-sans">
                    {startDateFormatted}
                  </span>
                </div>
                <div className="bg-[#F0F7FD] border border-[#D0E7FC] rounded-xl p-2.5 text-center">
                  <span className="text-slate-500 text-[10px] block font-bold">प्रारंभ समय (Time)</span>
                  <span className="text-[#0284C7] font-black text-xs sm:text-sm block mt-0.5 font-sans">
                    {startTimeFormatted}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-200/70">
                <p className="text-[11px] text-slate-600 font-hindi font-medium">
                  प्रतियोगिता शुरू होने पर आप इसी पोर्टल पर &apos;प्रतियोगिता शुरू करें&apos; बटन से भाग ले सकेंगे।
                </p>
              </div>
            </div>

            {/* Footer OK Button */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowNoticeModal(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
              >
                ठीक है (OK)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
