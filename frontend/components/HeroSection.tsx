import React from 'react';
import {
  GraduationCap,
  Building2,
  Award,
  ChevronDown,
} from 'lucide-react';
import { IQuizSummary, Language } from './types';

interface HeroSectionProps {
  t: any;
  lang: Language;
  isHindiMode: boolean;
  studentName: string;
  setStudentName: (v: string) => void;
  className: string;
  setClassName: (v: string) => void;
  section: string;
  setSection: (v: string) => void;
  studentId: string;
  setStudentId: (v: string) => void;
  selectedSubjectName: string;
  setSelectedSubjectName: (v: string) => void;
  schoolName: string;
  setSchoolName: (v: string) => void;
  availableSubjects: string[];
  currentSubjectQuiz: IQuizSummary | null;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  t,
  lang,
  studentName,
  setStudentName,
  className,
  setClassName,
  schoolName,
  setSchoolName,
  loading,
  onSubmit,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-4">
      {/* LEFT COLUMN: REGISTRATION FORM CARD */}
      <div className="lg:col-span-5 w-full">
        <div className="bg-white/98 backdrop-blur-2xl rounded-[32px] p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300 text-slate-800 border border-slate-100/90 relative overflow-hidden max-w-md mx-auto">
          {/* Top Header Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-indigo-50/90 to-indigo-100/80 border border-indigo-200/60 text-indigo-600 flex items-center justify-center mx-auto mb-3.5 shadow-sm ring-4 ring-indigo-50/50">
            <GraduationCap className="w-8 h-8" />
          </div>

          <div className="text-center space-y-1 mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-hindi">
              {t.formTitle}
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-500 font-medium font-hindi">
              {t.formSubtitle}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-hindi">
                {t.nameLabel}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-xs sm:text-sm font-semibold text-slate-900 transition outline-none bg-slate-50/40 focus:bg-white"
                />
              </div>
            </div>

            {/* Class Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-hindi">
                {t.classLabel}
              </label>
              <div className="relative group">
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-xs sm:text-sm font-semibold text-slate-900 transition outline-none bg-slate-50/40 focus:bg-white cursor-pointer appearance-none pr-10"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((c) => (
                    <option key={c} value={`Class ${c}`}>
                      {lang === 'hi' ? `कक्षा ${c}` : `Class ${c}`}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* School / Institution Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 font-hindi">
                {t.schoolLabel}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder={t.schoolPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 text-xs sm:text-sm font-semibold text-slate-900 transition outline-none bg-slate-50/40 focus:bg-white"
                />
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="pt-2 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundImage: "url('/img/Shape-4.png')",
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
                className="w-full h-14 max-w-[340px] py-3.5 px-6 text-white font-bold text-base sm:text-lg tracking-wide transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer select-none drop-shadow-md border-0 outline-none"
              >
                <span>{loading ? (lang === 'hi' ? 'आगे बढ़ रहे हैं...' : 'Proceeding...') : t.startQuizBtn}</span>
              </button>
            </div>

            <p className="text-xs text-center text-slate-500 font-medium pt-1.5 flex items-center justify-center gap-1.5 font-hindi">
              <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>{t.formFooterTag}</span>
            </p>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: HINDI DIWAS POSTER IMAGE (hidden on mobile, visible on lg screens) */}
      <div className="hidden lg:flex lg:col-span-7 items-center justify-center w-full px-2 sm:px-4 py-2">
        <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl flex items-center justify-center">
          <img
            src="/img/hindidiwas.png"
            alt="हिंदी दिवस"
            className="w-full h-auto max-h-[580px] object-contain drop-shadow-2xl select-none pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
};
