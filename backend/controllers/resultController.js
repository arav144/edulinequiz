const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const Student = require('../models/Student');
const Subject = require('../models/Subject');

// ─── Helper: Resolve attempt + quiz + student ────────────────────────────────
async function resolveAttempt(attemptId) {
  const attempt = await Attempt.findById(attemptId).lean();
  if (!attempt) return null;
  const quiz = await Quiz.findById(attempt.quizId).populate('subjectId', 'name').lean();
  const student = await Student.findById(attempt.studentId).lean();
  return { attempt, quiz, student };
}

// @desc  Get result for a specific attempt (student-facing, secured by identifier)
// @route GET /api/results/:attemptId?studentIdentifier=XXX
const getResult = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const rawId = req.query.studentIdentifier;

    if (!rawId) {
      return res.status(400).json({ success: false, message: 'Student identifier required.' });
    }

    const data = await resolveAttempt(attemptId);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Result not found.' });
    }

    const { attempt, quiz, student } = data;

    // Verify ownership
    if (attempt.studentIdentifier !== rawId.trim().toUpperCase()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({
      success: true,
      result: {
        attemptId: attempt._id,
        quizId: attempt.quizId,
        quizName: quiz ? quiz.name : 'Quiz',
        studentName: attempt.studentName,
        studentIdentifier: attempt.studentIdentifier,
        className: attempt.className,
        section: attempt.section,
        schoolName: attempt.schoolName,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        percentage: attempt.percentage,
        result: attempt.result,
        certificateId: attempt.certificateId,
        submittedAt: attempt.submittedAt,
        passingPercentage: quiz ? (quiz.passingPercentage || 50) : 50,
        review: attempt.review || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Generate and download Result Card PDF
// @route GET /api/results/:attemptId/pdf?studentIdentifier=XXX
const downloadResultPdf = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const rawId = req.query.studentIdentifier;

    // Admin download — no identifier check
    const isAdminDownload = req.query.adminDownload === 'true';

    if (!isAdminDownload && !rawId) {
      return res.status(400).json({ success: false, message: 'Student identifier required.' });
    }

    const data = await resolveAttempt(attemptId);
    if (!data) return res.status(404).json({ success: false, message: 'Result not found.' });

    const { attempt, quiz } = data;

    if (!isAdminDownload && attempt.studentIdentifier !== rawId.trim().toUpperCase()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const passingPct = quiz ? (quiz.passingPercentage || 50) : 50;
    const isPassed = attempt.percentage >= passingPct;

    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: 'Result Card', Author: 'Eduline' } });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="result-${attempt.certificateId || attempt.studentIdentifier}.pdf"`);
    doc.pipe(res);

    // ─── Header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 110).fill('#1e1b4b');
    doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('EDULINE PUBLISHERS', 50, 30);
    doc.fillColor('#a5b4fc').fontSize(11).font('Helvetica').text('QUIZ ASSESSMENT RESULT CARD', 50, 60);

    // Status Badge in Header
    const badgeBg = isPassed ? '#15803d' : '#b91c1c';
    const badgeText = isPassed ? 'PASSED' : 'FAILED';
    doc.roundedRect(doc.page.width - 150, 35, 100, 35, 6).fill(badgeBg);
    doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold')
      .text(badgeText, doc.page.width - 150, 46, { width: 100, align: 'center' });

    // ─── Quiz & Candidate Details ─────────────────────────────────────────────
    let y = 135;

    doc.fillColor('#1e1b4b').fontSize(13).font('Helvetica-Bold').text('Assessment Details', 50, y);
    y += 18;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    y += 10;

    const detailsLeft = [
      ['Student Name', attempt.studentName],
      ['Student ID', attempt.studentIdentifier],
      ['Class & Section', `${attempt.className || 'N/A'}${attempt.section ? ` - ${attempt.section}` : ''}`],
      ['School', attempt.schoolName || 'N/A'],
    ];

    const detailsRight = [
      ['Quiz Name', quiz ? quiz.name : 'N/A'],
      ['Subject', (quiz && quiz.subjectId) ? quiz.subjectId.name : 'N/A'],
      ['Date', formatDate(attempt.submittedAt)],
      ['Result Status', attempt.result],
    ];

    detailsLeft.forEach(([label, val], i) => {
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(label, 50, y + i * 20);
      doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(`:  ${val}`, 160, y + i * 20);
    });

    detailsRight.forEach(([label, val], i) => {
      doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(label, 320, y + i * 20);
      doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(`:  ${val}`, 410, y + i * 20);
    });

    y += 95;

    // ─── Score Summary Cards ─────────────────────────────────────────────────
    doc.fillColor('#1e1b4b').fontSize(13).font('Helvetica-Bold').text('Score Summary', 50, y);
    y += 18;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    y += 12;

    const cardW = (doc.page.width - 100 - 30) / 4;
    const cardH = 65;

    drawCard(doc, 50, y, cardW, cardH, '#f8fafc', '#1e293b', 'Total Questions', String(attempt.totalQuestions));
    drawCard(doc, 50 + (cardW + 10), y, cardW, cardH, '#f0fdf4', '#15803d', 'Correct Answers', String(attempt.score));
    drawCard(doc, 50 + (cardW + 10) * 2, y, cardW, cardH, '#fef2f2', '#b91c1c', 'Wrong / Missed', String(attempt.totalQuestions - attempt.score));
    drawCard(doc, 50 + (cardW + 10) * 3, y, cardW, cardH, isPassed ? '#f0fdf4' : '#fef2f2', isPassed ? '#15803d' : '#b91c1c', 'Score Percentage', `${attempt.percentage}%`);

    y += cardH + 20;

    // ─── Visual Score Bar ─────────────────────────────────────────────────────
    const barW = doc.page.width - 100;
    const barY = y;
    doc.roundedRect(50, barY, barW, 16, 8).fill('#e2e8f0');
    const fillW = Math.max(16, (attempt.percentage / 100) * barW);
    doc.roundedRect(50, barY, fillW, 16, 8).fill(isPassed ? '#22c55e' : '#ef4444');

    doc.fillColor('#64748b').fontSize(9).font('Helvetica')
      .text('0%', 50, barY + 20);
    doc.fillColor('#64748b').fontSize(9).font('Helvetica')
      .text('100%', 0, barY + 20, { align: 'right', width: doc.page.width - 50 });
    doc.fillColor('#1e293b').fontSize(13).font('Helvetica-Bold')
      .text(`${attempt.percentage}%`, 0, barY + 24, { align: 'right', width: doc.page.width - 50 });

    // ─── Passing Criteria ─────────────────────────────────────────────────────
    doc.fillColor('#64748b').fontSize(10).font('Helvetica')
      .text(`Passing Criteria: ${passingPct}%`, 50, barY + 54);

    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc  Generate and download Certificate PDF
// @route GET /api/results/:attemptId/certificate?studentIdentifier=XXX
const downloadCertificatePdf = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const rawId = req.query.studentIdentifier;

    // Admin download — no identifier check
    const isAdminDownload = req.query.adminDownload === 'true';

    const data = await resolveAttempt(attemptId);
    if (!data) return res.status(404).json({ success: false, message: 'Result not found.' });

    const { attempt, quiz } = data;

    if (!isAdminDownload && rawId && attempt.studentIdentifier && attempt.studentIdentifier.trim().toUpperCase() !== rawId.trim().toUpperCase()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const passingPct = quiz ? (quiz.passingPercentage || 50) : 50;
    const isPassed = attempt.percentage >= passingPct;

    const certYear = new Date(attempt.submittedAt || Date.now()).getFullYear();
    const certId = attempt.certificateId || `EDU-${certYear}-${String(attempt._id).slice(-6).toUpperCase()}`;

    const isHindi = (quiz?.language === 'hi') ||
      (quiz?.subject && (quiz.subject.toLowerCase().includes('hindi') || quiz.subject.includes('हिंदी'))) ||
      (quiz?.name && (quiz.name.toLowerCase().includes('hindi') || quiz.name.includes('हिंदी')));

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 0,
      info: { Title: 'Certificate of Achievement', Author: 'Eduline Publishers' },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificate-${certId}.pdf"`);
    doc.pipe(res);


    const W = doc.page.width;  // 841.89 pt
    const H = doc.page.height; // 595.28 pt

    // ─── Fonts Setup ───────────────────────────────────────────────────────────
    const fontRegularPath = path.join(__dirname, '../assets/fonts/Nirmala.ttf');
    const fontBoldPath = path.join(__dirname, '../assets/fonts/NirmalaB.ttf');
    const hasIndicFont = fs.existsSync(fontRegularPath) && fs.existsSync(fontBoldPath);

    if (hasIndicFont) {
      doc.registerFont('CustomFont', fontRegularPath);
      doc.registerFont('CustomFont-Bold', fontBoldPath);
    }

    const fRegular = hasIndicFont ? 'CustomFont' : 'Helvetica';
    const fBold = hasIndicFont ? 'CustomFont-Bold' : 'Helvetica-Bold';

    // ─── 1. Certificate Frame Background ──────────────────────────────────────
    const framePdfPath = path.join(__dirname, '../assets/certificate_framepdf.jpeg');
    if (fs.existsSync(framePdfPath)) {
      doc.image(framePdfPath, 0, 0, { width: W, height: H });

      // Dynamic typed values overlaid on exact underlines of certificate_framepdf.jpeg:
      // 1. Candidate Name (Centered)
      const candidateName = attempt.studentName || 'Student';
      doc.fillColor('#0F172A').fontSize(22).font(fBold)
        .text(candidateName, 0, 252, { align: 'center', width: W });

      // 2. Class
      const classVal = attempt.className || 'Class 8';
      doc.fillColor('#0F172A').fontSize(11).font(fBold)
        .text(classVal, 185, 372, { width: 95, align: 'center' });

      // 3. School / Vidyalay
      const schoolVal = attempt.schoolName || 'ABC Public School';
      doc.fillColor('#0F172A').fontSize(11).font(fBold)
        .text(schoolVal, 470, 372, { width: 255, align: 'left' });

      // 4. Score Box: Marks
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold')
        .text(`${attempt.score} / ${attempt.totalQuestions}`, 178, 430, { width: 95, align: 'center' });

      // 5. Score Box: Percentage
      doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold')
        .text(`${attempt.percentage}`, 392, 430, { width: 90, align: 'center' });

      // 6. Score Box: Result
      const resValue = isPassed ? (isHindi ? 'उत्तीर्ण (Pass)' : 'Pass') : (isHindi ? 'अनुत्तीर्ण (Fail)' : 'Fail');
      doc.fillColor(isPassed ? '#15803D' : '#B91C1C').fontSize(10).font(fBold)
        .text(resValue, 614, 430, { width: 95, align: 'center' });

      // 7. Date
      const dateStr = formatDate(attempt.submittedAt || new Date().toISOString().slice(0, 10));
      doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold')
        .text(dateStr, 258, 484, { width: 95, align: 'center' });

      // 8. Certificate ID
      doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold')
        .text(certId, 242, 510, { width: 160, align: 'left' });

      doc.end();
      return;
    }

    const framePath = path.join(__dirname, '../assets/certificate_frame.jpg');
    if (fs.existsSync(framePath)) {
      doc.image(framePath, 0, 0, { width: W, height: H });
    } else {
      doc.rect(0, 0, W, H).fill('#FDFBF7');
      doc.rect(20, 20, W - 40, H - 40).lineWidth(4).strokeColor('#C59B27').stroke();
      doc.rect(26, 26, W - 52, H - 52).lineWidth(1).strokeColor('#C59B27').stroke();
    }

    // ─── 2. Logo Header (Matches Reference Image) ──────────────────────────────
    const logoPath = path.join(__dirname, '../assets/logo-eduline-publishers.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, (W - 190) / 2, 42, { width: 190 });
    } else {
      doc.fillColor('#1E3A8A').fontSize(22).font('Helvetica-Bold')
        .text('Eduline Publishers', 0, 45, { align: 'center', width: W });
    }

    // ─── 3. Main Certificate Title (Arched Maroon in Reference Image) ─────────
    const titleText = isHindi ? 'उपलब्धि प्रमाण-पत्र' : 'CERTIFICATE OF ACHIEVEMENT';
    doc.fillColor('#7A1818').fontSize(26).font(fBold)
      .text(titleText, 0, 85, { align: 'center', width: W });

    // ─── 4. Quiz Subtitle ────────────────────────────────────────────────────
    const quizTitle = quiz?.name || (isHindi ? 'हिंदी दिवस क्विज़' : 'Assessment Quiz');
    doc.fillColor('#1E293B').fontSize(16).font(fBold)
      .text(quizTitle, 0, 122, { align: 'center', width: W });

    // ─── 5. Body Salutation ──────────────────────────────────────────────────
    const salutation = isHindi ? 'यह प्रमाण-पत्र गर्वपूर्वक' : 'This certificate is proudly presented to';
    doc.fillColor('#475569').fontSize(12).font(fBold)
      .text(salutation, 0, 150, { align: 'center', width: W });

    // ─── 6. Student Name & Underline ──────────────────────────────────────────
    const candidateName = attempt.studentName || 'Student';
    doc.fillColor('#0F172A').fontSize(22).font(fBold)
      .text(candidateName, 0, 172, { align: 'center', width: W });
    doc.moveTo(W / 2 - 160, 202).lineTo(W / 2 + 160, 202).lineWidth(1).strokeColor('#94A3B8').stroke();

    // ─── 7. Body Statement ───────────────────────────────────────────────────
    const statement = isHindi
      ? `को ${quizTitle} सफलतापूर्वक पूर्ण करने हेतु प्रदान किया जाता है।`
      : `for successfully completing the ${quizTitle}.`;
    doc.fillColor('#334155').fontSize(12).font(fRegular)
      .text(statement, 0, 214, { align: 'center', width: W });

    // ─── 8. Candidate Class & School Row (Two Columns with Underlines) ───────
    const rowY = 250;
    const classVal = attempt.className ? `${attempt.className}${attempt.section ? ` - ${attempt.section}` : ''}` : 'Class 8 - A';
    const schoolVal = attempt.schoolName || 'ABC Public School';

    const classLabel = isHindi ? 'कक्षा:' : 'Class:';
    const schoolLabel = isHindi ? 'विद्यालय:' : 'School:';

    doc.fillColor('#1E293B').fontSize(11).font(fBold).text(classLabel, 120, rowY);
    doc.fillColor('#0F172A').fontSize(11).font(fBold).text(classVal, 160, rowY);
    doc.moveTo(155, rowY + 14).lineTo(310, rowY + 14).lineWidth(0.8).strokeColor('#CBD5E1').stroke();

    doc.fillColor('#1E293B').fontSize(11).font(fBold).text(schoolLabel, W - 380, rowY);
    doc.fillColor('#0F172A').fontSize(11).font(fBold).text(schoolVal, W - 325, rowY);
    doc.moveTo(W - 330, rowY + 14).lineTo(W - 120, rowY + 14).lineWidth(0.8).strokeColor('#CBD5E1').stroke();

    // ─── 9. Score Table Box (Matches Reference Image) ────────────────────────
    const boxY = 285;
    const boxW = W - 240;
    const colW = boxW / 3;

    doc.roundedRect(120, boxY, boxW, 42, 6).lineWidth(1).strokeColor('#C59B27').fillAndStroke('#FFFDF9', '#C59B27');

    const scoreLabel = isHindi ? 'अंक: ' : 'Score: ';
    const pctLabel = isHindi ? 'प्रतिशत: ' : 'Percentage: ';
    const resLabel = isHindi ? 'परिणाम: ' : 'Result: ';
    const resValue = isPassed ? (isHindi ? 'उत्तीर्ण (Pass)' : 'Pass') : (isHindi ? 'अनुत्तीर्ण (Fail)' : 'Fail');

    doc.fillColor('#1E293B').fontSize(11).font(fBold)
      .text(scoreLabel, 120, boxY + 14, { width: colW, align: 'center' });
    doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold')
      .text(`${attempt.score} / ${attempt.totalQuestions}`, 120 + 35, boxY + 14, { width: colW, align: 'center' });

    doc.fillColor('#1E293B').fontSize(11).font(fBold)
      .text(pctLabel, 120 + colW, boxY + 14, { width: colW, align: 'center' });
    doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold')
      .text(`${attempt.percentage}%`, 120 + colW + 40, boxY + 14, { width: colW, align: 'center' });

    doc.fillColor('#1E293B').fontSize(11).font(fBold)
      .text(resLabel, 120 + colW * 2, boxY + 14, { width: colW, align: 'center' });
    doc.fillColor(isPassed ? '#15803D' : '#B91C1C').fontSize(11).font(fBold)
      .text(resValue, 120 + colW * 2 + 45, boxY + 14, { width: colW, align: 'center' });

    // ─── 10. Footer Left & Right (Issue Date, Cert ID, Signatures) ───────────
    const footY = 355;
    const dateLabel = isHindi ? 'जारी करने की तिथि:' : 'Issue Date:';
    const certIdLabel = isHindi ? 'प्रमाण-पत्र आईडी:' : 'Certificate ID:';
    const dateStr = formatDate(attempt.submittedAt || new Date().toISOString().slice(0, 10));

    doc.fillColor('#1E293B').fontSize(10).font(fBold).text(dateLabel, 120, footY);
    doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold').text(dateStr, 225, footY);
    doc.moveTo(220, footY + 12).lineTo(310, footY + 12).lineWidth(0.8).strokeColor('#CBD5E1').stroke();

    doc.fillColor('#1E293B').fontSize(10).font(fBold).text(certIdLabel, 120, footY + 24);
    doc.fillColor('#334155').fontSize(10).font('Helvetica-Bold').text(certId, 225, footY + 24);
    doc.moveTo(220, footY + 36).lineTo(340, footY + 36).lineWidth(0.8).strokeColor('#CBD5E1').stroke();

    // Right Signatures
    doc.moveTo(W - 280, footY + 15).lineTo(W - 120, footY + 15).lineWidth(0.8).strokeColor('#475569').stroke();
    const signTitle = isHindi ? 'अधिकृत हस्ताक्षरकर्ता' : 'Authorized Signatory';
    const signSub = isHindi ? 'मूल्यांकन निदेशक' : 'Evaluation Director';
    doc.fillColor('#0F172A').fontSize(10).font(fBold).text(signTitle, W - 280, footY + 22, { align: 'center', width: 160 });
    doc.fillColor('#64748B').fontSize(9).font(fRegular).text(signSub, W - 280, footY + 36, { align: 'center', width: 160 });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function drawCard(doc, x, y, w, h, bg, textColor, label, value) {
  doc.rect(x, y, w, h).fill(bg);
  doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(label, x, y + 10, { width: w, align: 'center' });
  doc.fillColor(textColor).fontSize(22).font('Helvetica-Bold').text(value, x, y + 26, { width: w, align: 'center' });
}

function drawCertStat(doc, x, y, w, label, value, valueColor = '#1e1b4b') {
  doc.fillColor('#64748b').fontSize(10).font('Helvetica').text(label, x, y, { width: w, align: 'center' });
  doc.fillColor(valueColor).fontSize(22).font('Helvetica-Bold').text(value, x, y + 16, { width: w, align: 'center' });
}

function formatDate(val) {
  if (!val) val = new Date();
  try {
    const d = (val instanceof Date) ? val : new Date(val);
    if (isNaN(d.getTime())) {
      const parts = String(val).slice(0, 10).split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return String(val).slice(0, 10);
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '10/09/2026';
  }
}

function formatDateTime(dt) {
  if (!dt) return 'N/A';
  try {
    return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return String(dt); }
}

module.exports = { getResult, downloadResultPdf, downloadCertificatePdf };

