const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Student = require('../models/Student');
const Attempt = require('../models/Attempt');
const Subject = require('../models/Subject');
const cacheService = require('../services/cacheService');
const { submitQueue } = require('../services/queueService');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Helper to generate unique certificate ID instantly without DB count: EDU-YYYY-NNNNNN
const generateCertificateId = () => {
  const year = new Date().getFullYear();
  const timePart = Date.now().toString().slice(-6);
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `EDU-${year}-${timePart}${randomPart}`;
};

// Helper: Resolve student from request (supports JWT auth header or query/body studentIdentifier)
async function resolveStudent(req) {
  if (req.student) return req.student;

  const rawIdentifier =
    req.body?.studentIdentifier ||
    req.query?.studentIdentifier ||
    req.headers['x-student-identifier'];

  if (rawIdentifier && typeof rawIdentifier === 'string') {
    const cleanId = rawIdentifier.trim().toUpperCase();
    return cacheService.getOrSet(
      `student_identity_${cleanId}`,
      async () => {
        return Student.findOne({
          $or: [
            { studentIdentifier: cleanId },
            { email: rawIdentifier.trim().toLowerCase() },
          ],
        })
          .select('_id email class className name firstName lastName studentIdentifier schoolName')
          .lean();
      },
      600 // 10 minutes cache
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET AVAILABLE QUIZZES (Class-Wise Filtering Enforced on Backend)
// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get published quizzes matching the student's registered class or portal showcase
// @route   GET /api/quizzes/available
const getAvailableQuizzes = async (req, res, next) => {
  try {
    const student = await resolveStudent(req);

    // ── GUEST / PUBLIC PORTAL VIEW ──────────────────────────────────────────
    // Pure public showcase: cached in-memory for 60 seconds with public Cache-Control
    if (!student) {
      const cacheKey = 'public_portal_quizzes';
      const cachedData = cacheService.get(cacheKey);

      if (cachedData) {
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
        return res.status(200).json(cachedData);
      }

      const quizzes = await Quiz.find({
        status: 'Published',
        isFeaturedOnPortal: { $ne: false },
      })
        .populate('subjectId', 'name')
        .sort({ createdAt: -1 })
        .lean();

      const batchIds = [...new Set(quizzes.map((q) => q.scheduleBatchId).filter(Boolean))];
      const batchClassMap = new Map();

      if (batchIds.length > 0) {
        const allBatchSiblings = await Quiz.find({
          scheduleBatchId: { $in: batchIds },
          status: 'Published',
        })
          .select('scheduleBatchId targetClass classes')
          .lean();

        allBatchSiblings.forEach((b) => {
          if (!b.scheduleBatchId) return;
          if (!batchClassMap.has(b.scheduleBatchId)) {
            batchClassMap.set(b.scheduleBatchId, new Set());
          }
          const set = batchClassMap.get(b.scheduleBatchId);
          if (b.targetClass && b.targetClass !== 'All') set.add(b.targetClass);
          if (Array.isArray(b.classes)) {
            b.classes.forEach((c) => {
              if (c && c !== 'All') set.add(c);
            });
          }
        });
      }

      const now = new Date();
      const processed = quizzes.map((quiz) => {
        const sDateObj = quiz.startDate ? new Date(quiz.startDate) : null;
        const eDateObj = quiz.endDate ? new Date(quiz.endDate) : null;
        let dynamicScheduleStatus = quiz.scheduleStatus || 'Ongoing';

        if (quiz.status === 'Closed' || (eDateObj && eDateObj < now)) {
          dynamicScheduleStatus = 'Past';
        } else if (sDateObj && sDateObj > now) {
          dynamicScheduleStatus = 'Upcoming';
        } else {
          dynamicScheduleStatus = 'Ongoing';
        }

        let resolvedClasses = quiz.classes?.length ? quiz.classes : [quiz.targetClass || 'All Classes'];
        let resolvedTargetClass = quiz.targetClass || (quiz.classes && quiz.classes[0]) || 'All Classes';

        if (quiz.scheduleBatchId && batchClassMap.has(quiz.scheduleBatchId)) {
          const allBatchClasses = batchClassMap.get(quiz.scheduleBatchId);
          if (allBatchClasses.size > 1) {
            const classNums = Array.from(allBatchClasses)
              .map((c) => parseInt(String(c).replace(/\D/g, ''), 10))
              .filter((n) => !isNaN(n))
              .sort((a, b) => a - b);
            if (classNums.length > 1) {
              resolvedTargetClass = `Class ${classNums[0]} to ${classNums[classNums.length - 1]}`;
              resolvedClasses = classNums.map((n) => `Class ${n}`);
            }
          }
        }

        const isPlayable = (quiz.isPlayable !== false) && (dynamicScheduleStatus === 'Ongoing');

        return {
          _id: quiz._id,
          name: quiz.batchName || quiz.name,
          batchName: quiz.batchName || '',
          scheduleBatchId: quiz.scheduleBatchId || null,
          subject: quiz.subjectId?.name || 'General Knowledge',
          subjectId: quiz.subjectId?._id || quiz.subjectId || null,
          targetClass: resolvedTargetClass,
          classes: resolvedClasses,
          numberOfQuestions: quiz.numberOfQuestions || 15,
          timePerQuestion: quiz.timePerQuestion || 40,
          passingPercentage: quiz.passingPercentage || 50,
          totalScore: quiz.totalScore || quiz.numberOfQuestions || 15,
          durationMinutes: quiz.durationMinutes || Math.ceil(((quiz.numberOfQuestions || 15) * (quiz.timePerQuestion || 40)) / 60),
          timing: quiz.timing || '00:10 Hours',
          showTiming: quiz.showTiming !== false,
          startDate: quiz.startDate || null,
          endDate: quiz.endDate || null,
          isPlayable,
          status: quiz.status,
          description: quiz.description || '',
          instructions: quiz.instructions || '',
          bannerUrl: quiz.bannerUrl || '/img/hindidiwas.png',
          scheduleStatus: dynamicScheduleStatus,
          isAttempted: false,
          attemptResult: null,
        };
      });

      const payload = {
        success: true,
        count: processed.length,
        studentClass: 'All',
        quizzes: processed,
        data: processed,
      };

      cacheService.set(cacheKey, payload, 60);
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      return res.status(200).json(payload);
    }

    // ── AUTHENTICATED STUDENT VIEW ──────────────────────────────────────────
    // Strictly PRIVATE Cache-Control (protects individual attempt history)
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    const studentClass = (student.class || student.className || '').trim();
    const classNum = studentClass.replace(/\D/g, '');
    const now = new Date();

    const classFilter = {
      status: 'Published',
      $or: [
        { classes: studentClass },
        ...(classNum
          ? [
              { classes: `Class ${classNum}` },
              { classes: classNum },
              { targetClass: `Class ${classNum}` },
              { targetClass: classNum },
              { name: { $regex: `Class ${classNum}`, $options: 'i' } },
            ]
          : []),
        { targetClass: studentClass },
        { targetClass: 'All' },
      ],
    };

    // Query quizzes matching class
    const quizzes = await Quiz.find(classFilter)
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch this student's attempts with lean projection
    const attempts = await Attempt.find({ studentId: student._id })
      .select('quizId score totalQuestions percentage result certificateId submittedAt')
      .lean();

    const attemptMap = new Map();
    attempts.forEach((att) => {
      attemptMap.set(att.quizId.toString(), att);
    });

    const batchIds = [...new Set(quizzes.map((q) => q.scheduleBatchId).filter(Boolean))];
    const batchClassMap = new Map();

    if (batchIds.length > 0) {
      const allBatchSiblings = await Quiz.find({
        scheduleBatchId: { $in: batchIds },
        status: 'Published',
      })
        .select('scheduleBatchId targetClass classes')
        .lean();

      allBatchSiblings.forEach((b) => {
        if (!b.scheduleBatchId) return;
        if (!batchClassMap.has(b.scheduleBatchId)) {
          batchClassMap.set(b.scheduleBatchId, new Set());
        }
        const set = batchClassMap.get(b.scheduleBatchId);
        if (b.targetClass && b.targetClass !== 'All') set.add(b.targetClass);
        if (Array.isArray(b.classes)) {
          b.classes.forEach((c) => {
            if (c && c !== 'All') set.add(c);
          });
        }
      });
    }

    const processed = quizzes.map((quiz) => {
      const qIdStr = quiz._id.toString();
      const existing = attemptMap.get(qIdStr);

      const sDateObj = quiz.startDate ? new Date(quiz.startDate) : null;
      const eDateObj = quiz.endDate ? new Date(quiz.endDate) : null;
      let dynamicScheduleStatus = quiz.scheduleStatus || 'Ongoing';

      if (quiz.status === 'Closed' || (eDateObj && eDateObj < now)) {
        dynamicScheduleStatus = 'Past';
      } else if (sDateObj && sDateObj > now) {
        dynamicScheduleStatus = 'Upcoming';
      } else {
        dynamicScheduleStatus = 'Ongoing';
      }

      let resolvedClasses = quiz.classes?.length ? quiz.classes : [quiz.targetClass || studentClass || 'All Classes'];
      let resolvedTargetClass = quiz.targetClass || (quiz.classes && quiz.classes[0]) || (studentClass || 'All Classes');

      if (quiz.scheduleBatchId && batchClassMap.has(quiz.scheduleBatchId)) {
        const allBatchClasses = batchClassMap.get(quiz.scheduleBatchId);
        if (allBatchClasses.size > 1) {
          const classNums = Array.from(allBatchClasses)
            .map((c) => parseInt(String(c).replace(/\D/g, ''), 10))
            .filter((n) => !isNaN(n))
            .sort((a, b) => a - b);
          if (classNums.length > 1) {
            resolvedTargetClass = `Class ${classNums[0]} to ${classNums[classNums.length - 1]}`;
            resolvedClasses = classNums.map((n) => `Class ${n}`);
          }
        }
      }

      const isPlayable = (quiz.isPlayable !== false) && (dynamicScheduleStatus === 'Ongoing');

      return {
        _id: quiz._id,
        name: quiz.batchName || quiz.name,
        batchName: quiz.batchName || '',
        scheduleBatchId: quiz.scheduleBatchId || null,
        subject: quiz.subjectId?.name || 'General Knowledge',
        subjectId: quiz.subjectId?._id || quiz.subjectId || null,
        targetClass: resolvedTargetClass,
        classes: resolvedClasses,
        numberOfQuestions: quiz.numberOfQuestions || 15,
        timePerQuestion: quiz.timePerQuestion || 40,
        passingPercentage: quiz.passingPercentage || 50,
        totalScore: quiz.totalScore || quiz.numberOfQuestions || 15,
        durationMinutes: quiz.durationMinutes || Math.ceil(((quiz.numberOfQuestions || 15) * (quiz.timePerQuestion || 40)) / 60),
        timing: quiz.timing || '00:10 Hours',
        showTiming: quiz.showTiming !== false,
        startDate: quiz.startDate || null,
        endDate: quiz.endDate || null,
        isPlayable,
        status: quiz.status,
        description: quiz.description || '',
        instructions: quiz.instructions || '',
        bannerUrl: quiz.bannerUrl || '/img/hindidiwas.png',
        scheduleStatus: dynamicScheduleStatus,
        isAttempted: !!existing,
        attemptResult: existing
          ? {
              attemptId: existing._id,
              score: existing.score,
              totalQuestions: existing.totalQuestions,
              percentage: existing.percentage,
              result: existing.result,
              certificateId: existing.certificateId,
              submittedAt: existing.submittedAt,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      count: processed.length,
      studentClass: studentClass || 'All',
      quizzes: processed,
      data: processed,
    });
  } catch (error) {
    next(error);
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// 2. GET SINGLE QUIZ BY ID
// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single quiz and verify student class authorization
// @route   GET /api/quizzes/:id
const getQuizById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id).populate('subjectId', 'name').lean();

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    const student = await resolveStudent(req);
    if (student) {
      const studentClass = (student.class || student.className || '').trim();
      const classNum = studentClass.replace(/\D/g, '');

      // Verify class authorization
      const isAuthorized =
        quiz.targetClass === 'All' ||
        quiz.targetClass === studentClass ||
        (quiz.classes && quiz.classes.includes(studentClass)) ||
        (classNum && quiz.name.toLowerCase().includes(`class ${classNum}`));

      if (!isAuthorized && quiz.status !== 'Draft') {
        return res.status(403).json({
          success: false,
          message: `Access denied. This quiz is restricted to ${quiz.targetClass || 'other classes'}. Your class is ${studentClass}.`,
        });
      }
    }

    res.status(200).json({
      success: true,
      quiz: {
        _id: quiz._id,
        name: quiz.name,
        subject: quiz.subjectId?.name || 'General',
        numberOfQuestions: quiz.numberOfQuestions || 15,
        timePerQuestion: quiz.timePerQuestion || 40,
        passingPercentage: quiz.passingPercentage || 50,
        status: quiz.status,
        description: quiz.description,
        instructions: quiz.instructions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. START QUIZ (Enforces Class Eligibility & One Attempt Rule)
// ─────────────────────────────────────────────────────────────────────────────
// @desc    Initiate quiz and retrieve questions (without exposing correct answers)
// @route   GET or POST /api/quizzes/:id/start
const startQuiz = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;
    const student = await resolveStudent(req);

    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Please register and verify your email before starting a quiz.',
      });
    }

    // 1. Resolve class-specific quiz if this is part of a scheduled batch (cached for 300s)
    const studentClass = (student.class || student.className || '').trim();
    const classNum = studentClass.replace(/\D/g, '');

    const targetQuiz = await cacheService.getOrSet(
      `quiz_meta_${quizId}_${studentClass}`,
      async () => {
        const quiz = await Quiz.findById(quizId).populate('subjectId', 'name').lean();
        if (!quiz) return null;

        if (quiz.scheduleBatchId) {
          const classSpecificQuiz = await Quiz.findOne({
            scheduleBatchId: quiz.scheduleBatchId,
            status: 'Published',
            $or: [
              { targetClass: studentClass },
              ...(classNum
                ? [
                    { targetClass: `Class ${classNum}` },
                    { targetClass: classNum },
                    { classes: `Class ${classNum}` },
                    { classes: classNum },
                    { name: { $regex: `(कक्षा|Class)\\s*${classNum}`, $options: 'i' } },
                  ]
                : []),
              { classes: studentClass },
            ],
          }).populate('subjectId', 'name').lean();
          if (classSpecificQuiz) return classSpecificQuiz;
        }
        return quiz;
      },
      300
    );

    if (!targetQuiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    // Must be published
    if (targetQuiz.status !== 'Published') {
      return res.status(403).json({
        success: false,
        message: 'This quiz is not currently published.',
      });
    }

    // Check future schedule
    const now = new Date();
    const sDateObj = targetQuiz.startDate ? new Date(targetQuiz.startDate) : null;
    if (targetQuiz.scheduleStatus === 'Upcoming' || (sDateObj && sDateObj > now)) {
      return res.status(403).json({
        success: false,
        message: 'This quiz is scheduled for a future date and is not yet open.',
      });
    }

    // 2. Strict Class Eligibility Authorization
    const isClassEligible =
      targetQuiz.targetClass === 'All' ||
      targetQuiz.targetClass === studentClass ||
      (classNum && targetQuiz.targetClass === `Class ${classNum}`) ||
      (classNum && targetQuiz.targetClass === classNum) ||
      (targetQuiz.classes && (
        targetQuiz.classes.includes(studentClass) ||
        (classNum && targetQuiz.classes.includes(`Class ${classNum}`)) ||
        (classNum && targetQuiz.classes.includes(classNum))
      )) ||
      (classNum && targetQuiz.name && targetQuiz.name.toLowerCase().includes(`class ${classNum}`));

    if (!isClassEligible) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You are registered in ${studentClass}, but this quiz is for ${targetQuiz.targetClass}.`,
      });
    }

    // 3. Strict One Student = One Attempt Check
    const existingAttempt = await Attempt.findOne({
      studentId: student._id,
      quizId: targetQuiz._id,
    }).lean();

    if (existingAttempt) {
      return res.status(403).json({
        success: false,
        code: 'ALREADY_ATTEMPTED',
        alreadyAttempted: true,
        message: 'You have already attempted this quiz. Each quiz can only be attempted once.',
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

    // Fetch and cache Questions for this Quiz (1 DB read per quiz for all 800 students)
    const sanitizedQuestions = await cacheService.getOrSet(
      `quiz_sanitized_questions_${targetQuiz._id}`,
      async () => {
        let questions = await Question.find({ quizId: targetQuiz._id })
          .select('-correctAnswer')
          .lean();

        if (!questions || questions.length === 0) {
          if (targetQuiz.subjectId) {
            questions = await Question.find({ subjectId: targetQuiz.subjectId._id || targetQuiz.subjectId })
              .select('-correctAnswer')
              .limit(targetQuiz.numberOfQuestions || 15)
              .lean();
          }
        }

        return (questions || []).map((q, idx) => ({
          _id: q._id,
          questionNumber: idx + 1,
          question: q.question,
          options: {
            A: q.options?.A || q.optionA || 'Option A',
            B: q.options?.B || q.optionB || 'Option B',
            C: q.options?.C || q.optionC || 'Option C',
            D: q.options?.D || q.optionD || 'Option D',
          },
          imageUrl: q.imageUrl || null,
          audioUrl: q.audioUrl || null,
        }));
      },
      600 // 10 minutes cache
    );

    const qCount = sanitizedQuestions.length || targetQuiz.numberOfQuestions || 15;
    const perQSec = targetQuiz.timePerQuestion || 40;
    const totalAllocatedSec = qCount * perQSec;
    const startedAt = Date.now();

    // 100% Stateless signed exam session token (HMAC-SHA256)
    // Survives server restarts, horizontal scaling, and serverless cold reboots
    const examToken = jwt.sign(
      {
        type: 'exam_session',
        studentId: String(student._id),
        quizId: String(targetQuiz._id),
        startedAt,
        totalAllocatedSec,
      },
      JWT_SECRET,
      { expiresIn: `${totalAllocatedSec + 7200}s` }
    );

    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.status(200).json({
      success: true,
      examToken,
      startedAt,
      quiz: {
        _id: targetQuiz._id,
        name: targetQuiz.name,
        subject: targetQuiz.subjectId?.name || 'General',
        numberOfQuestions: sanitizedQuestions.length || targetQuiz.numberOfQuestions || 15,
        timePerQuestion: targetQuiz.timePerQuestion || 40,
        passingPercentage: targetQuiz.passingPercentage || 50,
      },
      questions: sanitizedQuestions,
      numberOfQuestions: sanitizedQuestions.length,
      timePerQuestion: targetQuiz.timePerQuestion || 40,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. SUBMIT QUIZ ATTEMPT (Server-Side Evaluation & One-Attempt DB Enforcement)
// ─────────────────────────────────────────────────────────────────────────────
// @desc    Submit student answers, evaluate score server-side, save attempt
// @route   POST /api/quizzes/:id/attempt
const submitQuizAttempt = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;
    const { answers = {}, clientExpiredAt, examToken } = req.body;

    const student = await resolveStudent(req);
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to submit quiz attempt.',
      });
    }

    // 1. Resolve class-specific quiz with caching (300s TTL)
    const studentClass = (student.class || student.className || '').trim();
    const classNum = studentClass.replace(/\D/g, '');

    const targetQuiz = await cacheService.getOrSet(
      `quiz_meta_${quizId}_${studentClass}`,
      async () => {
        const quiz = await Quiz.findById(quizId).populate('subjectId', 'name').lean();
        if (!quiz) return null;

        if (quiz.scheduleBatchId) {
          const classSpecificQuiz = await Quiz.findOne({
            scheduleBatchId: quiz.scheduleBatchId,
            status: 'Published',
            $or: [
              { targetClass: studentClass },
              ...(classNum
                ? [
                    { targetClass: `Class ${classNum}` },
                    { targetClass: classNum },
                    { classes: `Class ${classNum}` },
                    { classes: classNum },
                    { name: { $regex: `(कक्षा|Class)\\s*${classNum}`, $options: 'i' } },
                  ]
                : []),
              { classes: studentClass },
            ],
          }).populate('subjectId', 'name').lean();
          if (classSpecificQuiz) return classSpecificQuiz;
        }
        return quiz;
      },
      300
    );

    if (!targetQuiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    // 2. Verify student class authorization
    const isClassEligible =
      targetQuiz.targetClass === 'All' ||
      targetQuiz.targetClass === studentClass ||
      (classNum && targetQuiz.targetClass === `Class ${classNum}`) ||
      (classNum && targetQuiz.targetClass === classNum) ||
      (targetQuiz.classes && (
        targetQuiz.classes.includes(studentClass) ||
        (classNum && targetQuiz.classes.includes(`Class ${classNum}`)) ||
        (classNum && targetQuiz.classes.includes(classNum))
      )) ||
      (classNum && targetQuiz.name && targetQuiz.name.toLowerCase().includes(`class ${classNum}`));

    if (!isClassEligible) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Quiz does not match your registered class.',
      });
    }

    // 2.1 Stateless Exam Deadline Verification (Signed HMAC-SHA256 Token)
    // Does NOT depend on in-memory cache; resilient across Vercel serverless cold restarts.
    // If token is missing or invalid: do NOT reject submission, flag as unverified for admin audit.
    const receivedAt = new Date();
    let timingFlag = 'verified';
    let tokenStartedAt = null;

    const qCount = targetQuiz.numberOfQuestions || 15;
    const perQSec = targetQuiz.timePerQuestion || 40;
    const defaultTotalAllocatedSec = qCount * perQSec;

    if (!examToken) {
      timingFlag = 'unverified';
    } else {
      try {
        const decoded = jwt.verify(examToken, JWT_SECRET);
        if (
          decoded.type !== 'exam_session' ||
          String(decoded.studentId) !== String(student._id) ||
          String(decoded.quizId) !== String(targetQuiz._id)
        ) {
          timingFlag = 'unverified';
        } else {
          tokenStartedAt = new Date(decoded.startedAt);
          const allocatedSec = Number(decoded.totalAllocatedSec) || defaultTotalAllocatedSec;
          // Rule: arrival <= startedAt + totalTime + 120s tolerance (for jitter 0-40s + latency)
          const maxAllowedArrivalMs = Number(decoded.startedAt) + (allocatedSec + 120) * 1000;
          if (receivedAt.getTime() > maxAllowedArrivalMs) {
            timingFlag = 'late';
          }
        }
      } catch (err) {
        // Invalid signature or expired token: preserve student submission, flag unverified
        timingFlag = 'unverified';
      }
    }

    // 3. Fetch questions with correct answers for grading (Cached for 10 minutes - 1 DB read total)
    const questions = await cacheService.getOrSet(
      `quiz_grading_questions_${targetQuiz._id}`,
      async () => {
        let qs = await Question.find({ quizId: targetQuiz._id }).lean();
        if (!qs || qs.length === 0) {
          if (targetQuiz.subjectId) {
            qs = await Question.find({ subjectId: targetQuiz.subjectId._id || targetQuiz.subjectId })
              .limit(targetQuiz.numberOfQuestions || 15)
              .lean();
          }
        }
        return qs || [];
      },
      600
    );

    let correctAnswers = 0;
    let wrongAnswers = 0;
    const review = [];

    questions.forEach((q) => {
      const studentChoice = answers[q._id.toString()] || 'Unanswered';
      const actualAnswer = (q.correctAnswer || 'A').toUpperCase().trim();
      const isCorrect = studentChoice.toUpperCase().trim() === actualAnswer;

      if (isCorrect) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }

      review.push({
        questionId: q._id,
        question: q.question,
        options: {
          A: q.options?.A || q.optionA || '',
          B: q.options?.B || q.optionB || '',
          C: q.options?.C || q.optionC || '',
          D: q.options?.D || q.optionD || '',
        },
        studentChoice,
        correctAnswer: actualAnswer,
        isCorrect,
        explanation: q.explanation || '',
      });
    });

    const totalQuestions = questions.length || 1;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const passingPercentage = targetQuiz.passingPercentage || 50;

    // Score-dependent encouraging remark (NEVER "Fail")
    let result = 'Better Luck Next Time';
    if (percentage >= 90) {
      result = 'Outstanding';
    } else if (percentage >= 75) {
      result = 'Very Good';
    } else if (percentage >= 60) {
      result = 'Good Effort';
    } else if (percentage >= passingPercentage) {
      result = 'Pass';
    } else {
      result = 'Better Luck Next Time';
    }

    const score = correctAnswers;
    let certificateId;
    let attempt;
    let certRetries = 3;

    // 4. Create Attempt record through concurrency write queue
    // (Retries with fresh certificateId if collision occurs; protected atomically by unique index)
    while (certRetries > 0) {
      certificateId = generateCertificateId();
      try {
        attempt = await submitQueue.run(() =>
          Attempt.create({
            studentId: student._id,
            quizId: targetQuiz._id,
            studentIdentifier: student.studentIdentifier,
            studentName: student.name || `${student.firstName} ${student.lastName}`.trim(),
            className: studentClass,
            schoolName: student.schoolName || '',
            answers,
            score,
            correctAnswers,
            wrongAnswers,
            totalQuestions,
            percentage,
            result,
            certificateId,
            submittedAt: new Date(),
            receivedAt,
            timingFlag,
            startedAt: tokenStartedAt,
          })
        );
        break;
      } catch (writeErr) {
        if (writeErr.code === 11000 && (writeErr.message?.includes('certificateId') || writeErr.keyPattern?.certificateId)) {
          certRetries--;
          if (certRetries === 0) throw writeErr;
          continue;
        }
        throw writeErr;
      }
    }

    const resultPayload = {
      attemptId: attempt._id,
      score,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      percentage,
      result,
      certificateId,
      submittedAt: attempt.submittedAt,
      receivedAt: attempt.receivedAt,
      timingFlag: attempt.timingFlag,
      studentName: student.name || `${student.firstName} ${student.lastName}`.trim(),
      quizName: targetQuiz.name,
      subject: targetQuiz.subjectId?.name || 'General',
      review,
    };

    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.status(201).json({
      success: true,
      message: 'Quiz attempt evaluated and recorded successfully.',
      ...resultPayload,
      result: resultPayload,
      data: resultPayload,
    });
  } catch (error) {
    // Idempotent submission: on duplicate E11000, return existing attempt result as success
    if (error.code === 11000 && !error.message?.includes('certificateId') && !error.keyPattern?.certificateId) {
      const existing = await Attempt.findOne({
        studentId: req.student?._id,
        quizId: req.params.id,
      }).lean();

      if (existing) {
        const idempPayload = {
          attemptId: existing._id,
          score: existing.score,
          totalQuestions: existing.totalQuestions,
          correctAnswers: existing.correctAnswers,
          wrongAnswers: existing.wrongAnswers,
          percentage: existing.percentage,
          result: existing.result,
          certificateId: existing.certificateId,
          submittedAt: existing.submittedAt,
          studentName: existing.studentName,
          quizName: 'Quiz',
          subject: 'General',
          alreadyAttempted: true,
        };

        res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        return res.status(403).json({
          success: false,
          code: 'ALREADY_ATTEMPTED',
          alreadyAttempted: true,
          message: 'You have already attempted this quiz. Each quiz can only be attempted once.',
          ...idempPayload,
          result: idempPayload,
          data: idempPayload,
        });
      }
    }
    next(error);
  }
};

module.exports = {
  getAvailableQuizzes,
  getQuizById,
  startQuiz,
  submitQuizAttempt,
};
