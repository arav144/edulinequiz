'use client';

import React, { useState } from 'react';
import { BookMarked, CheckCircle2, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { IReviewItem, Language, TRANSLATIONS, getOptionLabel } from './types';

interface QuestionReviewProps {
  review: IReviewItem[];
  lang: Language;
}

export const QuestionReview: React.FC<QuestionReviewProps> = ({ review, lang }) => {
  const t = TRANSLATIONS[lang];
  const isHindiMode = lang === 'hi';
  const [filter, setFilter] = useState<'all' | 'correct' | 'wrong' | 'unanswered'>('all');

  if (!review || review.length === 0) return null;

  const correctCount = review.filter((item) => item.isCorrect).length;
  const unansweredCount = review.filter(
    (item) => !item.studentChoice || item.studentChoice === 'Unanswered'
  ).length;
  const wrongCount = review.length - correctCount - unansweredCount;

  const filteredReview = review.filter((item) => {
    const isUnanswered = !item.studentChoice || item.studentChoice === 'Unanswered';
    if (filter === 'correct') return item.isCorrect;
    if (filter === 'wrong') return !item.isCorrect && !isUnanswered;
    if (filter === 'unanswered') return isUnanswered;
    return true;
  });

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-8 space-y-6 text-slate-800 shadow-2xl border border-amber-200/70">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2 font-hindi">
            <BookMarked className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <span>
              {isHindiMode ? 'प्रश्नोत्तरी समीक्षा (कौन-से सही, कौन-से गलत)' : t.qReviewTitle}
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5 font-hindi">
            {isHindiMode
              ? 'यहाँ देखें आपने किन प्रश्नों के सही उत्तर दिए, कौन-से गलत हुए और कौन-से छूट गए।'
              : 'Detailed breakdown of your answered, correct, and incorrect questions.'}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isHindiMode ? `सभी (${review.length})` : `All (${review.length})`}
          </button>
          <button
            type="button"
            onClick={() => setFilter('correct')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              filter === 'correct'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isHindiMode ? `सही (${correctCount})` : `Correct (${correctCount})`}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('wrong')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              filter === 'wrong'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{isHindiMode ? `गलत (${wrongCount})` : `Wrong (${wrongCount})`}</span>
          </button>
          {unansweredCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('unanswered')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                filter === 'unanswered'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{isHindiMode ? `छूट गए (${unansweredCount})` : `Skipped (${unansweredCount})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Score Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {isHindiMode ? 'कुल प्रश्न' : 'Total Questions'}
          </span>
          <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
            {review.length}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isHindiMode ? 'सही उत्तर' : 'Correct'}
          </span>
          <span className="text-xl font-black text-emerald-800 font-mono mt-0.5 block">
            {correctCount}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            {isHindiMode ? 'गलत उत्तर' : 'Wrong'}
          </span>
          <span className="text-xl font-black text-rose-800 font-mono mt-0.5 block">
            {wrongCount}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {isHindiMode ? 'छूट गए (अनुत्तरित)' : 'Unanswered'}
          </span>
          <span className="text-xl font-black text-amber-800 font-mono mt-0.5 block">
            {unansweredCount}
          </span>
        </div>
      </div>

      {/* Question Cards List */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
        {filteredReview.map((item, idx) => {
          const isUnanswered = !item.studentChoice || item.studentChoice === 'Unanswered';
          const originalIdx = review.indexOf(item);

          return (
            <div
              key={item.questionId || idx}
              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                item.isCorrect
                  ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                  : isUnanswered
                  ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                  : 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2.5 flex-1">
                  <span
                    className={`w-7 h-7 rounded-xl font-mono text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.isCorrect
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isUnanswered
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-rose-600 text-white shadow-xs'
                    }`}
                  >
                    {originalIdx + 1}
                  </span>
                  <p className="font-bold text-xs sm:text-sm text-slate-900 leading-snug font-hindi">
                    {item.question}
                  </p>
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                  {item.isCorrect ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isHindiMode ? 'सही उत्तर' : 'Correct'}</span>
                    </span>
                  ) : isUnanswered ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{isHindiMode ? 'छूट गया' : 'Unanswered'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{isHindiMode ? 'गलत उत्तर' : 'Incorrect'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Options Grid (if available) */}
              {item.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3 pl-0 sm:pl-9">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => {
                    const optText = item.options[key];
                    if (!optText) return null;
                    const isStudentPick = item.studentChoice === key;
                    const isCorrectAnswer = item.correctAnswer === key;

                    let optCardClass = 'bg-white border-slate-200 text-slate-700';
                    if (isCorrectAnswer) {
                      optCardClass = 'bg-emerald-100/70 border-emerald-400 text-emerald-950 font-bold';
                    } else if (isStudentPick && !item.isCorrect) {
                      optCardClass = 'bg-rose-100/70 border-rose-400 text-rose-950 font-bold';
                    }

                    return (
                      <div
                        key={key}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${optCardClass}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-lg bg-slate-200/80 font-mono text-[11px] font-black flex items-center justify-center text-slate-800 flex-shrink-0">
                            {getOptionLabel(key, isHindiMode)}
                          </span>
                          <span className="font-hindi">{optText}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isCorrectAnswer && (
                            <span className="text-[10px] font-black text-emerald-700 uppercase bg-emerald-200/60 px-2 py-0.5 rounded-md">
                              {isHindiMode ? 'सही' : 'Correct'}
                            </span>
                          )}
                          {isStudentPick && !isCorrectAnswer && (
                            <span className="text-[10px] font-black text-rose-700 uppercase bg-rose-200/60 px-2 py-0.5 rounded-md">
                              {isHindiMode ? 'आपका चुनाव' : 'Your Choice'}
                            </span>
                          )}
                          {isStudentPick && isCorrectAnswer && (
                            <span className="text-[10px] font-black text-emerald-800 uppercase bg-emerald-200 px-2 py-0.5 rounded-md">
                              {isHindiMode ? 'आपका चुनाव (सही)' : 'Your Choice'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Comparison row (Your Choice vs Correct Key) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pl-0 sm:pl-9 pt-1 border-t border-slate-200/60 mt-2">
                <div className="text-slate-600 flex items-center gap-1.5">
                  <span className="font-bold">{t.yourChoice}</span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                      item.isCorrect
                        ? 'bg-emerald-100 text-emerald-800'
                        : isUnanswered
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {!isUnanswered
                      ? `${getOptionLabel(item.studentChoice, isHindiMode)}${
                          item.options && (item.options as any)[item.studentChoice]
                            ? `: ${(item.options as any)[item.studentChoice]}`
                            : ''
                        }`
                      : t.unanswered}
                  </span>
                </div>

                <div className="text-slate-600 flex items-center gap-1.5">
                  <span className="font-bold">{t.correctKey}</span>
                  <span className="font-black px-2 py-0.5 rounded-md text-[11px] bg-emerald-100 text-emerald-900">
                    {getOptionLabel(item.correctAnswer, isHindiMode)}
                    {item.options && (item.options as any)[item.correctAnswer]
                      ? `: ${(item.options as any)[item.correctAnswer]}`
                      : ''}
                  </span>
                </div>
              </div>

              {/* Explanation (if any) */}
              {item.explanation && (
                <div className="mt-2.5 text-[11px] text-slate-600 pl-0 sm:pl-9">
                  <div className="p-2 rounded-xl bg-white/70 border border-slate-200/80 italic font-hindi">
                    💡 <strong>{isHindiMode ? 'व्याख्या:' : 'Explanation:'}</strong> {item.explanation}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
