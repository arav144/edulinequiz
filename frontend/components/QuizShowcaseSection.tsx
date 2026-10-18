'use client';

import React, { useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { IQuizSummary, Language } from './types';
import { QuizCard } from './QuizCard';

interface QuizShowcaseSectionProps {
  quizzes: IQuizSummary[];
  selectedClassName?: string;
  lang?: Language;
  onSelectQuiz: (quiz: IQuizSummary) => void;
  onQuizOpened?: () => void;
}

type TabType = 'Ongoing' | 'Upcoming' | 'Past' | 'All';

const QuizShowcaseSectionComponent: React.FC<QuizShowcaseSectionProps> = ({
  quizzes = [],
  selectedClassName,
  onSelectQuiz,
  onQuizOpened,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('Ongoing');
  const [hasUserChangedTab, setHasUserChangedTab] = useState<boolean>(false);

  // Categorize quizzes based on scheduleStatus
  const filteredQuizzes = useMemo(() => {
    const list = activeTab === 'All'
      ? [...quizzes]
      : quizzes.filter((q) => {
        const status = q.scheduleStatus || 'Ongoing';
        return status.toLowerCase() === activeTab.toLowerCase();
      });

    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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

  // If ongoing is 0 but upcoming has quizzes, default to upcoming on initial load
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

  return (
    <section id="quiz-showcase-section" className="w-full py-4 sm:py-6 space-y-6">
      {/* Section Header */}
      <div className="text-center space-y-1 max-w-xl mx-auto px-4">
        {/* <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Curated Academic Assessments</span>
        </div> */}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Available Quizzes
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Select an assessment to view rules and start your evaluation.
        </p>
      </div>

      {/* TABS MATCHING REFERENCE IMAGE 2 */}
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-4 sm:gap-8 border-b border-slate-200/90 relative select-none flex-wrap">
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
                className={`group relative pb-3.5 text-sm sm:text-base font-black transition-all duration-200 cursor-pointer outline-none flex items-center gap-2 ${isActive
                    ? 'text-[#2d7995]'
                    : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                {/* Status indicator dot */}
                {tab === 'Ongoing' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative flex items-center justify-center shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
                  </span>
                )}
                {tab === 'Upcoming' && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2d7995] shrink-0" />
                )}

                <span>{tab}</span>

                {/* Count Badge */}
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold transition-all ${isActive
                      ? 'bg-[#2d7995]/15 text-[#194c5f]'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}
                >
                  {count}
                </span>

                {/* Underline Indicator for Active Tab */}
                {isActive && (
                  <span className="absolute bottom-0 inset-x-0 h-[3.5px] bg-gradient-to-r from-[#194c5f] via-[#2d7995] to-[#4ba1c0] rounded-full shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* QUIZ CARDS GRID */}
      <div className="w-full max-w-6xl mx-auto px-4">
        {filteredQuizzes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
            {filteredQuizzes.map((quiz) => (
              <div key={quiz._id} className="w-full flex justify-center cv-auto">
                <QuizCard
                  quiz={quiz}
                  selectedClassName={selectedClassName}
                  onStartQuiz={onSelectQuiz}
                  onQuizOpened={onQuizOpened}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/80 rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs max-w-md mx-auto space-y-2">
            <h4 className="text-base font-bold text-slate-800">
              No {activeTab} Quizzes
            </h4>
            <p className="text-xs text-slate-500">
              There are currently no {activeTab.toLowerCase()} assessments matching your criteria.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export const QuizShowcaseSection = React.memo(QuizShowcaseSectionComponent);
export default QuizShowcaseSection;
