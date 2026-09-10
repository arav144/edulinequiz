'use client';

import React, { useState } from 'react';
import { Download, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { ISubmissionResult, Language, TRANSLATIONS } from './types';

interface CertificateViewProps {
  submissionResult: ISubmissionResult;
  lang: Language;
  classNameVal?: string;
  sectionVal?: string;
  schoolNameVal?: string;
  downloadingPdf: string | null;
  onDownloadPdf: (type: 'pdf' | 'certificate') => void;
  onBackToDashboard: () => void;
}

export const CertificateView: React.FC<CertificateViewProps> = ({
  submissionResult,
  lang,
  classNameVal,
  schoolNameVal,
  downloadingPdf,
  onDownloadPdf,
  onBackToDashboard,
}) => {
  const t = TRANSLATIONS[lang];
  const isHindiMode = lang === 'hi';
  const [downloadingImg, setDownloadingImg] = useState(false);

  const studentDisplayName = submissionResult.studentName || 'Student';
  const rawClass = submissionResult.className || classNameVal || '8';
  // Remove 'Class' or 'कक्षा' prefix since 'कक्षा:' is already printed on the certificate template
  const displayClass = rawClass.replace(/^(class|कक्षा)\s*/i, '').trim() || rawClass;
  const displaySchool = submissionResult.schoolName || schoolNameVal || 'विद्यालय';
  const getFormatDate = (val: any) => {
    try {
      const d = val ? new Date(val) : new Date();
      if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-GB');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return new Date().toLocaleDateString('en-GB');
    }
  };

  const dateStr = getFormatDate(submissionResult.submittedAt);
  const certYear = (() => {
    try {
      const d = submissionResult.submittedAt ? new Date(submissionResult.submittedAt) : new Date();
      return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
    } catch {
      return new Date().getFullYear();
    }
  })();
  const certId =
    submissionResult.certificateId ||
    `EDU-${certYear}-${String(submissionResult.attemptId || '000001').slice(-6).toUpperCase()}`;

  const isPassed = submissionResult.result === 'Pass';

  // Client-side high-resolution Certificate Image download using HTML Canvas
  const handleDownloadImage = async () => {
    try {
      setDownloadingImg(true);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize canvas context');

      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        bgImg.onload = () => resolve();
        bgImg.onerror = () => reject(new Error('Failed to load certificate template image'));
        bgImg.src = '/img/certificate_framepdf.jpeg';
      });

      const W = bgImg.naturalWidth || 1600;
      const H = bgImg.naturalHeight || 1153;
      canvas.width = W;
      canvas.height = H;

      // 1. Draw Template Frame
      ctx.drawImage(bgImg, 0, 0, W, H);

      // Helper for clean centered text
      ctx.fillStyle = '#0F172A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 1. Candidate Name (Centered)
      ctx.font = 'bold 44px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(studentDisplayName, W / 2, H * 0.465);

      // 2. Class
      ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(displayClass, W * 0.275, H * 0.635);

      // 3. School / Vidyalay
      ctx.textAlign = 'left';
      ctx.fillText(displaySchool, W * 0.56, H * 0.635);

      // 4. Score: Marks (Clean font sizing)
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText(`${submissionResult.score} / ${submissionResult.totalQuestions}`, W * 0.268, H * 0.732);

      // 5. Score: Percentage
      ctx.fillText(`${submissionResult.percentage}%`, W * 0.522, H * 0.732);

      // 6. Score: Result
      ctx.fillStyle = isPassed ? '#15803D' : '#B91C1C';
      ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(isPassed ? (isHindiMode ? 'उत्तीर्ण' : 'Pass') : (isHindiMode ? 'अनुत्तीर्ण' : 'Fail'), W * 0.784, H * 0.732);

      // 7. Date
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'left';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText(dateStr, W * 0.315, H * 0.825);

      // 8. Certificate ID
      ctx.fillText(certId, W * 0.295, H * 0.866);

      // Trigger Download
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Certificate_${studentDisplayName.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert(`Could not download image: ${err.message || 'Unknown error'}`);
    } finally {
      setDownloadingImg(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 animate-fadeIn">
      {/* Action Toolbar (no-print: hidden when printing) */}
      <div className="no-print bg-white/95 backdrop-blur-md border border-slate-200/90 p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* OPTION 1: Direct Clean PDF Download Button */}
          <button
            type="button"
            onClick={() => onDownloadPdf('certificate')}
            disabled={downloadingPdf === 'certificate'}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer select-none disabled:opacity-60"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>
              {downloadingPdf === 'certificate'
                ? (isHindiMode ? 'PDF डाउनलोड हो रहा है...' : 'Downloading PDF...')
                : (isHindiMode ? 'प्रमाण-पत्र डाउनलोड करें (PDF)' : 'Download Certificate (PDF)')}
            </span>
          </button>

          {/* OPTION 2: Direct Image (JPG) Download Button (Bright & clean, not dark) */}
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={downloadingImg}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:brightness-105 text-amber-950 text-xs sm:text-sm font-extrabold border border-amber-400/80 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer select-none disabled:opacity-60"
          >
            <ImageIcon className="w-4 h-4 text-amber-900" />
            <span>
              {downloadingImg
                ? (isHindiMode ? 'इमेज तैयार हो रही है...' : 'Generating Image...')
                : (isHindiMode ? 'प्रमाण-पत्र डाउनलोड करें (Image / फोटो)' : 'Download Image (JPG)')}
            </span>
          </button>
        </div>

        {/* Back Button */}
        <button
          type="button"
          onClick={onBackToDashboard}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToDashboard}</span>
        </button>
      </div>

      {/* Framed Certificate of Achievement using certificate_framepdf.jpeg */}
      <div
        id="printableCertificate"
        className="relative mx-auto w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-amber-300/40 select-none bg-white"
      >
        <div className="relative w-full aspect-[1600/1153]">
          {/* Certificate Template Image */}
          <img
            src="/img/certificate_framepdf.jpeg"
            alt="Certificate of Achievement"
            className="w-full h-full object-contain block pointer-events-none"
          />

          {/* 1. Candidate Name (Line Y=545/1153 = 47.3%, Centered) */}
          <div
            className="absolute flex items-end justify-center pointer-events-none"
            style={{
              top: '38.2%',
              left: '28.0%',
              width: '44.0%',
              height: '8.4%',
            }}
          >
            <span className="font-hindi font-black text-slate-950 tracking-wide text-base sm:text-2xl md:text-3xl lg:text-4xl text-center leading-none px-2 truncate">
              {studentDisplayName}
            </span>
          </div>

          {/* 2. Candidate Class (Line Y=750/1153 = 65.05%, X=352..529 = 22.0%..33.1%) */}
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              top: '61.5%',
              left: '22.0%',
              width: '11.1%',
              height: '3.6%',
            }}
          >
            <span className="font-hindi font-bold text-slate-900 text-[11px] sm:text-sm md:text-base lg:text-lg text-center truncate">
              {displayClass}
            </span>
          </div>

          {/* 3. Candidate School (Line Y=750/1153 = 65.05%, X=895..1379 = 55.9%..86.2%) */}
          <div
            className="absolute flex items-center justify-start pointer-events-none"
            style={{
              top: '61.5%',
              left: '56.0%',
              width: '30.2%',
              height: '3.6%',
            }}
          >
            <span className="font-hindi font-bold text-slate-900 text-[11px] sm:text-sm md:text-base lg:text-lg text-left truncate pl-1">
              {displaySchool}
            </span>
          </div>

          {/* 4. Score: Marks (Line Y=860/1153 = 74.6%, X=340..518 = 21.25%..32.38%) */}
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              top: '71.2%',
              left: '20.2%',
              width: '13.0%',
              height: '3.6%',
            }}
          >
            <span className="font-mono font-black text-slate-950 text-[8px] sm:text-xs md:text-sm lg:text-base whitespace-nowrap">
              {submissionResult.score} / {submissionResult.totalQuestions}
            </span>
          </div>

          {/* 5. Score: Percentage (Line Y=860/1153 = 74.6%, X=746..923 = 46.6%..57.7%) */}
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              top: '71.2%',
              left: '46.6%',
              width: '11.1%',
              height: '3.6%',
            }}
          >
            <span className="font-mono font-black text-slate-950 text-[11px] sm:text-sm md:text-base lg:text-lg">
              {submissionResult.percentage}%
            </span>
          </div>

          {/* 6. Score: Result (Line Y=860/1153 = 74.6%, X=1167..1344 = 72.9%..84.0%) */}
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              top: '71.2%',
              left: '72.9%',
              width: '11.1%',
              height: '3.6%',
            }}
          >
            <span
              className={`font-hindi font-black text-[11px] sm:text-sm md:text-base lg:text-lg ${
                isPassed ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              {isPassed ? (isHindiMode ? 'उत्तीर्ण' : 'Pass') : (isHindiMode ? 'अनुत्तीर्ण' : 'Fail')}
            </span>
          </div>

          {/* 7. Issue Date (Line Y=964/1153 = 83.6%, X=492..670 = 30.75%..41.88%) */}
          <div
            className="absolute flex items-center justify-start pointer-events-none"
            style={{
              top: '80.5%',
              left: '30.75%',
              width: '20.0%',
              height: '3.6%',
            }}
          >
            <span className="font-mono font-bold text-slate-900 text-[10px] sm:text-xs md:text-sm lg:text-base whitespace-nowrap">
              {dateStr}
            </span>
          </div>

          {/* 8. Certificate ID (Line Y=1015/1153 = 88.0%, X=461..637 = 28.8%..39.8%) */}
          <div
            className="absolute flex items-center justify-start pointer-events-none"
            style={{
              top: '84.8%',
              left: '28.8%',
              width: '26.0%',
              height: '3.6%',
            }}
          >
            <span className="font-mono font-bold text-slate-900 text-[10px] sm:text-xs md:text-sm lg:text-base whitespace-nowrap tracking-tight">
              {certId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
