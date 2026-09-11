'use client';

import React, { useState, useMemo } from 'react';
import { Calendar, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { IQuizSummary, Language } from './types';
import { QuizCard } from './QuizCard';

interface QuizShowcaseSectionProps {
  quizzes: IQuizSummary[];
  selectedClassName?: string;
  lang: Language;
  onSelectQuiz: (quiz: IQuizSummary) => void;
}

type TabType = 'Ongoing' | 'Upcoming' | 'Past' | 'All';

export const QuizShowcaseSection: React.FC<QuizShowcaseSectionProps> = ({
  quizzes = [],
  selectedClassName,
  lang,
  onSelectQuiz,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('Ongoing');
  const [hasUserChangedTab, setHasUserChangedTab] = useState<boolean>(false);
  const isHindi = lang === 'hi';

  // Categorize quizzes based on scheduleStatus or date
  const filteredQuizzes = useMemo(() => {
    if (activeTab === 'All') return quizzes;
    return quizzes.filter((q) => {
      const status = q.scheduleStatus || 'Ongoing';
      return status.toLowerCase() === activeTab.toLowerCase();
    });
  }, [quizzes, activeTab]);

  // Tab counts
  const counts = useMemo(() => {
    const ongoing = quizzes.filter((q) => (q.scheduleStatus || 'Ongoing') === 'Ongoing').length;
    const upcoming = quizzes.filter((q) => q.scheduleStatus === 'Upcoming').length;
    const past = quizzes.filter((q) => q.scheduleStatus === 'Past').length;
    return {
      Ongoing: ongoing,
      Upcoming: upcoming,
      Past: past,
      All: quizzes.length,
    };
  }, [quizzes]);

  // Smart initial tab selection: if no ongoing quizzes but upcoming exists, show upcoming automatically!
  React.useEffect(() => {
    if (!hasUserChangedTab && quizzes.length > 0) {
      if (counts.Ongoing === 0 && counts.Upcoming > 0) {
        setActiveTab('Upcoming');
      } else if (counts.Ongoing === 0 && counts.Upcoming === 0 && counts.Past > 0) {
        setActiveTab('Past');
      }
    }
  }, [quizzes, counts, hasUserChangedTab]);

  const tabs: TabType[] = ['Ongoing', 'Upcoming', 'Past', 'All'];

  const getTabLabel = (tab: TabType) => {
    if (isHindi) {
      switch (tab) {
        case 'Ongoing': return 'जारी (Ongoing)';
        case 'Upcoming': return 'आगामी (Upcoming)';
        case 'Past': return 'समाप्त (Past)';
        case 'All': return 'सभी (All)';
      }
    }
    return tab;
  };

  return (
    <section id="quiz-showcase-section" className="w-full py-6 sm:py-8 space-y-6">
      {/* Section Header */}
      <div className="text-center space-y-1.5 max-w-2xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold font-hindi shadow-xs mb-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>हिंदी दिवस विशेष प्रतियोगिताएं</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-hindi">
          {isHindi ? 'प्रतियोगिताएं एवं प्रश्नोत्तरी' : 'Competitions & Assessments'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium font-hindi">
          {isHindi
            ? 'अपनी पसंद की प्रतियोगिता चुनें, परीक्षा दें और तत्काल प्रमाण-पत्र प्राप्त करें'
            : 'Explore ongoing, upcoming, and past competitions & receive certified credentials'}
        </p>
      </div>

      {/* ANIMATED FILTER TABS WITH MICRO-INTERACTIONS */}
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 sm:gap-7 border-b border-slate-200/90 relative select-none flex-wrap">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            const count = counts[tab];
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setHasUserChangedTab(true);
                  setActiveTab(tab);
                }}
                className={`group relative pb-3.5 text-xs sm:text-sm md:text-base font-black transition-all duration-200 cursor-pointer outline-none flex items-center gap-2 ${
                  isActive
                    ? 'text-[#F04F38] scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-800 hover:-translate-y-0.5'
                }`}
              >
                {/* Status indicator dot */}
                {tab === 'Ongoing' && count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 relative flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute" />
                  </span>
                )}
                {tab === 'Upcoming' && count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}

                <span>{getTabLabel(tab)}</span>

                {/* Animated Count Badge */}
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-rose-100 text-[#F04F38] shadow-xs'
                      : count > 0
                      ? 'bg-slate-100 text-slate-700 group-hover:bg-amber-100 group-hover:text-amber-800'
                      : 'bg-slate-100 text-slate-400'
                  } ${count > 0 && isActive ? 'animate-badge-pulse' : ''}`}
                >
                  {count}
                </span>

                {/* Smooth Underline Indicator for Active Tab */}
                {isActive && (
                  <span className="absolute bottom-0 inset-x-0 h-[3.5px] bg-gradient-to-r from-rose-500 via-[#F04F38] to-orange-500 rounded-full shadow-sm shadow-rose-500/40" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* QUIZ CONTENT AREA: FIXED MINIMUM HEIGHT PREVENTS COLLAPSE / JUMPING */}
      <div className="w-full max-w-6xl mx-auto px-4 min-h-[460px] sm:min-h-[500px] flex flex-col justify-start">
        {/* Animated Container that transitions smoothly on tab change */}
        <div key={activeTab} className="w-full animate-tab-content">
          {filteredQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 justify-center">
              {filteredQuizzes.map((quiz) => (
                <div key={quiz._id} className="w-full flex justify-center">
                  <QuizCard
                    quiz={quiz}
                    selectedClassName={selectedClassName}
                    lang={lang}
                    onStartQuiz={onSelectQuiz}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Blank / Empty State: Styled elegantly without pushing or shifting the layout */
            <div className="py-14 sm:py-20 px-4 text-center max-w-md mx-auto flex flex-col items-center justify-center space-y-3.5">
              <div className="w-16 h-16 rounded-3xl bg-amber-50/90 border border-amber-200/70 flex items-center justify-center text-amber-600 shadow-inner">
                {activeTab === 'Past' ? (
                  <CheckCircle2 className="w-8 h-8 text-slate-400" />
                ) : activeTab === 'Upcoming' ? (
                  <Clock className="w-8 h-8 text-amber-600" />
                ) : (
                  <Calendar className="w-8 h-8 text-amber-600" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-slate-800 font-hindi">
                  {isHindi
                    ? `इस श्रेणी (${activeTab}) में अभी कोई प्रतियोगिता उपलब्ध नहीं है`
                    : `No competitions currently available under "${activeTab}"`}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-hindi max-w-sm">
                  {isHindi
                    ? 'कृपया अन्य टैब (जारी / आगामी / सभी) देखें या कुछ समय बाद पुनः प्रयास करें।'
                    : 'Please explore other categories or check back soon.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
