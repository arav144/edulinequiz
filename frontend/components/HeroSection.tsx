'use client';

import React from 'react';
import { IStudentProfile } from './types';
import { UserCheck, ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  studentProfile?: IStudentProfile | null;
  onOpenRegister: () => void;
  onRegistrationSuccess: (profile: IStudentProfile) => void;
  onScrollToQuizzes: () => void;
}

const HeroSectionComponent: React.FC<HeroSectionProps> = ({
  studentProfile,
  onOpenRegister,
  onScrollToQuizzes,
}) => {
  /* ── Logged-in welcome strip ────────────────────────── */
  if (studentProfile) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-3">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-base shrink-0">
                {(studentProfile.firstName || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-emerald-100 text-[11px] font-medium">Welcome back!</p>
                <p className="text-white font-black text-sm leading-tight">
                  {studentProfile.firstName} {studentProfile.lastName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-emerald-100 font-medium">
                {studentProfile.className || `Class ${studentProfile.class}`}
              </div>
              <div className="text-[10px] text-emerald-200 truncate max-w-[140px]">
                {studentProfile.schoolName}
              </div>
            </div>
          </div>
          <div className="px-5 py-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Scroll down to view and attempt your available quizzes.
            </p>
            <button
              onClick={onScrollToQuizzes}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#194c5f] hover:text-[#2d7995] cursor-pointer"
            >
              View Quizzes <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Guest welcome banner ───────────────────────────── */
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-3 animate-fadeIn">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#2d7995]/25 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#2d7995]/10 text-[#2d7995] flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-800 tracking-tight">
              Welcome to the Eduline Quiz Portal!
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Create an account to participate in online quizzes and earn certificates.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenRegister}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2d7995] to-[#1f576c] hover:from-[#266881] hover:to-[#1a4a5b] text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0 whitespace-nowrap"
        >
          <span>Click here to Register</span>
        </button>
      </div>
    </div>
  );
};

export const HeroSection = React.memo(HeroSectionComponent);
export default HeroSection;
