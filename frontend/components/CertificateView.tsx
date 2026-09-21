'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Download, ArrowLeft, Image as ImageIcon, Loader2 } from 'lucide-react';
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
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  // Draw certificate on high-resolution canvas
  const renderCertificateOnCanvas = async (targetCanvas: HTMLCanvasElement) => {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

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
    targetCanvas.width = W;
    targetCanvas.height = H;

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

    // 1. Candidate Name (Center X = 50%, Center Y = 52.5%)
    let curNameSize = nameFontSize;
    ctx.font = `bold ${curNameSize}px "Plus Jakarta Sans", "Noto Sans Devanagari", "Segoe UI", sans-serif`;
    const maxNameW = W * 0.58;
    while (ctx.measureText(studentDisplayName).width > maxNameW && curNameSize > 30) {
      curNameSize -= 3;
      ctx.font = `bold ${curNameSize}px "Plus Jakarta Sans", "Noto Sans Devanagari", "Segoe UI", sans-serif`;
    }
    ctx.fillText(studentDisplayName, W * 0.50, H * 0.525);

    // 2. Class (Center X = 39.0%, Y = 68.6%)
    ctx.font = `bold ${classFontSize}px "Plus Jakarta Sans", "Noto Sans Devanagari", "Segoe UI", sans-serif`;
    ctx.fillText(displayClass, W * 0.390, H * 0.686);

    // 3. School / Vidyalay (Left X = 61.0%, Y = 68.6%)
    ctx.textAlign = 'left';
    let curSchoolSize = schoolFontSize;
    ctx.font = `bold ${curSchoolSize}px "Plus Jakarta Sans", "Noto Sans Devanagari", "Segoe UI", sans-serif`;
    const maxSchoolW = W * 0.22;
    while (ctx.measureText(displaySchool).width > maxSchoolW && curSchoolSize > 20) {
      curSchoolSize -= 2;
      ctx.font = `bold ${curSchoolSize}px "Plus Jakarta Sans", "Noto Sans Devanagari", "Segoe UI", sans-serif`;
    }
    ctx.fillText(displaySchool, W * 0.610, H * 0.686);

    // 4. Score Box: Marks (Center X = 25.8%, Y = 73.0%)
    ctx.textAlign = 'center';
    ctx.font = `bold ${marksFontSize}px "JetBrains Mono", "Plus Jakarta Sans", monospace`;
    ctx.fillText(`${submissionResult.score} / ${submissionResult.totalQuestions}`, W * 0.258, H * 0.730);

    // 5. Score Box: Percentage (Center X = 55.7%, Y = 73.0%)
    ctx.font = `bold ${percentageFontSize}px "JetBrains Mono", "Plus Jakarta Sans", monospace`;
    ctx.fillText(`${submissionResult.percentage}%`, W * 0.557, H * 0.730);

    // 6. Score Box: Result (Center X = 81.1%, Y = 73.0%)
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

    // 7. Date (Center X = 30.4%, Y = 79.8%)
    ctx.fillStyle = '#1E293B';
    ctx.textAlign = 'center';
    ctx.font = `bold ${dateFontSize}px "JetBrains Mono", "Plus Jakarta Sans", monospace`;
    ctx.fillText(dateStr, W * 0.304, H * 0.798);

    // 8. Certificate ID (Center X = 30.4%, Y = 84.5%)
    ctx.font = `bold ${certIdFontSize}px "JetBrains Mono", "Plus Jakarta Sans", monospace`;
    ctx.fillText(certId, W * 0.304, H * 0.845);
  };

  // Render to on-screen canvas when mounted or updated
  useEffect(() => {
    let active = true;
    if (canvasRef.current) {
      renderCertificateOnCanvas(canvasRef.current)
        .then(() => {
          if (active) setCanvasReady(true);
        })
        .catch((err) => {
          console.error('Canvas render error:', err);
        });
    }
    return () => {
      active = false;
    };
  }, [
    studentDisplayName,
    displayClass,
    displaySchool,
    submissionResult.score,
    submissionResult.totalQuestions,
    submissionResult.percentage,
    dateStr,
    certId,
    isHindiMode,
  ]);

  // Client-side high-resolution Certificate Image download
  const handleDownloadImage = async () => {
    try {
      setDownloadingImg(true);
      if (!canvasRef.current) {
        throw new Error('Certificate preview not ready yet');
      }
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
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

        {/* DESKTOP VIEW (>= sm): Full Action Toolbar */}
        <div className="hidden sm:flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Download PDF Button */}
            <button
              type="button"
              onClick={() => onDownloadPdf('certificate')}
              disabled={downloadingPdf === 'certificate'}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black text-xs shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-60 select-none"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>
                {downloadingPdf === 'certificate' ? 'Downloading PDF...' : 'Download Certificate (PDF)'}
              </span>
            </button>

            {/* Download Image Button */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={downloadingImg}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2d7995] to-[#1f576c] hover:from-[#24677f] hover:to-[#174454] text-white font-black text-xs shadow-md shadow-[#2d7995]/20 hover:shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-60 select-none"
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

      {/* Framed Certificate of Achievement */}
      <div
        id="printableCertificate"
        className="relative mx-auto w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-amber-300/40 select-none bg-white"
      >
        <div className="relative w-full aspect-[2560/1846] bg-slate-50 flex items-center justify-center">
          {!canvasReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50/90 z-10">
              <Loader2 className="w-8 h-8 text-[#2d7995] animate-spin" />
              <span className="text-xs font-bold text-slate-500">Loading Certificate...</span>
            </div>
          )}
          {/* Live Full-Resolution Pixel-Perfect Canvas */}
          <canvas
            ref={canvasRef}
            className={`w-full h-auto block rounded-2xl transition-opacity duration-300 ${
              canvasReady ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
