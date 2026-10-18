'use client';

import React from 'react';
import { IQuizSummary } from './types';

interface QuizCardProps {
  quiz: IQuizSummary;
  selectedClassName?: string;
  lang?: any;
  onStartQuiz: (quiz: IQuizSummary) => void;
  onQuizOpened?: () => void;
}

function resolveBannerUrl(url?: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) return '/img/hindidiwas.png';
  const u = url.trim();
  if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:')) return u;
  if (u.includes('Eduline') || u === '/admin/Edulinenew.png') return '/img/Edulinenew.png';
  return u;
}

function safeDate(raw?: string | Date | null): Date {
  if (!raw) return new Date(NaN);
  if (raw instanceof Date) return raw;
  let s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s)) {
    s = s.replace(/\s+/, 'T');
  }
  return new Date(s);
}

function fmtDate(raw?: string | Date | null): string {
  const d = safeDate(raw);
  if (isNaN(d.getTime())) return '—';
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  if (hasTime) {
    const timeStr = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dateStr}, ${timeStr.replace(/\s+/g, '\u00A0')}`;
  }
  return dateStr;
}

function parseTimingMinutes(timingStr?: string): number | null {
  if (!timingStr) return null;
  const matchHM = timingStr.match(/(\d+):(\d+)\s*Hours?/i);
  if (matchHM) return parseInt(matchHM[1], 10) * 60 + parseInt(matchHM[2], 10);
  const matchH = timingStr.match(/(\d+(?:\.\d+)?)\s*(?:Hours?|Hr)/i);
  if (matchH) return Math.round(parseFloat(matchH[1]) * 60);
  const matchM = timingStr.match(/(\d+)\s*(?:Minutes?|Min)/i);
  if (matchM) return parseInt(matchM[1], 10);
  return null;
}

const STATUS_CONFIG: Record<string, { label: string; dot: boolean; className: string }> = {
  Ongoing: { label: 'Ongoing', dot: true, className: 'bg-emerald-600 text-white' },
  Upcoming: { label: 'Upcoming', dot: false, className: 'bg-amber-400 text-slate-900' },
  Past: { label: 'Concluded', dot: false, className: 'bg-slate-500 text-white' },
};

const QuizCardComponent: React.FC<QuizCardProps> = ({ quiz, selectedClassName, onStartQuiz, onQuizOpened }) => {
  const scheduleStatus = quiz.scheduleStatus || 'Ongoing';
  const statusCfg = STATUS_CONFIG[scheduleStatus] || STATUS_CONFIG.Ongoing;

  // Local live countdown for Upcoming quizzes (0 network polling)
  const startMs = React.useMemo(() => {
    if (scheduleStatus !== 'Upcoming' || !quiz.startDate) return null;
    const t = safeDate(quiz.startDate).getTime();
    return isNaN(t) ? null : t;
  }, [scheduleStatus, quiz.startDate]);

  const [remainingSec, setRemainingSec] = React.useState<number | null>(() => {
    if (!startMs) return null;
    return Math.max(0, Math.floor((startMs - Date.now()) / 1000));
  });

  const hasFiredOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (!startMs) return;

    const timer = setInterval(() => {
      const diffSec = Math.floor((startMs - Date.now()) / 1000);
      if (diffSec <= 0) {
        setRemainingSec(0);
        clearInterval(timer);
        if (!hasFiredOpenRef.current) {
          hasFiredOpenRef.current = true;
          // Trigger exactly ONE single fetch when quiz start time arrives
          if (onQuizOpened) onQuizOpened();
        }
      } else {
        setRemainingSec(diffSec);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startMs, onQuizOpened]);

  const countdownDisplay = React.useMemo(() => {
    if (remainingSec === null || remainingSec <= 0) return null;
    const h = Math.floor(remainingSec / 3600);
    const m = Math.floor((remainingSec % 3600) / 60);
    const s = remainingSec % 60;
    if (h > 0) {
      return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    }
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  }, [remainingSec]);

  const totalQuestions = quiz.numberOfQuestions || 15;
  const totalScore = quiz.totalScore || totalQuestions;

  // Accurately compute duration according to scheduled times
  const durationMins = (() => {
    // 1. If scheduled with start & end times within 24 hours (e.g. 1:00 PM to 2:00 PM = 60 mins)
    if (quiz.startDate && quiz.endDate) {
      const s = safeDate(quiz.startDate).getTime();
      const e = safeDate(quiz.endDate).getTime();
      const diff = Math.round((e - s) / (1000 * 60));
      if (!isNaN(diff) && diff > 0 && diff <= 1440) return diff;
    }
    // 2. From timing string if specified (e.g. "01:00 Hours" or "1 Hr")
    const fromTiming = parseTimingMinutes(quiz.timing);
    if (fromTiming && fromTiming > 0) return fromTiming;
    // 3. From quiz.durationMinutes
    if (quiz.durationMinutes && quiz.durationMinutes > 0) return quiz.durationMinutes;
    // 4. Default based on questions
    return Math.ceil((totalQuestions * (quiz.timePerQuestion || 40)) / 60);
  })();

  const durationDisplay = (() => {
    if (durationMins % 60 === 0 && durationMins >= 60) {
      return `${durationMins / 60} Hr`;
    }
    if (durationMins >= 60) {
      return `${(durationMins / 60).toFixed(1).replace(/\.0$/, '')} Hr`;
    }
    return `${durationMins} Min`;
  })();

  // Clean time display
  const displayTiming = (() => {
    if (quiz.showTiming === false) return null;
    if (quiz.timing && !/^\s*00:10\s*Hours?\s*$/i.test(quiz.timing)) {
      return quiz.timing;
    }
    if (quiz.startDate && quiz.endDate) {
      const s = safeDate(quiz.startDate);
      const e = safeDate(quiz.endDate);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const sHasTime = s.getHours() !== 0 || s.getMinutes() !== 0;
        const eHasTime = e.getHours() !== 0 || e.getMinutes() !== 0;
        if (sHasTime || eHasTime) {
          const sTime = s.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
          const eTime = e.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
          return `${sTime} – ${eTime}`;
        }
      }
    }
    return quiz.timing || null;
  })();

  // Class display: if multiple classes, show range like "Class 3 to 8"
  const classDisplay = (() => {
    const cls = quiz.classes || [];
    if (cls.length >= 2) {
      const nums = cls.map((c: string) => parseInt(c.replace(/\D/g, ''), 10)).filter((n: number) => !isNaN(n)).sort((a: number, b: number) => a - b);
      if (nums.length >= 2) return `Class ${nums[0]} to ${nums[nums.length - 1]}`;
    }
    if (cls.length === 1) return cls[0].startsWith('Class ') ? cls[0] : `Class ${cls[0]}`;
    return quiz.targetClass || selectedClassName || '';
  })();

  const subjectName =
    (quiz.subjectId && typeof quiz.subjectId === 'object' && (quiz.subjectId as any).name) ||
    quiz.subject || 'General Knowledge';

  const startDate = fmtDate(quiz.startDate);
  const endDate = fmtDate(quiz.endDate);

  const isPlayable = quiz.isPlayable && (scheduleStatus === 'Ongoing');
  const isAttempted = quiz.isAttempted;

  return (
    <div className="w-full max-w-[320px] mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group hover:-translate-y-0.5 gpu-accelerated">
      {/* ── Thumbnail ──────────────────────────────────── */}
      <div className="relative w-full h-40 bg-[#2d7995]/5 overflow-hidden flex items-center justify-center p-3">
        <img
          src={resolveBannerUrl(quiz.bannerUrl)}
          alt={quiz.name}
          loading="lazy"
          decoding="async"
          onError={e => {
            const t = e.currentTarget;
            if (!t.src.includes('/img/hindidiwas.png')) t.src = '/img/hindidiwas.png';
          }}
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
        {/* Status badge */}
        <span className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-black shadow-sm flex items-center gap-1.5 ${statusCfg.className}`}>
          {statusCfg.dot && <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-ping" />}
          {statusCfg.label}
        </span>

        {/* Attempted badge */}
        {isAttempted && (
          <span className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full text-[10px] font-black bg-white/90 text-emerald-700 border border-emerald-300 shadow-sm">
            ✓ Attempted
          </span>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">

        {/* Class eligibility label */}
        {classDisplay && (
          <div className="text-[10px] font-bold text-[#2d7995] bg-[#2d7995]/8 px-2 py-0.5 rounded-md self-start border border-[#2d7995]/20">
            {classDisplay}
          </div>
        )}

        {/* Quiz name + subject */}
        <div>
          <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-[#2d7995] transition-colors">
            {quiz.name}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{subjectName}</p>
        </div>

        {/* Start / End dates & Time */}
        <div className="space-y-1 text-[11px] bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
          {startDate !== '—' && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 font-semibold shrink-0">Start:</span>
              <span className="text-slate-700 font-bold whitespace-nowrap text-right">{startDate}</span>
            </div>
          )}
          {endDate !== '—' && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400 font-semibold shrink-0">End:</span>
              <span className="text-slate-700 font-bold whitespace-nowrap text-right">{endDate}</span>
            </div>
          )}
          {displayTiming && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
              <span className="text-slate-400 font-semibold shrink-0">Time:</span>
              <span className="text-slate-700 font-bold whitespace-nowrap text-right">{displayTiming}</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2">
          {/* Total Score */}
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-center">
            <div className="text-xs font-black text-slate-900">{totalScore}</div>
            <div className="text-[10px] text-slate-400 font-medium leading-tight">Total Score</div>
          </div>
          {/* Questions */}
          <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl py-2 px-3 text-center">
            <div className="text-xs font-black text-emerald-700">{totalQuestions}</div>
            <div className="text-[10px] text-emerald-600 font-medium leading-tight">Questions</div>
          </div>
          {/* Duration */}
          <div className="flex-1 bg-[#2d7995]/10 border border-[#2d7995]/20 rounded-xl py-2 px-3 text-center">
            <div className="text-xs font-black text-[#194c5f]">{durationDisplay}</div>
            <div className="text-[10px] text-[#2d7995] font-medium leading-tight">Duration</div>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-auto pt-1">
          {isAttempted && quiz.attemptResult ? (
            <button
              type="button"
              onClick={() => onStartQuiz(quiz)}
              className="w-full py-2.5 rounded-xl border-2 border-emerald-500 text-emerald-700 font-bold text-xs transition hover:bg-emerald-50 cursor-pointer"
            >
              View Result →
            </button>
          ) : isPlayable ? (
            <button
              type="button"
              onClick={() => onStartQuiz(quiz)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#2d7995] to-[#1f576c] hover:from-[#266881] hover:to-[#1a4a5b] text-white font-bold text-xs transition shadow-sm hover:shadow-md cursor-pointer active:scale-[0.99]"
            >
              Start Quiz →
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full py-2.5 rounded-xl border-2 border-slate-200 text-slate-500 font-bold text-xs cursor-not-allowed bg-slate-50 flex items-center justify-center gap-1.5"
            >
              {scheduleStatus === 'Upcoming'
                ? countdownDisplay
                  ? `⏳ Opens in ${countdownDisplay}`
                  : 'Not Started Yet'
                : scheduleStatus === 'Past'
                ? 'Quiz Closed'
                : 'Unavailable'}
            </button>
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="px-4 py-2 bg-[#2d7995] flex items-center justify-center text-[10px]">
        <span className="text-white font-bold tracking-wide">Eduline Publishers</span>
      </div>
    </div>
  );
};

export const QuizCard = React.memo(QuizCardComponent);
export default QuizCard;
