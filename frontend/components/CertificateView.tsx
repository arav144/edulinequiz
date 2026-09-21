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
  const rawClass = submissionResult.className || classNameVal || '';
  // Remove 'Class' or 'कक्षा' prefix since 'कक्षा:' is already printed on the certificate template
  const displayClass = rawClass ? (rawClass.replace(/^(class|कक्षा)\s*/i, '').trim() || rawClass) : '---';
  const displaySchool = submissionResult.schoolName || schoolNameVal || 'विद्यालय';
  function safeDate(raw?: string | Date | null): Date {
    if (!raw) return new Date(NaN);
    if (raw instanceof Date) return raw;
    let s = String(raw).trim();
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s)) {
      s = s.replace(/\s+/, 'T');
    }
    return new Date(s);
  }

  const getFormatDate = (val: any) => {
    try {
      const d = val ? safeDate(val) : new Date();
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
      const d = submissionResult.submittedAt ? safeDate(submissionResult.submittedAt) : new Date();
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

      // Ensure browser web fonts are loaded
      if (document.fonts) {
        await document.fonts.ready;
      }

      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        bgImg.onload = () => resolve();
        bgImg.onerror = () => reject(new Error('Failed to load certificate template image'));
        bgImg.src = '/img/certificate_framepdf.jpg';
      });

      const W = bgImg.naturalWidth || 2560;
      const H = bgImg.naturalHeight || 1846;
      canvas.width = W;
      canvas.height = H;

      // 1. Draw Template Frame Image
      ctx.drawImage(bgImg, 0, 0, W, H);

      // Proportional font sizing: baseline 1846px height
      const fontScale = H / 1846;

      const nameFontSize = Math.round(72 * fontScale);
      const classFontSize = Math.round(40 * fontScale);
      const schoolFontSize = Math.round(38 * fontScale);
      const marksFontSize = Math.round(42 * fontScale);
      const percentageFontSize = Math.round(42 * fontScale);
      const resultFontSize = Math.round(40 * fontScale);
      const dateFontSize = Math.round(32 * fontScale);
      const certIdFontSize = Math.round(31 * fontScale);

      ctx.fillStyle = '#0F172A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 1. Candidate Name (Empty space Y=905..1065, Center Y = 52.5%)
      let curNameSize = nameFontSize;
      ctx.font = `bold ${curNameSize}px "Plus Jakarta Sans", "Noto Sans Devanagari", "Segoe UI", sans-serif`;
      const maxNameW = W * 0.58;
      while (ctx.measureText(studentDisplayName).width > maxNameW && curNameSize > 30) {
        curNameSize -= 3;
        ctx.font = `bold ${curNameSize}px "Plus Jakarta Sans", "Noto Sans Devanagari", "Segoe UI", sans-serif`;
      }
      ctx.fillText(studentDisplayName, W * 0.50, H * 0.525);

      // 2. Class (Underline Y = 69.88%, Underline X = 33.01%..44.92%, Center X = 38.96%)
      ctx.font = `bold ${classFontSize}px "Plus Jakarta Sans", "Noto Sans Devanagari", "Segoe UI", sans-serif`;
      ctx.fillText(displayClass, W * 0.390, H * 0.686);

      // 3. School / Vidyalay (Underline Y = 69.88%, Underline X = 60.90%..72.81%, Left X = 61.0%)
      ctx.textAlign = 'left';
      let curSchoolSize = schoolFontSize;
      ctx.font = `bold ${curSchoolSize}px "Plus Jakarta Sans", "Noto Sans Devanagari", "Segoe UI", sans-serif`;
      const maxSchoolW = W * 0.22;
      while (ctx.measureText(displaySchool).width > maxSchoolW && curSchoolSize > 20) {
        curSchoolSize -= 2;
        ctx.font = `bold ${curSchoolSize}px "Plus Jakarta Sans", "Noto Sans Devanagari", "Segoe UI", sans-serif`;
      }
      ctx.fillText(displaySchool, W * 0.610, H * 0.686);

      // 4. Score Box: Marks (Underline Y = 74.32%, Underline X = 19.84%..31.76%, Center X = 25.80%)
      ctx.textAlign = 'center';
      ctx.font = `bold ${marksFontSize}px "JetBrains Mono", "Plus Jakarta Sans", monospace`;
      ctx.fillText(`${submissionResult.score} / ${submissionResult.totalQuestions}`, W * 0.258, H * 0.730);

      // 5. Score Box: Percentage (Underline Y = 74.32%, Underline X = 49.73%..61.64%, Center X = 55.68%)
      ctx.font = `bold ${percentageFontSize}px "JetBrains Mono", "Plus Jakarta Sans", monospace`;
      ctx.fillText(`${submissionResult.percentage}%`, W * 0.557, H * 0.730);

      // 6. Score Box: Result (Underline Y = 74.32%, Underline X = 75.08%..87.03%, Center X = 81.05%)
      const pctVal = submissionResult.percentage ?? 0;
      let displayResult = '';
      let resultColor = '#15803D';

      if (pctVal >= 90) {
        displayResult = isHindiMode ? 'उत्कृष्ट' : 'Outstanding';
        resultColor = '#15803D';
      } else if (pctVal >= 75) {
        displayResult = isHindiMode ? 'अति उत्तम' : 'Very Good';
        resultColor = '#15803D';
      } else if (pctVal >= 60) {
        displayResult = isHindiMode ? 'सराहनीय' : 'Good Effort';
        resultColor = '#0284C7';
      } else if (pctVal >= 50) {
        displayResult = isHindiMode ? 'उत्तीर्ण' : 'Passed';
        resultColor = '#0284C7';
      } else {
        displayResult = isHindiMode ? 'पुनः प्रयास करें' : 'Better Luck Next Time';
        resultColor = '#D97706';
      }

      ctx.fillStyle = resultColor;
      let curResultSize = displayResult.length > 15 ? Math.round(resultFontSize * 0.65) : resultFontSize;
      ctx.font = `bold ${curResultSize}px "Plus Jakarta Sans", "Noto Sans Devanagari", "Segoe UI", sans-serif`;
      const maxResultW = W * 0.12;
      while (ctx.measureText(displayResult).width > maxResultW && curResultSize > 14) {
        curResultSize -= 2;
        ctx.font = `bold ${curResultSize}px "Plus Jakarta Sans", "Noto Sans Devanagari", "Segoe UI", sans-serif`;
      }
      ctx.fillText(displayResult, W * 0.811, H * 0.730);

      // 7. Date (Underline Y = 80.93%, Underline X = 24.41%..36.33%, Center X = 30.37%)
      ctx.fillStyle = '#1E293B';
      ctx.textAlign = 'center';
      ctx.font = `bold ${dateFontSize}px "JetBrains Mono", "Plus Jakarta Sans", monospace`;
      ctx.fillText(dateStr, W * 0.304, H * 0.798);

      // 8. Certificate ID (Underline Y = 85.59%, Underline X = 24.38%..36.29%, Center X = 30.33%)
      ctx.font = `bold ${certIdFontSize}px "JetBrains Mono", "Plus Jakarta Sans", monospace`;
      ctx.fillText(certId, W * 0.304, H * 0.845);

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
      <div className="no-print bg-white/95 backdrop-blur-md border border-slate-200/90 p-2.5 sm:p-5 rounded-2xl shadow-md">
        {/* MOBILE VIEW (< sm): Sleek, ultra-clean Icon Action Bar in 1 single horizontal row */}
        <div className="flex sm:hidden items-center justify-between gap-2 w-full">
          {/* PDF Download Icon Button */}
          <button
            type="button"
            onClick={() => onDownloadPdf('certificate')}
            disabled={downloadingPdf === 'certificate'}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 active:scale-95 text-white font-black text-xs shadow-md transition-all disabled:opacity-60 cursor-pointer"
            title="Download PDF"
          >
            <Download className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span className="truncate">
              {downloadingPdf === 'certificate' ? 'Downloading...' : 'PDF'}
            </span>
          </button>

          {/* Image (JPG) Download Icon Button */}
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={downloadingImg}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-gradient-to-r from-[#2d7995] to-[#1f576c] active:scale-95 text-white font-black text-xs shadow-md transition-all disabled:opacity-60 cursor-pointer"
            title="Download Image (JPG)"
          >
            <ImageIcon className="w-4 h-4 text-white flex-shrink-0" />
            <span className="truncate">
              {downloadingImg ? 'Generating...' : 'Image (JPG)'}
            </span>
          </button>

          {/* Back Home Button */}
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs transition-all shrink-0 cursor-pointer"
            title="Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>
        </div>

        {/* DESKTOP VIEW (>= sm): Full buttons */}
        <div className="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* OPTION 1: Direct Clean PDF Download Button */}
            <button
              type="button"
              onClick={() => onDownloadPdf('certificate')}
              disabled={downloadingPdf === 'certificate'}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer select-none disabled:opacity-60"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>
                {downloadingPdf === 'certificate' ? 'Downloading Certificate (PDF)...' : 'Download Certificate (PDF)'}
              </span>
            </button>

            {/* OPTION 2: Direct Image (JPG) Download Button */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={downloadingImg}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2d7995] to-[#1f576c] hover:from-[#266881] hover:to-[#1a4a5b] text-white text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer select-none disabled:opacity-60"
            >
              <ImageIcon className="w-4 h-4 text-white" />
              <span>
                {downloadingImg ? 'Generating Image...' : 'Download Image (JPG)'}
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
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Framed Certificate of Achievement using certificate_framepdf.jpeg */}
      <div
        id="printableCertificate"
        className="relative mx-auto w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-amber-300/40 select-none bg-white"
      >
        <div className="relative w-full aspect-[2560/1846]">
          {/* Certificate Template Image */}
          <img
            src="/img/certificate_framepdf.jpg"
            alt="Certificate of Achievement"
            className="w-full h-full object-contain block pointer-events-none"
          />

          {/* 1. Candidate Name (Empty space Y=905..1065, Center Y = 52.5%) */}
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              top: '49.5%',
              left: '15.0%',
              width: '70.0%',
              height: '6.0%',
            }}
          >
            <span className="font-hindi font-black text-slate-950 tracking-wide text-base sm:text-2xl md:text-3xl lg:text-4xl text-center leading-normal px-2 truncate">
              {studentDisplayName}
            </span>
          </div>

          {/* 2. Candidate Class (Underline X = 33.0%..44.9%, Width = 11.9%, Y = 69.9%) */}
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              top: '67.0%',
              left: '33.0%',
              width: '11.9%',
              height: '3.6%',
            }}
          >
            <span className="font-hindi font-bold text-slate-900 text-[11px] sm:text-sm md:text-base lg:text-lg text-center truncate">
              {displayClass}
            </span>
          </div>

          {/* 3. Candidate School (Underline X = 60.9%..72.8%+, Left = 61.0%, Y = 69.9%) */}
          <div
            className="absolute flex items-center justify-start pointer-events-none"
            style={{
              top: '67.0%',
              left: '61.0%',
              width: '23.0%',
              height: '3.6%',
            }}
          >
            <span className="font-hindi font-bold text-slate-900 text-[11px] sm:text-sm md:text-base lg:text-lg text-left truncate pl-1">
              {displaySchool}
            </span>
          </div>

          {/* 4. Score: Marks (Underline X = 19.8%..31.8%, Width = 11.9%, Y = 74.3%) */}
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              top: '71.6%',
              left: '19.8%',
              width: '11.9%',
              height: '3.4%',
            }}
          >
            <span className="font-mono font-black text-slate-950 text-[8px] sm:text-xs md:text-sm lg:text-base whitespace-nowrap">
              {submissionResult.score} / {submissionResult.totalQuestions}
            </span>
          </div>

          {/* 5. Score: Percentage (Underline X = 49.7%..61.6%, Width = 11.9%, Y = 74.3%) */}
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              top: '71.6%',
              left: '49.8%',
              width: '11.9%',
              height: '3.4%',
            }}
          >
            <span className="font-mono font-black text-slate-950 text-[10px] sm:text-xs md:text-sm lg:text-base">
              {submissionResult.percentage}%
            </span>
          </div>

          {/* 6. Score: Result (Underline X = 75.1%..87.0%, Width = 11.9%, Y = 74.3%) */}
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              top: '71.6%',
              left: '75.1%',
              width: '12.0%',
              height: '3.4%',
            }}
          >
            <span
              className={`font-hindi font-black whitespace-nowrap text-center tracking-tight leading-none ${
                (() => {
                  const p = submissionResult.percentage ?? 0;
                  const text = p >= 90 ? (isHindiMode ? 'उत्कृष्ट' : 'Outstanding')
                    : p >= 75 ? (isHindiMode ? 'अति उत्तम' : 'Very Good')
                    : p >= 60 ? (isHindiMode ? 'सराहनीय' : 'Good Effort')
                    : p >= 50 ? (isHindiMode ? 'उत्तीर्ण' : 'Passed')
                    : (isHindiMode ? 'पुनः प्रयास करें' : 'Better Luck Next Time');
                  return text.length > 15
                    ? 'text-[7px] sm:text-[9px] md:text-[10px] lg:text-[11px]'
                    : 'text-[9px] sm:text-xs md:text-sm lg:text-base';
                })()
              } ${
                (submissionResult.percentage ?? 0) >= 50 ? 'text-emerald-800' : 'text-amber-700'
              }`}
            >
              {(() => {
                const p = submissionResult.percentage ?? 0;
                if (p >= 90) return isHindiMode ? 'उत्कृष्ट' : 'Outstanding';
                if (p >= 75) return isHindiMode ? 'अति उत्तम' : 'Very Good';
                if (p >= 60) return isHindiMode ? 'सराहनीय' : 'Good Effort';
                if (p >= 50) return isHindiMode ? 'उत्तीर्ण' : 'Passed';
                return isHindiMode ? 'पुनः प्रयास करें' : 'Better Luck Next Time';
              })()}
            </span>
          </div>

          {/* 7. Issue Date (Underline X = 24.4%..36.3%, Width = 11.9%, Y = 80.9%) */}
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              top: '78.5%',
              left: '24.5%',
              width: '11.9%',
              height: '3.0%',
            }}
          >
            <span className="font-mono font-bold text-slate-900 text-[10px] sm:text-xs md:text-sm lg:text-base whitespace-nowrap text-center">
              {dateStr}
            </span>
          </div>

          {/* 8. Certificate ID (Underline X = 24.4%..36.3%, Width = 11.9%, Y = 85.6%) */}
          <div
            className="absolute flex items-center justify-center pointer-events-none"
            style={{
              top: '83.2%',
              left: '24.5%',
              width: '11.9%',
              height: '3.0%',
            }}
          >
            <span className="font-mono font-bold text-slate-900 text-[9px] sm:text-xs md:text-sm lg:text-base whitespace-nowrap tracking-tight text-center">
              {certId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
