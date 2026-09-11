const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Student = require('../models/Student');
const Attempt = require('../models/Attempt');
const Subject = require('../models/Subject');

// Generate unique certificate ID: EDU-YYYY-NNNNNN
const generateCertificateId = async () => {
  const year = new Date().getFullYear();
  const count = await Attempt.countDocuments();
  const seq = String(count + 1).padStart(6, '0');
  return `EDU-${year}-${seq}`;
};

// @desc    Get all available quizzes for students (Published status)
// @route   GET /api/quizzes/available
const getAvailableQuizzes = async (req, res, next) => {
  try {
    const studentIdentifier = req.query.studentIdentifier
      ? req.query.studentIdentifier.trim().toUpperCase()
      : null;

    // Fetch all quizzes to support Ongoing, Upcoming, and Past tabs
    const allQuizzes = await Quiz.find({})
      .populate('subjectId', 'name')
      .lean();

    // If studentIdentifier provided, fetch their recorded attempts
    let studentAttemptMap = {};
    if (studentIdentifier) {
      const student = await Student.findOne({ studentIdentifier });
      if (student) {
        const attempts = await Attempt.find({ studentId: student._id }).lean();
        attempts.forEach((att) => {
          studentAttemptMap[att.quizId.toString()] = {
            attemptId: att._id,
            score: att.score,
            totalQuestions: att.totalQuestions,
            percentage: att.percentage,
            result: att.result,
            certificateId: att.certificateId,
            submittedAt: att.submittedAt,
          };
        });
      }
    }

    const now = new Date();

    // Process quizzes with real-time dynamic date-based status calculation, dates, and timing
    const processedQuizzes = allQuizzes.map((quiz) => {
      const quizIdStr = quiz._id.toString();
      const existingAttempt = studentAttemptMap[quizIdStr] || null;

      // Real-time automatic schedule calculation based on current server date & time:
      // 1. If endDate has passed (now > endDate) or status is Closed -> Past
      // 2. If startDate is in future (now < startDate) -> Upcoming
      // 3. If within date range (startDate <= now <= endDate) -> Ongoing
      let scheduleStatus = 'Ongoing';
      if (quiz.status === 'Closed' || (quiz.endDate && new Date(quiz.endDate) < now)) {
        scheduleStatus = 'Past';
      } else if (quiz.startDate && new Date(quiz.startDate) > now) {
        scheduleStatus = 'Upcoming';
      } else {
        scheduleStatus = 'Ongoing';
      }

      // Available to play only if Ongoing, Published, and not yet attempted
      const isPlayable = scheduleStatus === 'Ongoing' && quiz.status !== 'Draft' && !existingAttempt;

      const startDate = quiz.startDate || new Date('2026-08-15T00:00:00.000Z');
      const endDate = quiz.endDate || new Date('2026-09-30T23:59:59.000Z');
      const totalScore = quiz.totalScore || (quiz.numberOfQuestions ? quiz.numberOfQuestions * 2 : 20);
      const timing = quiz.timing || '00:30 Hours';
      const durationMinutes = quiz.durationMinutes || 30;
      const bannerUrl = quiz.bannerUrl || '/img/hindidiwas.png';
      
      // Control whether timing box should be shown on card
      const showTiming = quiz.showTiming !== false;

      // Filter duplicate class sub-quizzes from portal cards unless explicitly enabled by admin
      const isFeaturedOnPortal = quiz.isFeaturedOnPortal !== undefined
        ? quiz.isFeaturedOnPortal
        : (quiz.targetClass === 'All' || !quiz.name.includes('कक्षा'));

      let displayName = quiz.batchName || (quiz.name || '');
      displayName = displayName
        .replace(/\s*[-–—]\s*(कक्षा|Class)\s*\d+/i, '')
        .replace(/हिंदी दिवस क्विज़/g, 'हिंदी दिवस प्रतियोगिता')
        .replace(/क्विज़/g, 'प्रतियोगिता')
        .trim();

      let cleanDesc = (quiz.description || '')
        .replace(/कक्षा\s*\d+\s*के\s*(विद्यार्थियों|छात्रों)\s*के\s*लिए\s*/gi, 'विद्यार्थियों के लिए ')
        .replace(/कक्षा\s*\d+\s*/gi, '')
        .replace(/Class\s*\d+\s*/gi, '')
        .trim();

      // For general competition card, replace class 3 specific topics with comprehensive competition description
      if (cleanDesc.includes('वर्णमाला, बुनियादी शब्द ज्ञान') || !cleanDesc) {
        cleanDesc = 'विद्यार्थियों के लिए हिंदी व्याकरण, भाषा ज्ञान, मुहावरे, साहित्य और सामान्य ज्ञान पर आधारित रोचक प्रतियोगिता।';
      }

      let cleanInstructions = (quiz.instructions || '')
        .replace(/कक्षा\s*\d+\s*के\s*(विद्यार्थियों|छात्रों)\s*के\s*लिए\s*/gi, 'विद्यार्थियों के लिए ')
        .replace(/कक्षा\s*\d+\s*/gi, '')
        .replace(/Class\s*\d+\s*/gi, '')
        .replace(/हिंदी दिवस क्विज़/g, 'हिंदी दिवस प्रतियोगिता')
        .replace(/क्विज़/g, 'प्रतियोगिता')
        .trim();

      return {
        _id: quiz._id,
        name: displayName,
        rawName: quiz.name,
        batchName: quiz.batchName || '',
        scheduleBatchId: quiz.scheduleBatchId || null,
        isRepresentative: quiz.isRepresentative || false,
        subjectId: quiz.subjectId?._id || quiz.subjectId || null,
        subject: quiz.subjectId?.name || '',
        numberOfQuestions: quiz.numberOfQuestions || 10,
        status: quiz.status,
        passingPercentage: quiz.passingPercentage || 50,
        timePerQuestion: quiz.timePerQuestion || 30,
        description: cleanDesc,
        instructions: cleanInstructions,
        contactInfo: quiz.contactInfo || '',
        language: quiz.language || 'en',
        targetClass: quiz.targetClass || 'All',
        startDate,
        endDate,
        expiryDate: endDate,
        totalScore,
        timing,
        showTiming,
        durationMinutes,
        bannerUrl,
        scheduleStatus,
        isFeaturedOnPortal,
        isPlayable,
        isAttempted: !!existingAttempt,
        attemptResult: existingAttempt,
        createdAt: quiz.createdAt,
      };
    });

    // Separate portal showcase competitions from internal sub-class quizzes
    const statusOrder = { Ongoing: 0, Upcoming: 1, Past: 2 };

    const sortFn = (a, b) => {
      // 1. TargetClass === 'All' first
      const aIsAll = a.targetClass === 'All' || !a.name.includes('कक्षा');
      const bIsAll = b.targetClass === 'All' || !b.name.includes('कक्षा');
      if (aIsAll && !bIsAll) return -1;
      if (!aIsAll && bIsAll) return 1;

      // 2. Schedule Status: Ongoing -> Upcoming -> Past
      const aStat = statusOrder[a.scheduleStatus] ?? 3;
      const bStat = statusOrder[b.scheduleStatus] ?? 3;
      if (aStat !== bStat) return aStat - bStat;

      // 3. Class number ascending
      const aNum = parseInt((a.targetClass || '').replace(/\D/g, '')) || 0;
      const bNum = parseInt((b.targetClass || '').replace(/\D/g, '')) || 0;
      if (aNum !== bNum) return aNum - bNum;

      return 0;
    };

    processedQuizzes.sort(sortFn);

    // Filter featured quizzes for the homepage showcase (avoids duplicate class cards)
    const portalQuizzes = processedQuizzes.filter((q) => q.isFeaturedOnPortal !== false);

    res.status(200).json({
      success: true,
      count: portalQuizzes.length,
      quizzes: portalQuizzes,
      allQuizzes: processedQuizzes,
      data: portalQuizzes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify student identification and attempt eligibility
// @route   POST /api/quizzes/:id/verify-student
const verifyStudentAttempt = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;
    const { studentIdentifier, name, className, section, schoolName } = req.body;

    const cleanId = (studentIdentifier && studentIdentifier.trim())
      ? studentIdentifier.trim().toUpperCase()
      : `STU-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const cleanName = name && name.trim() ? name.trim() : 'Student';
    const cleanClass = className && className.trim() ? className.trim() : '';
    const cleanSec = section && section.trim() ? section.trim() : '';
    const cleanSchool = schoolName && schoolName.trim() ? schoolName.trim() : '';

    // Find or create student record
    let student = await Student.findOne({ studentIdentifier: cleanId });
    if (!student) {
      student = await Student.create({
        studentIdentifier: cleanId,
        name: cleanName,
        className: cleanClass,
        section: cleanSec,
        schoolName: cleanSchool,
      });
    } else {
      let updated = false;
      if (cleanName && student.name !== cleanName) { student.name = cleanName; updated = true; }
      if (cleanClass && student.className !== cleanClass) { student.className = cleanClass; updated = true; }
      if (cleanSec && student.section !== cleanSec) { student.section = cleanSec; updated = true; }
      if (cleanSchool && student.schoolName !== cleanSchool) { student.schoolName = cleanSchool; updated = true; }
      if (updated) await student.save();
    }

    // Resolve effective class quiz if part of a scheduled batch
    let effectiveQuizId = quizId;
    let resolvedQuiz = null;
    const baseQuiz = await Quiz.findById(quizId).lean();
    if (baseQuiz) {
      resolvedQuiz = baseQuiz;
      if (cleanClass) {
        const classNum = cleanClass.replace(/\D/g, '');
        let sibling = null;
        if (baseQuiz.scheduleBatchId) {
          const siblings = await Quiz.find({ scheduleBatchId: baseQuiz.scheduleBatchId }).lean();
          sibling = siblings.find((s) => {
            const sNum = (s.targetClass || '').replace(/\D/g, '');
            if (classNum && sNum === classNum) return true;
            if (s.name && (s.name.includes(`कक्षा ${classNum}`) || s.name.toLowerCase().includes(`class ${classNum}`))) return true;
            return false;
          });
        } else {
          const basePrefix = (baseQuiz.name || '').replace(/\s*[-–—]\s*(कक्षा|Class)\s*\d+/i, '').trim();
          if (basePrefix) {
            const siblings = await Quiz.find({ name: { $regex: basePrefix, $options: 'i' } }).lean();
            sibling = siblings.find((s) => {
              const sNum = (s.targetClass || '').replace(/\D/g, '');
              if (classNum && sNum === classNum) return true;
              return false;
            });
          }
        }
        if (sibling) {
          effectiveQuizId = sibling._id.toString();
          resolvedQuiz = sibling;
        }
      }
    }

    // Check if attempt exists for this student on either the base quiz or resolved class quiz
    const existingAttempt = await Attempt.findOne({
      studentId: student._id,
      quizId: { $in: [quizId, effectiveQuizId] },
    }).lean();

    if (existingAttempt) {
      return res.status(200).json({
        success: true,
        canAttempt: false,
        alreadyAttempted: true,
        message: 'You have already attempted this quiz. Only one attempt is permitted.',
        attempt: {
          attemptId: existingAttempt._id,
          score: existingAttempt.score,
          totalQuestions: existingAttempt.totalQuestions,
          percentage: existingAttempt.percentage,
          result: existingAttempt.result,
          certificateId: existingAttempt.certificateId,
          submittedAt: existingAttempt.submittedAt,
        },
      });
    }

    const studentData = {
      id: student._id,
      studentIdentifier: student.studentIdentifier,
      name: student.name,
      className: student.className || '',
      section: student.section || '',
      schoolName: student.schoolName || '',
    };

    res.status(200).json({
      success: true,
      canAttempt: true,
      alreadyAttempted: false,
      student: studentData,
      data: studentData,
      effectiveQuizId,
      resolvedQuizId: effectiveQuizId,
      quiz: resolvedQuiz,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start quiz: retrieve questions (without exposing correct answers)
// @route   GET /api/quizzes/:id/start
const startQuiz = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;
    const studentIdentifier = req.query.studentIdentifier
      ? req.query.studentIdentifier.trim().toUpperCase()
      : null;

    if (!studentIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Student identification required to initiate assessment.',
      });
    }

    const baseQuiz = await Quiz.findById(quizId).populate('subjectId', 'name').lean();
    if (!baseQuiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    let quiz = baseQuiz;
    const student = await Student.findOne({ studentIdentifier });
    const studentClass = (req.query.className || student?.className || '').trim();
    if (studentClass) {
      const classNum = studentClass.replace(/\D/g, '');
      let sibling = null;
      if (baseQuiz.scheduleBatchId) {
        const siblings = await Quiz.find({ scheduleBatchId: baseQuiz.scheduleBatchId }).populate('subjectId', 'name').lean();
        sibling = siblings.find((s) => {
          const sNum = (s.targetClass || '').replace(/\D/g, '');
          if (classNum && sNum === classNum) return true;
          if (s.name && (s.name.includes(`कक्षा ${classNum}`) || s.name.toLowerCase().includes(`class ${classNum}`))) return true;
          return false;
        });
      } else {
        const basePrefix = (baseQuiz.name || '').replace(/\s*[-–—]\s*(कक्षा|Class)\s*\d+/i, '').trim();
        if (basePrefix) {
          const siblings = await Quiz.find({ name: { $regex: basePrefix, $options: 'i' } }).populate('subjectId', 'name').lean();
          sibling = siblings.find((s) => {
            const sNum = (s.targetClass || '').replace(/\D/g, '');
            if (classNum && sNum === classNum) return true;
            return false;
          });
        }
      }
      if (sibling) {
        quiz = sibling;
      }
    }

    if (quiz.status === 'Closed') {
      return res.status(403).json({
        success: false,
        message: 'This quiz is not currently open for examination.',
      });
    }

    // Check student attempt status
    if (student) {
      const existingAttempt = await Attempt.findOne({
        studentId: student._id,
        quizId: quiz._id,
      });

      if (existingAttempt) {
        return res.status(403).json({
          success: false,
          code: 'ALREADY_ATTEMPTED',
          message: 'This quiz has already been attempted by you. Only one attempt is allowed.',
        });
      }
    }

    // Fetch quiz questions — exclude correctAnswer/explanation, include imageUrl/audioUrl
    const questions = await Question.find({ quizId: quiz._id })
      .sort({ createdAt: 1 })
      .lean();

    const quizDetails = {
      _id: quiz._id,
      name: (quiz.name || '')
        .replace(/हिंदी दिवस क्विज़/g, 'हिंदी दिवस प्रतियोगिता')
        .replace(/क्विज़/g, 'प्रतियोगिता'),
      subjectId: quiz.subjectId?._id || quiz.subjectId || null,
      subject: quiz.subjectId?.name || '',
      numberOfQuestions: quiz.numberOfQuestions,
      passingPercentage: quiz.passingPercentage || 50,
      timePerQuestion: quiz.timePerQuestion || 30,
      description: quiz.description || '',
      instructions: (quiz.instructions || '')
        .replace(/हिंदी दिवस क्विज़/g, 'हिंदी दिवस प्रतियोगिता')
        .replace(/क्विज़/g, 'प्रतियोगिता'),
      contactInfo: quiz.contactInfo || '',
      language: quiz.language || 'en',
    };

    const formattedQuestions = questions.map((q, idx) => ({
      _id: q._id,
      questionNumber: idx + 1,
      question: q.question,
      options: q.options,
      imageUrl: q.imageUrl || '',
      audioUrl: q.audioUrl || '',
    }));

    res.status(200).json({
      success: true,
      quiz: quizDetails,
      questions: formattedQuestions,
      timePerQuestion: quiz.timePerQuestion || 30,
      data: {
        quiz: quizDetails,
        questions: formattedQuestions,
        timePerQuestion: quiz.timePerQuestion || 30,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit student quiz attempt, evaluate score, enforce 1-attempt constraint
// @route   POST /api/quizzes/:id/attempt
const submitQuizAttempt = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;
    const { studentIdentifier, name, className, section, schoolName, answers } = req.body;

    if (!studentIdentifier || !studentIdentifier.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Student Roll Number or ID is required for submission.',
      });
    }

    const cleanId = studentIdentifier.trim().toUpperCase();
    const cleanName = name && name.trim() ? name.trim() : 'Student';
    const cleanClass = className && className.trim() ? className.trim() : '';
    const cleanSec = section && section.trim() ? section.trim() : '';
    const cleanSchool = schoolName && schoolName.trim() ? schoolName.trim() : '';

    // 1. Verify Quiz Existence & Status
    const quiz = await Quiz.findById(quizId).populate('subjectId', 'name');
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    if (quiz.status === 'Closed') {
      return res.status(403).json({
        success: false,
        message: 'This quiz is closed for submissions.',
      });
    }

    // Resolve class quiz if this quiz belongs to a scheduled batch
    let targetQuiz = quiz;
    if (cleanClass) {
      const classNum = cleanClass.replace(/\D/g, '');
      let sibling = null;
      if (quiz.scheduleBatchId) {
        const siblings = await Quiz.find({ scheduleBatchId: quiz.scheduleBatchId }).populate('subjectId', 'name');
        sibling = siblings.find((s) => {
          const sNum = (s.targetClass || '').replace(/\D/g, '');
          if (classNum && sNum === classNum) return true;
          if (s.name && (s.name.includes(`कक्षा ${classNum}`) || s.name.toLowerCase().includes(`class ${classNum}`))) return true;
          return false;
        });
      } else {
        const basePrefix = (quiz.name || '').replace(/\s*[-–—]\s*(कक्षा|Class)\s*\d+/i, '').trim();
        if (basePrefix) {
          const siblings = await Quiz.find({ name: { $regex: basePrefix, $options: 'i' } }).populate('subjectId', 'name');
          sibling = siblings.find((s) => {
            const sNum = (s.targetClass || '').replace(/\D/g, '');
            if (classNum && sNum === classNum) return true;
            return false;
          });
        }
      }
      if (sibling) {
        targetQuiz = sibling;
      }
    }

    // 2. Find or register Student
    let student = await Student.findOne({ studentIdentifier: cleanId });
    if (!student) {
      student = await Student.create({
        studentIdentifier: cleanId,
        name: cleanName,
        className: cleanClass,
        section: cleanSec,
        schoolName: cleanSchool,
      });
    } else {
      let updated = false;
      if (cleanName && student.name !== cleanName) { student.name = cleanName; updated = true; }
      if (cleanClass && student.className !== cleanClass) { student.className = cleanClass; updated = true; }
      if (cleanSec && student.section !== cleanSec) { student.section = cleanSec; updated = true; }
      if (cleanSchool && student.schoolName !== cleanSchool) { student.schoolName = cleanSchool; updated = true; }
      if (updated) await student.save();
    }

    // 3. Pre-check: Has this student already attempted?
    const existing = await Attempt.findOne({
      studentId: student._id,
      quizId: { $in: [quiz._id, targetQuiz._id] },
    });

    if (existing) {
      return res.status(403).json({
        success: false,
        code: 'ALREADY_ATTEMPTED',
        message: 'This quiz has already been attempted by this student. Duplicate submission rejected.',
      });
    }

    // 4. Fetch all questions with answers from database
    const questions = await Question.find({ quizId: targetQuiz._id }).lean();
    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Quiz has no registered questions.',
      });
    }

    // 5. Grade Answers
    let score = 0;
    const userAnswers = answers || {};
    const questionReview = [];

    questions.forEach((q) => {
      const qId = q._id.toString();
      const studentChoice = userAnswers[qId] ? String(userAnswers[qId]).toUpperCase() : null;
      const isCorrect = studentChoice === q.correctAnswer;

      if (isCorrect) score++;

      questionReview.push({
        questionId: q._id,
        question: q.question,
        options: q.options,
        studentChoice: studentChoice || 'Unanswered',
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || '',
      });
    });

    const totalQuestions = questions.length;
    const correctAnswers = score;
    const wrongAnswers = totalQuestions - score;
    const percentage = Math.round((score / totalQuestions) * 100);
    const passingPercentage = targetQuiz.passingPercentage || 50;
    const result = percentage >= passingPercentage ? 'Pass' : 'Fail';

    // 6. Generate Certificate ID for students
    let certificateId = await generateCertificateId();

    // 7. Record Attempt with MongoDB Unique Constraint
    const attempt = await Attempt.create({
      studentId: student._id,
      quizId: targetQuiz._id,
      studentIdentifier: student.studentIdentifier,
      studentName: student.name,
      className: cleanClass || student.className || '',
      section: cleanSec || student.section || '',
      schoolName: cleanSchool || student.schoolName || '',
      answers: userAnswers,
      score,
      correctAnswers,
      wrongAnswers,
      totalQuestions,
      percentage,
      result,
      certificateId,
      submittedAt: new Date(),
    });

    const resultPayload = {
      attemptId: attempt._id,
      studentName: student.name,
      studentIdentifier: student.studentIdentifier,
      className: attempt.className || '',
      section: attempt.section || '',
      schoolName: attempt.schoolName || '',
      quizName: quiz.name,
      subject: quiz.subjectId ? quiz.subjectId.name : '',
      score,
      correctAnswers,
      wrongAnswers,
      totalQuestions,
      percentage,
      result,
      passingPercentage,
      certificateId,
      submittedAt: attempt.submittedAt,
      review: questionReview,
    };

    res.status(201).json({
      success: true,
      message: 'Quiz submitted and evaluated successfully',
      result: resultPayload,
      data: resultPayload,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableQuizzes,
  verifyStudentAttempt,
  startQuiz,
  submitQuizAttempt,
};

