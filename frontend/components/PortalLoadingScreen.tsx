'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, GraduationCap } from 'lucide-react';
import { Language } from './types';

interface PortalLoadingScreenProps {
  lang: Language;
  onFinish?: () => void;
}

export const PortalLoadingScreen: React.FC<PortalLoadingScreenProps> = ({
  lang,
  onFinish,
}) => {
  const isHindi = lang === 'hi';
  const [visible, setVisible] = useState<boolean>(true);
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(3);

  useEffect(() => {
    // 3-second progress timer (updates every 30ms for 100 ticks)
    const startTime = Date.now();
    const duration = 3000; // 3 full seconds

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      const remSeconds = Math.max(1, Math.ceil((duration - elapsed) / 1000));
      setCountdown(remSeconds);

      if (elapsed >= duration) {
        clearInterval(progressInterval);
        setProgress(100);
        // Start smooth fade-out
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          if (onFinish) onFinish();
        }, 500); // 500ms fade transition
      }
    }, 30);

    return () => clearInterval(progressInterval);
  }, [onFinish]);

  const handleSkip = () => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100000] flex items-center justify-center p-4 select-none transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } bg-gradient-to-b from-[#FFFDF9] via-[#FAF5EC] to-[#F3E8D8]`}
      style={{
        backgroundImage: "radial-gradient(circle at 50% 30%, rgba(2, 132, 199, 0.08) 0%, rgba(254, 243, 199, 0.25) 50%, rgba(245, 235, 220, 0.6) 100%)",
      }}
    >
      {/* Decorative Aura / Blurs in background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl pointer-events-none" />

      {/* Skip Button in Top Right */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 text-xs font-bold shadow-xs border border-slate-200/80 transition-all cursor-pointer z-10"
      >
        {isHindi ? 'छोड़ें (Skip) ✕' : 'Skip ✕'}
      </button>

      {/* Main Central Card */}
      <div className="relative max-w-sm w-full mx-auto flex flex-col items-center text-center space-y-6 animate-fadeIn">
        {/* Eduline Brand Logo with Pulsing Halo */}
        <div className="relative">
          {/* Animated pulsing rings */}
          <div className="absolute -inset-2.5 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-teal-400/20 to-amber-400/20 blur-md animate-pulse" />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/90 bg-white flex items-center justify-center">
            <img
              src="/img/Edulinenew.jpg"
              alt="Eduline Publishers"
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                // Fallback to horizontal logo if jpg fails
                e.currentTarget.src = '/img/eduline_logo.png';
                e.currentTarget.className = 'w-4/5 h-auto object-contain';
              }}
            />
          </div>

          {/* Sparkle badge in corner */}
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md border-2 border-white">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Brand Titles */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-[11px] font-black uppercase tracking-wider font-sans">
            <GraduationCap className="w-3.5 h-3.5 text-teal-700" />
            <span>Eduline Publishers</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-hindi pt-1">
            {isHindi ? 'ऑनलाइन क्विज़ एवं प्रतियोगिता पोर्टल' : 'Online Quiz & Assessment Portal'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 font-medium font-hindi max-w-xs mx-auto">
            {isHindi
              ? 'ज्ञान, भाषा और शैक्षणिक उत्कृष्टता का डिजिटल मंच'
              : 'Empowering knowledge, language & academic excellence'}
          </p>
        </div>

        {/* 3-Second Animated Progress Bar */}
        <div className="w-full max-w-xs space-y-2 pt-2">
          <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-teal-500 via-cyan-500 to-amber-500 rounded-full transition-all duration-75 ease-linear shadow-xs"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 font-hindi px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
              <span>{isHindi ? 'प्रतियोगिताएं लोड हो रही हैं...' : 'Loading competitions...'}</span>
            </span>
            <span className="font-mono text-teal-700 font-black">{countdown}s</span>
          </div>
        </div>

        {/* Footer soft note */}
        <div className="pt-2">
          <p className="text-[11px] text-slate-400 font-medium font-hindi">
            {isHindi ? 'कृपया प्रतीक्षा करें • 3 सेकंड में प्रारंभ हो रहा है' : 'Please wait • Starting in 3 seconds'}
          </p>
        </div>
      </div>
    </div>
  );
};
