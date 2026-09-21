'use client';

import React from 'react';
import { Clock, Send } from 'lucide-react';
import { IQuestionItem, IQuizSummary } from './types';
import { IThemeSettings } from '@/services/api';

interface McqExaminationProps {
  t: any;
  isHindiMode: boolean;
  currentQ: IQuestionItem;
  currentIndex: number;
  totalQuestions: number;
  selectedQuiz: IQuizSummary | null;
  timeLeft: number;
  answeredCount: number;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  onSelectAnswer: (questionId: string, key: 'A' | 'B' | 'C' | 'D') => void;
  onNextQuestion: () => void;
  onRequestSubmit: () => void;
  theme?: IThemeSettings;
}

const McqExaminationComponent: React.FC<McqExaminationProps> = ({
  t,
  isHindiMode,
  currentQ,
  currentIndex,
  totalQuestions,
  selectedQuiz,
  timeLeft,
  answeredCount,
  answers,
  onSelectAnswer,
  onNextQuestion,
  onRequestSubmit,
}) => {
  return (
    <div
      className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 md:p-8 max-w-xl sm:max-w-2xl mx-auto w-full text-slate-900 shadow-2xl border border-white/60 relative overflow-hidden select-none space-y-3.5 sm:space-y-5 will-change-transform transform-gpu"
      style={{
        backgroundImage: "url('/img/polygon_bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#FAF9F5',
      }}
    >
      {/* ─── TOP HEADER: Clean, Single-Line Responsive Bar ─── */}
      <div className="flex items-center justify-between border-b border-[#1e3a5f]/15 pb-2.5 sm:pb-3 gap-1.5 sm:gap-2">
        {/* Question Counter */}
        <span className="text-[11px] sm:text-xs font-mono font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white/90 text-[#1e3a5f] border border-[#1e3a5f]/20 shadow-2xs backdrop-blur-xs whitespace-nowrap">
          <span className="sm:hidden">Q. {currentIndex + 1}/{totalQuestions}</span>
          <span className="hidden sm:inline">{t.questionCounter || 'Question'} {currentIndex + 1} / {totalQuestions}</span>
        </span>

        {/* Live Countdown Pill */}
        <div
          className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border transition-all font-mono font-black text-[11px] sm:text-xs shadow-2xs backdrop-blur-xs whitespace-nowrap ${
            timeLeft <= 5
              ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
              : timeLeft <= 10
              ? 'bg-amber-400 text-slate-950 border-amber-500'
              : 'bg-white/90 text-[#1e3a5f] border-[#1e3a5f]/25'
          }`}
        >
          <Clock className="w-3.5 h-3.5 flex-shrink-0 text-[#1e3a5f]" />
          <span>00:{String(timeLeft).padStart(2, '0')}</span>
        </div>

        {/* Answered Status */}
        <span className="text-[11px] sm:text-xs font-mono font-semibold text-[#1e3a5f] bg-white/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-[#1e3a5f]/20 shadow-2xs backdrop-blur-xs whitespace-nowrap">
          <span className="sm:hidden">{answeredCount}/{totalQuestions} done</span>
          <span className="hidden sm:inline">{answeredCount} / {totalQuestions} {t.answered || 'Done'}</span>
        </span>
      </div>

      {/* ─── QUESTION CARD (Compact, Proportional, Speech-Card Design) ─── */}
      <div className="flex flex-col items-center justify-center pt-1 sm:pt-2">
        <div className="relative w-full max-w-md sm:max-w-lg mx-auto">
          {/* Card Box with 3D Offset Shadow & Dashed Border */}
          <div
            className="w-full bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-7 text-center relative border-[1.5px] sm:border-2 border-dashed border-[#1e3a5f]/80"
            style={{
              boxShadow: '-6px 6px 0px rgba(30, 58, 95, 0.35), 0 6px 16px -4px rgba(30, 58, 95, 0.12)',
            }}
          >
            {/* Top-Right Stylized Question Mark "?" Icon */}
            <div className="absolute -top-5 -right-2 sm:-top-7 sm:-right-3 select-none pointer-events-none filter drop-shadow-sm">
              <svg
                viewBox="0 0 60 75"
                className="w-9 h-12 sm:w-11 sm:h-14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 20C16 10 25 4 35 4C47 4 54 11 54 21C54 29 47 34 39 39C34 42 32 46 32 52"
                  stroke="#1e3a5f"
                  strokeWidth="9"
                  strokeLinecap="round"
                />
                <circle cx="32" cy="65" r="5" fill="#1e3a5f" />
              </svg>
            </div>

            {/* Question Index Number */}
            <div className="text-xl sm:text-2xl font-black text-[#1e3a5f] font-sans tracking-tight mb-1 sm:mb-1.5">
              {currentIndex + 1}.
            </div>

            {/* Question Text */}
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-[#1e3a5f] font-serif leading-relaxed px-1 sm:px-3">
              {currentQ.question}
            </h2>
          </div>
        </div>
      </div>

      {/* Question Media (if any) */}
      {currentQ.imageUrl && (
        <div className="rounded-xl overflow-hidden border border-amber-200 bg-white max-w-sm mx-auto p-1 shadow-xs">
          <img
            src={currentQ.imageUrl}
            alt="Question reference"
            className="w-full max-h-44 object-contain rounded-lg"
          />
        </div>
      )}
      {currentQ.audioUrl && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 max-w-sm mx-auto shadow-xs">
          <p className="text-[10px] uppercase font-bold text-amber-800 mb-1">🔊 Listen to question audio</p>
          <audio controls className="w-full">
            <source src={currentQ.audioUrl} />
          </audio>
        </div>
      )}

      {/* ─── 4 OPTIONS (Clean Compact Capsule Pills with Dashed Outline) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3.5 max-w-md sm:max-w-lg mx-auto w-full my-2 sm:my-3.5">
        {(['A', 'B', 'C', 'D'] as const).map((key) => {
          const optText = currentQ.options[key];
          const isSelected = answers[currentQ._id] === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectAnswer(currentQ._id, key)}
              className={`group relative flex items-center gap-2 sm:gap-2.5 py-1.5 sm:py-2 px-1.5 sm:px-2 pr-3 sm:pr-4 rounded-full border-[1.5px] border-dashed transition-all duration-150 select-none cursor-pointer text-left w-full min-h-[44px] sm:min-h-[48px] ${
                isSelected
                  ? 'bg-amber-50/95 border-[#1e3a5f] ring-2 ring-[#1e3a5f]/30 shadow-md -translate-y-0.5'
                  : 'bg-white/95 border-[#1e3a5f]/60 hover:border-[#1e3a5f] hover:bg-white hover:-translate-y-0.5 shadow-xs'
              }`}
            >
              {/* Left Solid Navy Circular Badge */}
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm font-sans shrink-0 border border-white/90 transition-all shadow-2xs ${
                  isSelected
                    ? 'bg-[#1e3a5f] text-amber-300 ring-2 ring-amber-400'
                    : 'bg-[#1e3a5f] text-white group-hover:scale-105'
                }`}
              >
                {key.toLowerCase()}.
              </div>

              {/* Option Text */}
              <span className="flex-1 text-xs sm:text-sm font-bold font-serif leading-snug text-[#1e3a5f] pl-1 text-left">
                {optText}
              </span>

              {/* Selection Indicator Checkmark */}
              {isSelected && (
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center shrink-0 shadow-2xs text-[10px] sm:text-xs font-black ml-1">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── NEXT / SUBMIT BUTTON ─── */}
      <div className="pt-1 sm:pt-2 flex flex-col items-center justify-center gap-1.5">
        {currentIndex < totalQuestions - 1 ? (
          <button
            type="button"
            onClick={onNextQuestion}
            className="px-10 sm:px-14 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg active:translate-y-0.5 transition-all duration-150 cursor-pointer select-none"
            style={{
              boxShadow: '0 4px 0 #0f2331, 0 8px 16px rgba(15, 35, 49, 0.25)',
            }}
          >
            NEXT
          </button>
        ) : (
          <button
            type="button"
            onClick={onRequestSubmit}
            className="px-10 sm:px-14 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-md hover:shadow-lg active:translate-y-0.5 transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none"
            style={{
              boxShadow: '0 4px 0 #064e3b, 0 8px 16px rgba(6, 78, 59, 0.25)',
            }}
          >
            <Send className="w-3.5 h-3.5" />
            <span>SUBMIT</span>
          </button>
        )}

        <p className="text-[11px] sm:text-xs text-slate-700 font-medium italic mt-0.5 text-center">
          {t.lockedWarning || 'Locked once advanced (No back option)'}
        </p>
      </div>
    </div>
  );
};

export const McqExamination = React.memo(McqExaminationComponent);
export default McqExamination;


