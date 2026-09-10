'use client';

import React, { useEffect, useState } from 'react';
import { Award, Sparkles, Check, Loader2 } from 'lucide-react';
import { Language } from './types';

interface CertificateLoadingModalProps {
  isOpen: boolean;
  lang: Language;
  studentName?: string;
}

export const CertificateLoadingModal: React.FC<CertificateLoadingModalProps> = ({
  isOpen,
  lang,
  studentName,
}) => {
  const isHindi = lang === 'hi';
  const [progress, setProgress] = useState(15);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setProgress(15);
      setCurrentStep(0);
      return;
    }

    // Step 1: Start immediately
    setProgress(30);
    setCurrentStep(1);

    // Step 2: at 700ms
    const t1 = setTimeout(() => {
      setProgress(68);
      setCurrentStep(2);
    }, 700);

    // Step 3: at 1400ms
    const t2 = setTimeout(() => {
      setProgress(98);
      setCurrentStep(3);
    }, 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 space-y-6 text-slate-800 shadow-2xl border-2 border-amber-300 relative text-center overflow-hidden">
        {/* Subtle Decorative Background Aura */}
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-amber-200/40 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-indigo-200/40 blur-2xl pointer-events-none" />

        {/* Central Animated Badge */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 border-2 border-amber-400 flex items-center justify-center shadow-lg transform transition-transform animate-pulse">
            <Award className="w-10 h-10 text-amber-950 drop-shadow-xs" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 font-hindi tracking-tight">
            {isHindi ? 'प्रमाण-पत्र तैयार किया जा रहा है...' : 'Creating Your Certificate...'}
          </h3>
          <p className="text-xs text-slate-500 font-medium font-hindi leading-relaxed">
            {studentName && (
              <span className="font-bold text-slate-800 block text-sm mb-0.5">
                {studentName}
              </span>
            )}
            {isHindi
              ? 'कृपया प्रतीक्षा करें, आपके उत्तरों का मूल्यांकन कर परिणाम व डिजिटल प्रमाण-पत्र तैयार हो रहा है।'
              : 'Please wait while we evaluate your answers and prepare your digital certificate.'}
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-400 font-mono">
            <span>{isHindi ? 'मूल्यांकन' : 'Evaluation'}</span>
            <span className="text-amber-600 font-extrabold">{progress}%</span>
            <span>{isHindi ? 'प्रमाण-पत्र' : 'Certificate'}</span>
          </div>
        </div>

        {/* Progress Step Checklist */}
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-2 text-left">
          <div className="flex items-center gap-2.5 text-xs">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep >= 1
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 1 ? <Check className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
            </div>
            <span
              className={`font-medium ${
                currentStep >= 1 ? 'text-slate-900 font-bold' : 'text-slate-400'
              }`}
            >
              {isHindi ? 'उत्तरों की सटीक जांच' : 'Evaluating Submitted Answers'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep >= 2
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep > 2 ? <Check className="w-3 h-3" /> : currentStep === 2 ? <Loader2 className="w-3 h-3 animate-spin" /> : '2'}
            </div>
            <span
              className={`font-medium ${
                currentStep >= 2 ? 'text-slate-900 font-bold' : 'text-slate-400'
              }`}
            >
              {isHindi ? 'अंक एवं परिणाम की गणना' : 'Calculating Score & Percentage'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep >= 3
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentStep === 3 ? <Loader2 className="w-3 h-3 animate-spin" /> : '3'}
            </div>
            <span
              className={`font-medium ${
                currentStep >= 3 ? 'text-slate-900 font-bold' : 'text-slate-400'
              }`}
            >
              {isHindi ? 'डिजिटल प्रमाण-पत्र का निर्माण' : 'Generating Digital Certificate'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
