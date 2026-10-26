'use client';

import React from 'react';
import { FileText, HelpCircle, Phone, AlertCircle, X } from 'lucide-react';
import { IQuizSummary, Language, TRANSLATIONS } from './types';
import { formatQuizTitle } from './quizUtils';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz?: IQuizSummary | null;
  classNameVal?: string;
  lang: Language;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose,
  quiz,
  classNameVal,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const isHindiMode = lang === 'hi';

  if (!isOpen) return null;

  const displayQuizName = formatQuizTitle(
    quiz?.name || (isHindiMode ? 'हिंदी दिवस विशेष प्रतियोगिता' : 'Hindi Diwas Special Quiz'),
    classNameVal
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="max-w-xl w-full bg-white rounded-3xl p-5 sm:p-7 space-y-4 text-slate-800 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {t.navInstructions}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isHindiMode ? 'प्रतियोगिता का विवरण एवं आवश्यक नियम' : 'Competition details & guidelines'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed overflow-y-auto pr-1 flex-1">
          {/* Section 1: Overview / About */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2.5">
            <h4 className="font-bold text-sm text-slate-900">
              {displayQuizName}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {(() => {
                let rawDesc = (quiz?.description || '')
                  .replace(/कक्षा\s*\d+\s*के\s*(विद्यार्थियों|छात्रों)\s*के\s*लिए\s*/gi, 'विद्यार्थियों के लिए ')
                  .replace(/कक्षा\s*\d+\s*/gi, '')
                  .replace(/Class\s*\d+\s*/gi, '')
                  .trim();
                if (rawDesc.includes('वर्णमाला, बुनियादी शब्द ज्ञान') || !rawDesc) {
                  rawDesc = isHindiMode
                    ? 'विद्यार्थियों के लिए हिंदी व्याकरण, भाषा ज्ञान, मुहावरे, साहित्य और सामान्य ज्ञान पर आधारित रोचक प्रतियोगिता।'
                    : 'This assessment evaluates comprehensive knowledge, analytical understanding, and subject proficiency.';
                }
                return rawDesc;
              })()}
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100/80 text-center sm:text-left">
                <span className="text-[10px] uppercase font-bold text-indigo-600 block">
                  {isHindiMode ? 'कुल प्रश्न' : 'Questions'}
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                  {quiz?.numberOfQuestions || 10}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100/80 text-center sm:text-left">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                  {isHindiMode ? 'उत्तीर्ण अंक' : 'Passing Mark'}
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                  {quiz?.passingPercentage || 50}%
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Instructions & Rules */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              {isHindiMode ? 'महत्वपूर्ण नियम व निर्देश' : 'Important Rules & Instructions'}
            </h4>
            <ul className="space-y-2">
              {(quiz?.instructions
                ? quiz.instructions
                    .replace(/कक्षा\s*\d+\s*के\s*(विद्यार्थियों|छात्रों)\s*के\s*लिए\s*/gi, 'विद्यार्थियों के लिए ')
                    .replace(/कक्षा\s*\d+\s*/gi, '')
                    .replace(/Class\s*\d+\s*/gi, '')
                    .replace(/हिंदी दिवस क्विज़/g, 'हिंदी दिवस प्रतियोगिता')
                    .replace(/क्विज़/g, 'प्रतियोगिता')
                    .replace(/You have \d+\s*(seconds|sec|s)\s*per question\.?/gi, '')
                    .replace(/Each question has a countdown timer[^.]*\.?/gi, '')
                    .replace(/Each question has a time limit[^.]*\.?/gi, '')
                    .replace(/प्रत्येक प्रश्न के लिए निर्धारित समय[^.]*\.?/gi, '')
                    .replace(/\(\s*\d+\s*(सेकंड|seconds|sec|s)\s*\)/gi, '')
                    .replace(/\d+\s*(seconds|sec|s)\s*per question\.?/gi, '')
                    .split('\n')
                    .map((s: string) => s.trim())
                    .filter((s: string) => s && !s.includes('वर्णमाला, बुनियादी शब्द ज्ञान'))
                : isHindiMode
                ? [
                    'प्रत्येक प्रश्न को ध्यानपूर्वक पढ़ें और दिए गए विकल्पों में से सही उत्तर चुनें।',
                    'सभी प्रश्नों के उत्तर देना अनिवार्य है।',
                    'एक बार आगे बढ़ने के बाद पिछले प्रश्न पर वापस नहीं जाया जा सकता।',
                    'सभी प्रश्न पूरे करने के बाद ‘जमा करें’ बटन पर क्लिक करें।',
                    'प्रतियोगिता पूरी होने के बाद अपना स्कोर/परिणाम एवं प्रमाणपत्र प्राप्त करें।',
                  ]
                : [
                    'Read each question carefully and choose the correct option from A, B, C, or D.',
                    'Answering all questions is mandatory.',
                    'Once you move forward, you cannot go back to previous questions.',
                    'Click the "Submit" button after completing all questions.',
                    'View and download your score card and certificate after completion.',
                  ]
              ).map((rule, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="font-medium text-slate-700 text-xs leading-relaxed">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-xs"
          >
            {t.modalClose}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AboutModal: React.FC<InstructionsModalProps> = (props) => {
  return <InstructionsModal {...props} />;
};

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz?: IQuizSummary | null;
  lang: Language;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  quiz,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 space-y-5 text-slate-800 shadow-2xl border border-slate-100 relative">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{t.navContact}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <Phone className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">
              {lang === 'hi' ? 'सहायता एवं हेल्पलाइन' : 'Student Support & Helpline'}
            </h4>
            <p className="text-xs text-slate-500">
              {lang === 'hi' ? 'किसी भी तकनीकी समस्या या प्रश्न के लिए संपर्क करें:' : 'For any academic or technical queries, contact us:'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Contact Number
            </span>
            <a
              href={`tel:${quiz?.contactInfo || '+91 92174 78822'}`}
              className="text-lg font-black text-indigo-600 hover:text-indigo-700 font-mono block"
            >
              {quiz?.contactInfo || '+91 92174 78822'}
            </a>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            {t.modalClose}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ConfirmSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  answeredCount: number;
  totalQuestions: number;
  submitting: boolean;
  lang: Language;
}

export const ConfirmSubmitModal: React.FC<ConfirmSubmitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  answeredCount,
  totalQuestions,
  submitting,
  lang,
}) => {
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 space-y-4 text-slate-800 shadow-2xl border border-slate-100">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t.confirmSubmitTitle}</h3>
          <p className="text-xs text-slate-600">
            You have answered <strong>{answeredCount} of {totalQuestions}</strong> questions.
            {answeredCount < totalQuestions && (
              <span className="text-rose-600 block mt-1 font-bold">
                Warning: {totalQuestions - answeredCount} questions remain unanswered!
              </span>
            )}
          </p>
          <p className="text-[11px] text-slate-400">{t.confirmSubmitDesc}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            {t.goBackReview}
          </button>
          <button
            type="button"
            onClick={() => onConfirm()}
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <span>{submitting ? 'Evaluating...' : t.confirmSubmitAction}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
