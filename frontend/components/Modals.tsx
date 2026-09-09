'use client';

import React from 'react';
import { FileText, HelpCircle, Phone, AlertCircle, X } from 'lucide-react';
import { IQuizSummary, Language, TRANSLATIONS } from './types';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz?: IQuizSummary | null;
  lang: Language;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, quiz, lang }) => {
  const t = TRANSLATIONS[lang];
  const isHindiMode = lang === 'hi';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 space-y-4 text-slate-800 shadow-2xl border border-slate-100 relative">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{t.navAbout}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-slate-600">
          <h4 className="font-bold text-sm text-slate-900">
            {quiz?.name || (isHindiMode ? 'हिंदी दिवस विशेष प्रश्नोत्तरी' : 'Assessment Examination')}
          </h4>
          <p className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-700 font-medium">
            {quiz?.description ||
              (isHindiMode
                ? 'इस प्रश्नोत्तरी में हिंदी के राजभाषा बनने के इतिहास, हिंदी साहित्य तथा हिंदी व्याकरण से जुड़े रोचक और ज्ञानवर्धक प्रश्न शामिल हैं।'
                : 'This assessment evaluates comprehensive knowledge, analytical understanding, and subject proficiency.')}
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-indigo-500 block">Total Questions</span>
              <span className="text-base font-black text-slate-900 font-mono">
                {quiz?.numberOfQuestions || 10} Questions
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-[10px] uppercase font-bold text-emerald-500 block">Passing Mark</span>
              <span className="text-base font-black text-slate-900 font-mono">
                {quiz?.passingPercentage || 50}%
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            {t.modalClose}
          </button>
        </div>
      </div>
    </div>
  );
};

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz?: IQuizSummary | null;
  lang: Language;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose,
  quiz,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const isHindiMode = lang === 'hi';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 space-y-4 text-slate-800 shadow-2xl border border-slate-100 relative">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{t.navInstructions}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed max-h-80 overflow-y-auto pr-1">
          <ul className="space-y-2">
            {(quiz?.instructions
              ? quiz.instructions.split('\n').filter(Boolean)
              : isHindiMode
              ? [
                  'प्रत्येक प्रश्न को ध्यानपूर्वक पढ़ें और दिए गए विकल्पों में से सही उत्तर चुनें।',
                  'सभी प्रश्नों के उत्तर देना अनिवार्य है।',
                  'प्रत्येक प्रश्न के लिए निर्धारित समय (30 सेकंड) है, जिसके बाद अगला प्रश्न स्वतः आ जाएगा।',
                  'एक बार आगे बढ़ने के बाद पिछले प्रश्न पर वापस नहीं जाया जा सकता।',
                  'सभी प्रश्न पूरे करने के बाद ‘जमा करें’ बटन पर क्लिक करें।',
                  'क्विज़ पूरा होने के बाद अपना स्कोर/परिणाम एवं प्रमाणपत्र प्राप्त करें।',
                ]
              : [
                  'Read each question carefully and choose the correct option from A, B, C, or D.',
                  'Answering all questions is mandatory.',
                  'Each question has a countdown timer, after which the next question will automatically appear.',
                  'Once you move forward, you cannot go back to previous questions.',
                  'Click the "Submit" button after completing all questions.',
                  'View and download your score card and certificate after completion.',
                ]
            ).map((rule, i) => (
              <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="font-medium text-slate-700">{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
          >
            {t.modalClose}
          </button>
        </div>
      </div>
    </div>
  );
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
            onClick={onConfirm}
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
