'use client';

import React from 'react';
import { AlertCircle, Award, CheckCircle2, X } from 'lucide-react';
import { Language } from './types';
import { ISavedAttempt } from './attemptTracker';

interface AlreadyAttemptedModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  savedAttempt?: ISavedAttempt | null;
  quizName?: string;
  onViewPreviousCertificate?: () => void;
}

export const AlreadyAttemptedModal: React.FC<AlreadyAttemptedModalProps> = ({
  isOpen,
  onClose,
  lang,
  savedAttempt,
  quizName,
  onViewPreviousCertificate,
}) => {
  const isHindi = lang === 'hi';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-7 space-y-5 text-slate-800 shadow-2xl border border-amber-200 relative text-center">
        {/* Close X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-600 flex items-center justify-center shadow-inner">
          <Award className="w-8 h-8" />
        </div>

        {/* Title & Message */}
        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 font-hindi">
            {isHindi ? 'आप यह क्विज़ पहले ही दे चुके हैं!' : 'Quiz Already Completed!'}
          </h3>
          <p className="text-xs text-slate-600 font-medium font-hindi leading-relaxed">
            {isHindi
              ? `आपने "${quizName || 'हिंदी दिवस प्रतियोगिता'}" को पहले ही सफलतापूर्वक पूरा कर लिया है। प्रति छात्र केवल एक ही प्रयास (attempt) मान्य है।`
              : `You have already completed "${quizName || 'Competition'}". Only 1 attempt is allowed per student.`}
          </p>
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-[11px] text-emerald-800 font-bold font-hindi">
            ✨ {isHindi ? 'जब नया क्विज़ जारी किया जाएगा, तब आप दोबारा भाग ले सकेंगे।' : 'You will be able to attempt again when a new quiz is published.'}
          </div>
        </div>

        {/* Previous Attempt Summary Card (if available) */}
        {savedAttempt && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-500 font-semibold text-[11px]">
              <span>{isHindi ? 'छात्र का नाम:' : 'Student Name:'}</span>
              <strong className="text-slate-900 font-bold">{savedAttempt.studentName}</strong>
            </div>
            {savedAttempt.score !== undefined && savedAttempt.totalQuestions && (
              <div className="flex justify-between items-center text-slate-500 font-semibold text-[11px]">
                <span>{isHindi ? 'प्राप्तांक (Score):' : 'Score:'}</span>
                <strong className="text-indigo-600 font-black font-mono">
                  {savedAttempt.score} / {savedAttempt.totalQuestions} ({savedAttempt.percentage}%)
                </strong>
              </div>
            )}
            {savedAttempt.result && (
              <div className="flex justify-between items-center text-slate-500 font-semibold text-[11px]">
                <span>{isHindi ? 'परिणाम (Result):' : 'Result:'}</span>
                <strong
                  className={`font-black ${
                    savedAttempt.result === 'Pass' ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {savedAttempt.result === 'Pass' ? (isHindi ? 'उत्तीर्ण (Pass)' : 'Pass') : (isHindi ? 'अनुत्तीर्ण (Fail)' : 'Fail')}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {onViewPreviousCertificate && (
            <button
              type="button"
              onClick={onViewPreviousCertificate}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isHindi ? 'अपना प्रमाण-पत्र देखें 📜' : 'View Your Certificate'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer select-none"
          >
            {isHindi ? 'ठीक है (OK)' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );
};
