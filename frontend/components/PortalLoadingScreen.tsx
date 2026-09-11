'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, GraduationCap } from 'lucide-react';
import { Language } from './types';

interface PortalLoadingScreenProps {
  lang: Language;
  onFinish?: () => void;
}

export const PortalLoadingScreen: React.FC<PortalLoadingScreenProps> = ({
  onFinish,
}) => {
  const [visible, setVisible] = useState<boolean>(true);
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    // 3-second progress timer (updates every 30ms for smooth progress)
    const startTime = Date.now();
    const duration = 3000; // 3 full seconds

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(progressInterval);
        setProgress(100);
        // Start smooth fade-out
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          if (onFinish) onFinish();
        }, 400);
      }
    }, 30);

    return () => clearInterval(progressInterval);
  }, [onFinish]);

  const handleSkip = () => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, 200);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100000] flex flex-col items-center justify-center p-4 select-none transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } bg-[#FAF6F0]`}
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(2, 132, 199, 0.07) 0%, rgba(254, 243, 199, 0.3) 45%, rgba(245, 235, 220, 0.8) 100%)',
      }}
      onClick={handleSkip}
    >
      {/* Decorative background glow rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-72 h-64 sm:h-72 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />

      {/* Main Logo & Modern Minimalist Loader */}
      <div className="relative flex flex-col items-center justify-center space-y-7 animate-fadeIn">
        {/* Brand Logo with Glowing Halo */}
        <div className="relative">
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-cyan-400/30 via-teal-300/25 to-amber-400/30 blur-lg animate-pulse" />
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/95 bg-white flex items-center justify-center p-1">
            <img
              src="/img/Edulinenew.jpg"
              alt="Eduline Publishers"
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                e.currentTarget.src = '/img/eduline_logo.png';
                e.currentTarget.className = 'w-4/5 h-auto object-contain';
              }}
            />
          </div>
        </div>

        {/* Sleek 3-Second Loading Bar with Smooth Glow */}
        <div className="w-56 sm:w-64 space-y-2">
          <div className="w-full h-2 bg-slate-200/90 rounded-full overflow-hidden p-0.5 border border-slate-300/60 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-teal-500 via-cyan-500 to-amber-500 rounded-full transition-all duration-75 ease-linear shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Subtle pulsating spinner dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
