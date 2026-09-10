'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  t: {
    navHome: string;
    navAbout?: string;
    navInstructions: string;
    navContact: string;
  };
  isQuizActive?: boolean;
  onNavigateHome: () => void;
  onOpenAbout?: () => void;
  onOpenInstructions: () => void;
  onOpenContact: () => void;
}

// Fixed sizing for desktop buttons
const NAV_BTN_CLASS =
  'relative w-[110px] md:w-[124px] h-8 text-white font-bold ' +
  'text-xs transition-all duration-200 ' +
  'hover:brightness-110 hover:shadow-md hover:text-amber-200 active:brightness-95 ' +
  'whitespace-nowrap bg-no-repeat bg-center flex items-center justify-center ' +
  'cursor-pointer select-none shrink-0 px-1';

const NAV_BTN_STYLE: React.CSSProperties = {
  backgroundImage: "url('/img/Shape-4.png')",
  backgroundSize: '100% 100%',
};

export const Header: React.FC<HeaderProps> = ({
  t,
  isQuizActive = false,
  onNavigateHome,
  onOpenAbout,
  onOpenInstructions,
  onOpenContact,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNav = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs relative">
      {/* Hanging 3D Hindi Letters (letter.png) directly below the header on top-left */}
      <div className="absolute top-full left-1 sm:left-4 md:left-8 pointer-events-none select-none z-30 w-20 sm:w-28 md:w-48 lg:w-60 -mt-[1px]">
        <img
          src="/img/letter.png"
          alt="Hanging Hindi Letters"
          className="w-full h-auto object-contain block drop-shadow-md"
        />
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 relative">
        {/* Left: Logo Branding */}
        <div
          className="flex items-center cursor-pointer select-none transition-opacity duration-200 hover:opacity-85 shrink-0 z-10"
          onClick={onNavigateHome}
        >
          <img
            src="/img/Edulinenew.jpg"
            alt="Eduline Publishers"
            className="h-8 sm:h-12 md:h-16 w-auto object-contain"
          />
        </div>

        {/* Center: "हिंदी की बात, क्विज़ के साथ" image when Quiz is Active */}
        {isQuizActive && (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-center pointer-events-none select-none px-2 max-w-[60vw] sm:max-w-[50vw] md:max-w-none z-10 flex items-center justify-center">
            <img
              src="/img/headerfont.png"
              alt="हिंदी की बात, क्विज़ के साथ"
              className="h-6 sm:h-8 md:h-10 w-auto max-w-full object-contain drop-shadow-xs"
            />
          </div>
        )}

        {/* Right Navigation */}
        {isQuizActive ? (
          // Quiz Mode Header Action
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateHome}
              className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-1.5 rounded-lg border border-rose-200 transition-colors"
            >
              Exit Quiz
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Navigation: 3 Buttons */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-3 py-1">
              <button
                type="button"
                onClick={onNavigateHome}
                className={NAV_BTN_CLASS}
                style={NAV_BTN_STYLE}
              >
                <span className="relative z-10 px-0.5">{t.navHome}</span>
              </button>

              <button
                type="button"
                onClick={onOpenInstructions}
                className={NAV_BTN_CLASS}
                style={NAV_BTN_STYLE}
              >
                <span className="relative z-10 px-0.5">{t.navInstructions}</span>
              </button>

              <button
                type="button"
                onClick={onOpenContact}
                className={NAV_BTN_CLASS}
                style={NAV_BTN_STYLE}
              >
                <span className="relative z-10 px-0.5">{t.navContact}</span>
              </button>
            </nav>

            {/* Mobile Hamburger Toggle Button */}
            <div className="flex md:hidden items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle Menu"
                className="p-1.5 sm:p-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800" />
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Dropdown Menu Drawer (Only when not in quiz) */}
      {!isQuizActive && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/98 backdrop-blur-xl px-4 py-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-2.5 items-center">
            <button
              type="button"
              onClick={() => handleMobileNav(onNavigateHome)}
              className="relative w-full max-w-[260px] h-10 text-white font-bold text-sm bg-no-repeat bg-center flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 drop-shadow-sm"
              style={NAV_BTN_STYLE}
            >
              <span className="relative z-10">{t.navHome}</span>
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav(onOpenInstructions)}
              className="relative w-full max-w-[260px] h-10 text-white font-bold text-sm bg-no-repeat bg-center flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 drop-shadow-sm"
              style={NAV_BTN_STYLE}
            >
              <span className="relative z-10">{t.navInstructions}</span>
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav(onOpenContact)}
              className="relative w-full max-w-[260px] h-10 text-white font-bold text-sm bg-no-repeat bg-center flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 drop-shadow-sm"
              style={NAV_BTN_STYLE}
            >
              <span className="relative z-10">{t.navContact}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};