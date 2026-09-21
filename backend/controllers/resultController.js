const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const Student = require('../models/Student');
const Subject = require('../models/Subject');

function toImageSource(filePath) {
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
    const buf = fs.readFileSync(filePath);
    return `data:${mime};base64,${buf.toString('base64')}`;
  }
  return null;
}

async function resolveAttempt(attemptId, studentIdentifier) {
  let attempt = null;
  if (attemptId && mongoose.Types.ObjectId.isValid(attemptId)) {
    attempt = await Attempt.findById(attemptId).lean();
  }
  if (!attempt && attemptId) {
    attempt = await Attempt.findOne({ certificateId: attemptId }).lean();
  }
  if (!attempt && studentIdentifier) {
    attempt = await Attempt.findOne({ studentIdentifier }).sort({ createdAt: -1 }).lean();
  }
  if (!attempt && attemptId) {
    attempt = await Attempt.findOne({ studentIdentifier: attemptId }).sort({ createdAt: -1 }).lean();
  }
  if (!attempt) return null;

  const quiz = attempt.quizId ? await Quiz.findById(attempt.quizId).populate('subjectId', 'name').lean() : null;
  const student = attempt.studentId ? await Student.findById(attempt.studentId).lean() : null;
  return { attempt, quiz, student };
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
    return new Date().toLocaleDateString('en-GB');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET RESULT DETAILS (JSON)
// ─────────────────────────────────────────────────────────────────────────────
const getResult = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const studentIdentifier = req.query.studentIdentifier;
    const data = await resolveAttempt(attemptId, studentIdentifier);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Result not found.' });
    }

    const { attempt, quiz, student } = data;

    res.status(200).json({
      success: true,
      result: {
        attemptId: attempt._id,
        quizId: attempt.quizId,
        quizName: quiz ? quiz.name : 'Assessment Quiz',
        subject: quiz?.subjectId?.name || 'General',
        studentName: attempt.studentName,
        studentIdentifier: attempt.studentIdentifier,
        email: student?.email || '',
        className: attempt.className,
        schoolName: attempt.schoolName,
        score: attempt.score,
        correctAnswers: attempt.correctAnswers ?? attempt.score,
        wrongAnswers: attempt.wrongAnswers ?? (attempt.totalQuestions - attempt.score),
        totalQuestions: attempt.totalQuestions,
        percentage: attempt.percentage,
        result: attempt.result,
        certificateId: attempt.certificateId,
        submittedAt: attempt.submittedAt,
        passingPercentage: quiz ? (quiz.passingPercentage || 50) : 50,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. RESULT PDF (Strictly follows user specifications)
// ─────────────────────────────────────────────────────────────────────────────
const downloadResultPdf = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const studentIdentifier = req.query.studentIdentifier;
    const data = await resolveAttempt(attemptId, studentIdentifier);
    if (!data) return res.status(404).json({ success: false, message: 'Result not found.' });

    const { attempt, quiz, student } = data;
    const passingPct = quiz ? (quiz.passingPercentage || 50) : 50;
    const isPassed = attempt.percentage >= passingPct;

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: { Title: 'Eduline Quiz Result', Author: 'Eduline Publishers' },
    });

    // Register Unicode / Devanagari font (Nirmala UI) for Hindi & English support
    const fontRegularPath = path.join(__dirname, '../assets/fonts/Nirmala.ttf');
    const fontBoldPath = path.join(__dirname, '../assets/fonts/NirmalaB.ttf');
    let hasCustomBold = false;
    let hasCustomRegular = false;
    if (fs.existsSync(fontBoldPath)) {
      doc.registerFont('Nirmala-Bold', fontBoldPath);
      hasCustomBold = true;
    }
    if (fs.existsSync(fontRegularPath)) {
      doc.registerFont('Nirmala', fontRegularPath);
      hasCustomRegular = true;
    }

    const boldFont = hasCustomBold ? 'Nirmala-Bold' : 'Helvetica-Bold';
    const regularFont = hasCustomRegular ? 'Nirmala' : 'Helvetica';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="result-${attempt.certificateId || String(attempt._id).slice(-6)}.pdf"`
    );
    doc.pipe(res);

    const pageWidth = doc.page.width;

    // Header Background
    doc.rect(0, 0, pageWidth, 110).fill('#0f172a');

    // Title: EDULINE / QUIZ RESULT
    doc.fillColor('#f59e0b').fontSize(14).font(boldFont).text('EDULINE', 50, 30);
    doc.fillColor('#ffffff').fontSize(22).font(boldFont).text('QUIZ RESULT', 50, 48);
    doc.fillColor('#94a3b8').fontSize(11).font(regularFont).text('Official Student Assessment Report', 50, 76);

    // Performance Status Badge (Score-dependent, NEVER "Fail")
    let badgeText = 'BETTER LUCK NEXT TIME';
    let badgeColor = '#d97706';
    const pct = attempt.percentage ?? 0;
    if (pct >= 90) {
      badgeText = 'OUTSTANDING';
      badgeColor = '#16a34a';
    } else if (pct >= 75) {
      badgeText = 'VERY GOOD';
      badgeColor = '#16a34a';
    } else if (pct >= 60) {
      badgeText = 'GOOD EFFORT';
      badgeColor = '#0284c7';
    } else if (pct >= passingPct) {
      badgeText = 'PASSED';
      badgeColor = '#0284c7';
    } else {
      badgeText = 'BETTER LUCK NEXT TIME';
      badgeColor = '#d97706';
    }

    const badgeW = 160;
    doc.roundedRect(pageWidth - badgeW - 40, 38, badgeW, 36, 8).fill(badgeColor);
    doc.fillColor('#ffffff').fontSize(11).font(boldFont)
      .text(badgeText, pageWidth - badgeW - 40, 50, { width: badgeW, align: 'center' });

    let y = 135;

    // Candidate Information Section
    doc.fillColor('#0f172a').fontSize(12).font(boldFont).text('Candidate & Quiz Information', 50, y);
    y += 18;
    doc.moveTo(50, y).lineTo(pageWidth - 50, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    y += 12;

    const infoRows = [
      ['Student Name', attempt.studentName || 'Student', 'Quiz Name', quiz ? quiz.name : 'N/A'],
      ['Student Email', student?.email || 'N/A', 'Subject', quiz?.subjectId?.name || 'General'],
      ['School', attempt.schoolName || 'N/A', 'Class', attempt.className || 'N/A'],
      ['Submission Date', formatDate(attempt.submittedAt), 'Remarks', badgeText],
    ];

    infoRows.forEach(([lbl1, val1, lbl2, val2]) => {
      doc.fillColor('#64748b').fontSize(9.5).font(regularFont).text(lbl1, 50, y, { width: 95 });
      doc.fillColor('#0f172a').fontSize(9.5).font(boldFont).text(`:  ${val1}`, 145, y, { width: 160, lineBreak: false, ellipsis: true });

      doc.fillColor('#64748b').fontSize(9.5).font(regularFont).text(lbl2, 315, y, { width: 85 });
      doc.fillColor('#0f172a').fontSize(9.5).font(boldFont).text(`:  ${val2}`, 400, y, { width: pageWidth - 400 - 45, lineBreak: false, ellipsis: true });
      y += 22;
    });

    y += 15;

    // Performance Metrics Section
    doc.fillColor('#0f172a').fontSize(12).font(boldFont).text('Performance Evaluation', 50, y);
    y += 18;
    doc.moveTo(50, y).lineTo(pageWidth - 50, y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    y += 14;

    const cardWidth = (pageWidth - 100 - 30) / 4;
    const cardHeight = 65;

    drawStatCard(doc, 50, y, cardWidth, cardHeight, '#f8fafc', '#0f172a', 'Total Questions', String(attempt.totalQuestions), regularFont, boldFont);
    drawStatCard(doc, 50 + cardWidth + 10, y, cardWidth, cardHeight, '#f0fdf4', '#15803d', 'Correct Answers', String(attempt.correctAnswers ?? attempt.score), regularFont, boldFont);
    drawStatCard(doc, 50 + (cardWidth + 10) * 2, y, cardWidth, cardHeight, '#fef2f2', '#b91c1c', 'Wrong Answers', String(attempt.wrongAnswers ?? (attempt.totalQuestions - attempt.score)), regularFont, boldFont);
    drawStatCard(doc, 50 + (cardWidth + 10) * 3, y, cardWidth, cardHeight, isPassed ? '#f0fdf4' : '#fef2f2', isPassed ? '#15803d' : '#b91c1c', 'Score', `${attempt.percentage}%`, regularFont, boldFont);

    y += cardHeight + 25;

    // Progress Bar
    doc.roundedRect(50, y, pageWidth - 100, 14, 7).fill('#e2e8f0');
    const fillWidth = Math.max(14, (attempt.percentage / 100) * (pageWidth - 100));
    doc.roundedRect(50, y, fillWidth, 14, 7).fill(isPassed ? '#16a34a' : '#dc2626');

    y += 26;
    doc.fillColor('#64748b').fontSize(10).font(regularFont)
      .text(`Score: ${attempt.score} / ${attempt.totalQuestions} (${attempt.percentage}%)  |  Passing Requirement: ${passingPct}%`, 50, y);

    // Footer
    doc.rect(50, doc.page.height - 70, pageWidth - 100, 1).fill('#cbd5e1');
    doc.fillColor('#94a3b8').fontSize(9).font(regularFont)
      .text('EDULINE PUBLISHERS — Empowering Young Minds With Educational Excellence', 50, doc.page.height - 55, { align: 'center', width: pageWidth - 100 });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. CERTIFICATE PDF (Strictly follows certificate_framepdf.jpg alignment)
// ─────────────────────────────────────────────────────────────────────────────
const downloadCertificatePdf = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const studentIdentifier = req.query.studentIdentifier;
    const data = await resolveAttempt(attemptId, studentIdentifier);
    if (!data) return res.status(404).json({ success: false, message: 'Result not found.' });

    const { attempt, quiz, student } = data;
    const certYear = new Date(attempt.submittedAt || Date.now()).getFullYear();
    const certId = attempt.certificateId || `EDU-${certYear}-${String(attempt._id).slice(-6).toUpperCase()}`;
    const quizName = quiz ? quiz.name : 'Academic Assessment';
    const subjectName = quiz?.subjectId?.name || 'General';
    const issueDate = formatDate(attempt.submittedAt);

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

    // 1. Draw Official Certificate Template Frame as Background
    const framePath = fs.existsSync(path.join(__dirname, '../assets/certificate_framepdf.jpg'))
      ? path.join(__dirname, '../assets/certificate_framepdf.jpg')
      : path.join(__dirname, '../assets/certificate_framepdf.jpeg');

    if (fs.existsSync(framePath)) {
      doc.image(framePath, 0, 0, { width: W, height: H });
    } else {
      // Fallback clean border
      doc.rect(0, 0, W, H).fill('#fdfbf7');
      doc.rect(20, 20, W - 40, H - 40).lineWidth(3).strokeColor('#b45309').stroke();
    }

    // 2. Register Unicode/Devanagari Font (Nirmala.ttf)
    const fontRegularPath = path.join(__dirname, '../assets/fonts/Nirmala.ttf');
    const fontBoldPath = path.join(__dirname, '../assets/fonts/NirmalaB.ttf');
    let hasCustomFont = false;
    if (fs.existsSync(fontBoldPath)) {
      doc.registerFont('Nirmala-Bold', fontBoldPath);
      hasCustomFont = true;
    }
    if (fs.existsSync(fontRegularPath)) {
      doc.registerFont('Nirmala', fontRegularPath);
    }

    const boldFont = hasCustomFont ? 'Nirmala-Bold' : 'Helvetica-Bold';

    const studentDisplayName = attempt.studentName || `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Student';
    const rawClass = attempt.className || student?.class || student?.className || '';
    const displayClass = rawClass ? (rawClass.replace(/^(class|कक्षा)\s*/i, '').trim() || rawClass) : '---';
    const displaySchool = attempt.schoolName || student?.schoolName || 'विद्यालय';

    // 3. Candidate Name (Empty space Y=905..1065, Center Y = 52.5% = 312 pt, Centered over W)
    doc.fillColor('#0F172A').font(boldFont).fontSize(24)
      .text(studentDisplayName, 0, H * 0.500, { align: 'center', width: W });

    // 4. Candidate Class (Underline Y=1290/1846 = 69.88%, Underline X=845..1150 = 33.01%..44.92%, Width=11.91%)
    doc.fillColor('#0F172A').font(boldFont).fontSize(13.5)
      .text(displayClass, W * 0.330, H * 0.678, { align: 'center', width: W * 0.119 });

    // 5. Candidate School (Underline Y=1290/1846 = 69.88%, Underline X=1559..1864 = 60.90%..72.81%, Width=22%)
    doc.fillColor('#0F172A').font(boldFont).fontSize(12.5)
      .text(displaySchool, W * 0.610, H * 0.678, { align: 'left', width: W * 0.220, lineBreak: false, ellipsis: true });

    // 6. Score: Marks (Underline Y=1372/1846 = 74.32%, Underline X=508..813 = 19.84%..31.76%, Width=11.91%)
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(13.5)
      .text(`${attempt.score} / ${attempt.totalQuestions}`, W * 0.198, H * 0.722, { align: 'center', width: W * 0.119 });

    // 7. Score: Percentage (Underline Y=1372/1846 = 74.32%, Underline X=1273..1578 = 49.73%..61.64%, Width=11.91%)
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(13.5)
      .text(`${attempt.percentage}%`, W * 0.498, H * 0.722, { align: 'center', width: W * 0.119 });

    // 8. Result Remark (Underline Y=1372/1846 = 74.32%, Underline X=1922..2228 = 75.08%..87.03%, Width=11.95%)
    const pctVal = attempt.percentage ?? 0;
    let displayResult = '';
    let resultColor = '#15803d';
    if (pctVal >= 90) {
      displayResult = 'Outstanding';
      resultColor = '#15803d';
    } else if (pctVal >= 75) {
      displayResult = 'Very Good';
      resultColor = '#15803d';
    } else if (pctVal >= 60) {
      displayResult = 'Good Effort';
      resultColor = '#0284c7';
    } else if (pctVal >= 50) {
      displayResult = 'Passed';
      resultColor = '#0284c7';
    } else {
      displayResult = 'Better Luck Next Time';
      resultColor = '#d97706';
    }
    const resultFontSize = displayResult.length > 15 ? 9.5 : displayResult.length > 10 ? 10.5 : 12;
    doc.fillColor(resultColor).font(boldFont).fontSize(resultFontSize)
      .text(displayResult, W * 0.751, H * 0.723, { align: 'center', width: W * 0.120, lineBreak: false });

    // 9. Date (Underline Y=1494/1846 = 80.93%, Underline X=625..930 = 24.41%..36.33%, Width=11.91%)
    doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(10.5)
      .text(issueDate, W * 0.245, H * 0.792, { align: 'center', width: W * 0.119 });

    // 10. Certificate ID (Underline Y=1580/1846 = 85.59%, Underline X=624..929 = 24.38%..36.29%, Width=11.91%)
    doc.fillColor('#1E293B').font('Helvetica-Bold').fontSize(10)
      .text(certId, W * 0.245, H * 0.838, { align: 'center', width: W * 0.119 });

    doc.end();
  } catch (error) {
    next(error);
  }
};

function drawStatCard(doc, x, y, w, h, bg, textColor, label, value, regularFont = 'Helvetica', boldFont = 'Helvetica-Bold') {
  doc.roundedRect(x, y, w, h, 6).fill(bg);
  doc.fillColor('#64748b').fontSize(9).font(regularFont).text(label, x, y + 10, { width: w, align: 'center' });
  doc.fillColor(textColor).fontSize(18).font(boldFont).text(value, x, y + 26, { width: w, align: 'center' });
}

module.exports = {
  getResult,
  downloadResultPdf,
  downloadCertificatePdf,
};
