'use client';

import React, { useState } from 'react';
import { Menu, X, LogOut, UserCheck, UserPlus, LogIn } from 'lucide-react';

interface HeaderProps {
  t?: {
    navHome?: string;
    navInstructions?: string;
    navContact?: string;
  };
  isQuizActive?: boolean;
  registeredStudentName?: string;
  registeredStudentClass?: string;
  onNavigateHome: () => void;
  onOpenInstructions: () => void;
  onOpenContact: () => void;
  onOpenRegister?: () => void;  // Opens Sign Up modal
  onOpenSignIn?: () => void;    // Opens Sign In modal
  onOpenProfile?: () => void;   // Opens Profile / Results modal
  onLogout?: () => void;
}

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

const HeaderComponent: React.FC<HeaderProps> = ({
  t,
  isQuizActive = false,
  registeredStudentName,
  registeredStudentClass,
  onNavigateHome,
  onOpenInstructions,
  onOpenContact,
  onOpenRegister,
  onOpenSignIn,
  onOpenProfile,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const navHomeText = t?.navHome || 'Home';
  const navInstructionsText = t?.navInstructions || 'Instructions';
  const navContactText = t?.navContact || 'Contact Us';

  const handleMobileNav = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 relative">
        {/* Left: Logo */}
        <div
          className="flex items-center cursor-pointer select-none transition-opacity duration-200 hover:opacity-85 shrink-0 z-10"
          onClick={onNavigateHome}
        >
          {/* Mobile Screen Logo (< sm) */}
          <img
            src="/img/mobilelogo.jpg"
            alt="Eduline"
            className="h-8 sm:hidden w-auto object-contain rounded-md select-none shadow-2xs"
          />
          {/* Desktop/Tablet Logo (sm and above) */}
          <img
            src="/img/Edulinenew.png"
            alt="Eduline Publishers"
            className="h-[1.8rem] w-auto object-contain select-none hidden sm:block"
          />
        </div>

        {/* Center Title when Quiz is Active */}
        {isQuizActive && (
          <div className="text-center select-none px-1 sm:px-2 z-10 flex items-center justify-center flex-1">
            <span className="text-xs sm:text-base font-bold text-slate-800 tracking-tight sm:tracking-wide uppercase truncate">
              Online Quiz Examination
            </span>
          </div>
        )}

        {/* Right Navigation */}
        {isQuizActive ? (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onNavigateHome}
              className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 sm:px-3.5 py-1.5 rounded-lg border border-rose-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              Exit Quiz
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-3 py-1">
              <button type="button" onClick={onNavigateHome} className={NAV_BTN_CLASS} style={NAV_BTN_STYLE}>
                <span className="relative z-10 px-0.5">{navHomeText}</span>
              </button>

              <button type="button" onClick={onOpenInstructions} className={NAV_BTN_CLASS} style={NAV_BTN_STYLE}>
                <span className="relative z-10 px-0.5">{navInstructionsText}</span>
              </button>

              <button type="button" onClick={onOpenContact} className={NAV_BTN_CLASS} style={NAV_BTN_STYLE}>
                <span className="relative z-10 px-0.5">{navContactText}</span>
              </button>

              {/* Auth Area */}
              {registeredStudentName ? (
                /* Logged-in student profile pill with dropdown */
                <div className="relative ml-1">
                  <div 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2d7995]/10 border border-[#2d7995]/30 text-[#194c5f] text-xs font-bold shadow-xs cursor-pointer hover:bg-[#2d7995]/15 transition"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#2d7995] text-white flex items-center justify-center shrink-0">
                      {registeredStudentName.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate max-w-[120px]">{registeredStudentName}</span>
                    {registeredStudentClass && registeredStudentClass !== 'undefined' && (
                      <span className="text-[10px] bg-[#2d7995]/15 text-[#194c5f] px-1.5 py-0.5 rounded-md font-mono shrink-0">
                        Class {registeredStudentClass}
                      </span>
                    )}
                  </div>
                  
                  {/* Dropdown Menu */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                      {onOpenProfile && (
                        <button
                          type="button"
                          onClick={() => { setProfileMenuOpen(false); onOpenProfile(); }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                        >
                          My Profile & Results
                        </button>
                      )}
                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => { setProfileMenuOpen(false); onLogout(); }}
                          className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition"
                        >
                          Logout
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Sign In + Sign Up buttons */
                <div className="flex items-center gap-2 ml-1">
                  {onOpenSignIn && (
                    <button
                      type="button"
                      onClick={onOpenSignIn}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#2d7995]/30 hover:border-[#2d7995] bg-white hover:bg-[#2d7995]/5 text-[#2d7995] text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Sign In
                    </button>
                  )}
                  {onOpenRegister && (
                    <button
                      type="button"
                      onClick={onOpenRegister}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#2d7995] to-[#1f576c] hover:from-[#266881] hover:to-[#1a4a5b] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Sign Up
                    </button>
                  )}
                </div>
              )}
            </nav>

              {/* Mobile: auth buttons + hamburger */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle Menu"
                className="p-1.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile Dropdown Menu */}
      {!isQuizActive && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/98 backdrop-blur-xl px-4 py-4 shadow-xl">
          <div className="flex flex-col gap-2.5 items-center">
            {registeredStudentName ? (
              <div className="w-full max-w-[260px] flex flex-col gap-2">
                <div className="py-2 px-4 rounded-xl bg-[#2d7995]/10 border border-[#2d7995]/30 text-[#194c5f] font-bold text-xs text-center flex items-center justify-between">
                  <span>{registeredStudentName} (Class {registeredStudentClass})</span>
                </div>
                {onOpenProfile && (
                  <button type="button" onClick={() => handleMobileNav(onOpenProfile)} className="py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700">
                    My Profile & Results
                  </button>
                )}
                {onLogout && (
                  <button type="button" onClick={() => handleMobileNav(onLogout)} className="py-2 rounded-xl bg-rose-50 text-rose-600 text-sm font-semibold border border-rose-200">
                    Logout
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2 w-full max-w-[260px]">
                {onOpenSignIn && (
                  <button
                    type="button"
                    onClick={() => handleMobileNav(onOpenSignIn)}
                    className="flex-1 py-2 px-3 rounded-xl border border-[#2d7995]/30 bg-white text-[#194c5f] font-bold text-xs text-center"
                  >
                    Sign In
                  </button>
                )}
                {onOpenRegister && (
                  <button
                    type="button"
                    onClick={() => handleMobileNav(onOpenRegister)}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#2d7995] to-[#1f576c] hover:from-[#266881] hover:to-[#1a4a5b] text-white font-bold text-xs text-center shadow-xs"
                  >
                    Sign Up
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => handleMobileNav(onNavigateHome)}
              className="relative w-full max-w-[260px] h-10 text-white font-bold text-sm bg-no-repeat bg-center flex items-center justify-center cursor-pointer select-none"
              style={NAV_BTN_STYLE}
            >
              <span className="relative z-10">{navHomeText}</span>
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav(onOpenInstructions)}
              className="relative w-full max-w-[260px] h-10 text-white font-bold text-sm bg-no-repeat bg-center flex items-center justify-center cursor-pointer select-none"
              style={NAV_BTN_STYLE}
            >
              <span className="relative z-10">{navInstructionsText}</span>
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav(onOpenContact)}
              className="relative w-full max-w-[260px] h-10 text-white font-bold text-sm bg-no-repeat bg-center flex items-center justify-center cursor-pointer select-none"
              style={NAV_BTN_STYLE}
            >
              <span className="relative z-10">{navContactText}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export const Header = React.memo(HeaderComponent);
export default Header;