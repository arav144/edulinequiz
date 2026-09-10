'use client';

import React from 'react';
import { Clock, ChevronRight, Send } from 'lucide-react';
import { IQuestionItem, IQuizSummary, getOptionLabel } from './types';

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
}

export const McqExamination: React.FC<McqExaminationProps> = ({
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
      className="rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 lg:p-10 max-w-4xl mx-auto w-full space-y-4 sm:space-y-6 text-slate-900 shadow-2xl border-2 border-amber-300/80 relative overflow-hidden bg-white bg-cover bg-center"
      style={{
        backgroundImage: "url('/img/Hindi 2.png')",
        backgroundSize: 'cover',
      }}
    >
      {/* Top Subtle Header: Timer & Progress Status */}
      <div className="flex items-center justify-between border-b border-amber-300/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-black px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-950 border border-amber-400/80 shadow-xs">
            {t.questionCounter} {currentIndex + 1} / {totalQuestions}
          </span>
        </div>

        {/* Live Countdown Pill */}
        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border transition-all font-mono font-black text-xs shadow-sm ${
            timeLeft <= 5
              ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
              : timeLeft <= 10
              ? 'bg-amber-400 text-slate-950 border-amber-500'
              : 'bg-white text-amber-950 border-amber-300'
          }`}
        >
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>00:{String(timeLeft).padStart(2, '0')}</span>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-extrabold text-slate-700">
            {answeredCount} / {totalQuestions} {t.answered}
          </span>
        </div>
      </div>

      {/* QUESTION CARD (Using Circle-1.png: Golden Splash with Sketched Open Book) */}
      <div className="flex flex-col items-center justify-center pt-2">
        <div
          className="relative w-72 h-72 sm:w-96 sm:h-96 flex flex-col items-center justify-center p-6 sm:p-10 text-center select-none bg-contain bg-center bg-no-repeat drop-shadow-xl transition-transform hover:scale-[1.01]"
          style={{
            backgroundImage: "url('/img/Circle-1.png')",
          }}
        >
          {/* Text Container centered inside the golden circle area */}
          <div className="flex flex-col items-center justify-center max-w-[210px] sm:max-w-[280px] -mt-10 sm:-mt-14 px-2">
            <span className="text-2xl sm:text-4xl font-black text-slate-950 font-hindi mb-1 drop-shadow-xs">
              {currentIndex + 1}.
            </span>
            <h2 className="text-sm sm:text-lg lg:text-xl font-black text-slate-950 font-hindi leading-snug line-clamp-4">
              {currentQ.question}
            </h2>
          </div>
        </div>
      </div>

      {/* Question Media (if any) */}
      {currentQ.imageUrl && (
        <div className="rounded-2xl overflow-hidden border border-amber-200 bg-white max-w-md mx-auto p-1 shadow-sm">
          <img
            src={currentQ.imageUrl}
            alt="Question reference"
            className="w-full max-h-56 object-contain rounded-xl"
          />
        </div>
      )}
      {currentQ.audioUrl && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 max-w-md mx-auto shadow-sm">
          <p className="text-[10px] uppercase font-bold text-amber-800 mb-1.5">🔊 Listen to question audio</p>
          <audio controls className="w-full">
            <source src={currentQ.audioUrl} />
          </audio>
        </div>
      )}

      {/* 4 OPTIONS GRID (Using Circle-2.png: Golden Splash Pebble) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 justify-center items-center my-4 max-w-3xl mx-auto w-full">
        {(['A', 'B', 'C', 'D'] as const).map((key) => {
          const optText = currentQ.options[key];
          const isSelected = answers[currentQ._id] === key;
          const badgeLetter = getOptionLabel(key, isHindiMode);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectAnswer(currentQ._id, key)}
              className={`group relative flex flex-col items-center justify-center p-3 sm:p-4 transition-all duration-200 select-none cursor-pointer text-center w-full aspect-square max-w-[160px] mx-auto bg-contain bg-center bg-no-repeat ${
                isSelected
                  ? 'drop-shadow-2xl ring-4 ring-amber-500 rounded-full font-bold brightness-105'
                  : 'hover:brightness-105 hover:drop-shadow-lg opacity-90 hover:opacity-100'
              }`}
              style={{
                backgroundImage: "url('/img/Circle-2.png')",
              }}
            >
              <span className="text-xs sm:text-sm font-black text-slate-900 mb-0.5">
                ( {badgeLetter} )
              </span>
              <span className="text-xs sm:text-base font-extrabold text-slate-950 font-hindi leading-tight px-2 line-clamp-3">
                {optText}
              </span>
              {isSelected && (
                <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-md ring-2 ring-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Center Bottom Action Button (Using Shape-3.png / Styled Button) */}
      <div className="pt-2 flex flex-col items-center justify-center gap-2.5">
        {currentIndex < totalQuestions - 1 ? (
          <button
            type="button"
            onClick={onNextQuestion}
            className="relative px-12 sm:px-16 py-3.5 sm:py-4 text-slate-950 font-black text-sm sm:text-base shadow-lg shadow-amber-500/30 hover:brightness-110 active:brightness-95 transition-all duration-200 flex items-center gap-2 bg-contain bg-center bg-no-repeat cursor-pointer select-none"
            style={{
              backgroundImage: "url('/img/Shape-3.png')",
              backgroundSize: '100% 100%',
            }}
          >
            <span>{isHindiMode ? 'आगे बढ़ें' : 'Next Question'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onRequestSubmit}
            className="px-10 sm:px-14 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:brightness-110 active:brightness-95 transition-all duration-200 flex items-center gap-2 cursor-pointer select-none"
          >
            <Send className="w-4 h-4" />
            <span>{isHindiMode ? 'जमा करें' : 'Submit Examination'}</span>
          </button>
        )}

        <p className="text-[11px] text-slate-600 font-medium italic">
          {t.lockedWarning}
        </p>
      </div>
    </div>
  );
};
