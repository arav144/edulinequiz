const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Student = require('../models/Student');
const Attempt = require('../models/Attempt');
const Subject = require('../models/Subject');

// Helper to generate unique certificate ID: EDU-YYYY-NNNNNN
const generateCertificateId = async () => {
  const year = new Date().getFullYear();
  const count = await Attempt.countDocuments();
  const seq = String(count + 1).padStart(6, '0');
  return `EDU-${year}-${seq}`;
};

// Helper: Resolve student from request (supports JWT auth header or query/body studentIdentifier)
async function resolveStudent(req) {
  if (req.student) return req.student;

  const rawIdentifier =
    req.body?.studentIdentifier ||
    req.query?.studentIdentifier ||
    req.headers['x-student-identifier'];

  if (rawIdentifier && typeof rawIdentifier === 'string') {
    const student = await Student.findOne({
      $or: [
        { studentIdentifier: rawIdentifier.trim().toUpperCase() },
        { email: rawIdentifier.trim().toLowerCase() },
      ],
    });
    if (student) return student;
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

    let quizzes = [];
    let attemptMap = new Map();
    let studentClass = '';
    const now = new Date();

    if (student) {
      studentClass = (student.class || student.className || '').trim();
      const classNum = studentClass.replace(/\D/g, '');

      // Strict Backend Class Filter:
      // Only return quizzes that are Published and match student's registered class
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

      quizzes = await Quiz.find(classFilter)
        .populate('subjectId', 'name')
        .sort({ createdAt: -1 })
        .lean();

      // Fetch this student's attempts to flag already-attempted quizzes
      const attempts = await Attempt.find({ studentId: student._id }).lean();
      attempts.forEach((att) => {
        attemptMap.set(att.quizId.toString(), att);
      });
    } else {
      // For guest visitors: only show quizzes featured on portal (respects 1-card competition grouping)
      quizzes = await Quiz.find({
        status: 'Published',
        isFeaturedOnPortal: { $ne: false },
      })
        .populate('subjectId', 'name')
        .sort({ createdAt: -1 })
        .lean();
    }

    // Pre-fetch all batch siblings in a single batched query (Eliminates N+1 MongoDB roundtrips)
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

    // Process quizzes synchronously with dynamic server schedule status & batch metadata
    const processed = quizzes.map((quiz) => {
      const qIdStr = quiz._id.toString();
      const existing = attemptMap.get(qIdStr);

      // Dynamic Server-Side Schedule Status calculation
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

      // If part of a batch, aggregate classes from pre-fetched in-memory batch map
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

    const quiz = await Quiz.findById(quizId).populate('subjectId', 'name').lean();
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    // Must be published
    if (quiz.status !== 'Published') {
      return res.status(403).json({
        success: false,
        message: 'This quiz is not currently published.',
      });
    }

    // Check future schedule
    const now = new Date();
    const sDateObj = quiz.startDate ? new Date(quiz.startDate) : null;
    if (quiz.scheduleStatus === 'Upcoming' || (sDateObj && sDateObj > now)) {
      return res.status(403).json({
        success: false,
        message: 'This quiz is scheduled for a future date and is not yet open.',
      });
    }

    // 1. Resolve class-specific quiz if this is part of a scheduled batch
    const studentClass = (student.class || student.className || '').trim();
    const classNum = studentClass.replace(/\D/g, '');

    let targetQuiz = quiz;
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
      if (classSpecificQuiz) {
        targetQuiz = classSpecificQuiz;
      }
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

    // Fetch Questions for this Quiz
    let questions = await Question.find({ quizId: targetQuiz._id })
      .select('-correctAnswer')
      .lean();

    // If questions aren't directly linked by quizId, query by subject or fallback
    if (!questions || questions.length === 0) {
      if (targetQuiz.subjectId) {
        questions = await Question.find({ subjectId: targetQuiz.subjectId._id || targetQuiz.subjectId })
          .select('-correctAnswer')
          .limit(targetQuiz.numberOfQuestions || 15)
          .lean();
      }
    }

    // Format questions strictly as 4-option MCQs (A, B, C, D)
    const sanitizedQuestions = questions.map((q, idx) => ({
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

    res.status(200).json({
      success: true,
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
      timePerQuestion: quiz.timePerQuestion || 40,
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
    const { answers = {} } = req.body;

    const student = await resolveStudent(req);
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to submit quiz attempt.',
      });
    }

    const quiz = await Quiz.findById(quizId).populate('subjectId', 'name').lean();
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    // 1. Resolve class-specific quiz if this is part of a scheduled batch
    const studentClass = (student.class || student.className || '').trim();
    const classNum = studentClass.replace(/\D/g, '');

    let targetQuiz = quiz;
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
      if (classSpecificQuiz) {
        targetQuiz = classSpecificQuiz;
      }
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

    // Check duplicate attempt
    const existing = await Attempt.findOne({ studentId: student._id, quizId: targetQuiz._id });
    if (existing) {
      return res.status(403).json({
        success: false,
        code: 'ALREADY_ATTEMPTED',
        message: 'This quiz has already been completed by you.',
        attemptId: existing._id,
      });
    }

    // Fetch questions with correct answers for grading
    let questions = await Question.find({ quizId: targetQuiz._id }).lean();
    if (!questions || questions.length === 0) {
      if (targetQuiz.subjectId) {
        questions = await Question.find({ subjectId: targetQuiz.subjectId._id || targetQuiz.subjectId })
          .limit(targetQuiz.numberOfQuestions || 15)
          .lean();
      }
    }

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
    const certificateId = await generateCertificateId();

    // Create Attempt record (Protected by unique compound index { studentId: 1, quizId: 1 })
    const attempt = await Attempt.create({
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
    });

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
      studentName: student.name || `${student.firstName} ${student.lastName}`.trim(),
      quizName: targetQuiz.name,
      subject: targetQuiz.subjectId?.name || 'General',
      review,
    };

    res.status(201).json({
      success: true,
      message: 'Quiz attempt evaluated and recorded successfully.',
      ...resultPayload,
      result: resultPayload,
      data: resultPayload,
    });
  } catch (error) {
    // Catch MongoDB duplicate key error code 11000
    if (error.code === 11000) {
      return res.status(403).json({
        success: false,
        code: 'ALREADY_ATTEMPTED',
        message: 'Duplicate attempt blocked. You can only attempt this quiz once.',
      });
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
