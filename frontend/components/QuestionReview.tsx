'use client';

import React from 'react';
import { BookMarked } from 'lucide-react';
import { IReviewItem, Language, TRANSLATIONS, getOptionLabel } from './types';

interface QuestionReviewProps {
  review: IReviewItem[];
  lang: Language;
}

export const QuestionReview: React.FC<QuestionReviewProps> = ({ review, lang }) => {
  const t = TRANSLATIONS[lang];
  const isHindiMode = lang === 'hi';

  if (!review || review.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 space-y-4 text-slate-800 shadow-2xl border border-slate-200">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
        <BookMarked className="w-4 h-4 text-indigo-600" />
        <span>{t.qReviewTitle}</span>
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {review.map((item, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border ${
              item.isCorrect
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-rose-50/50 border-rose-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="font-mono text-xs font-bold text-indigo-600">Q{idx + 1}.</span>
              <p className="font-semibold text-xs text-slate-800 flex-1">{item.question}</p>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                  item.isCorrect
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {item.isCorrect ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pl-6 mt-1">
              <div className="text-slate-600">
                {t.yourChoice}{' '}
                <strong className="font-bold text-slate-900">
                  {item.studentChoice && item.studentChoice !== 'Unanswered'
                    ? getOptionLabel(item.studentChoice, isHindiMode)
                    : t.unanswered}
                </strong>
              </div>
              <div className="text-slate-600">
                {t.correctKey}{' '}
                <strong className="font-bold text-slate-900">
                  {getOptionLabel(item.correctAnswer, isHindiMode)}
                </strong>
              </div>
            </div>
            {item.explanation && (
              <div className="mt-2 text-[11px] text-slate-500 pl-6 border-l-2 border-slate-300 italic">
                {item.explanation}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
