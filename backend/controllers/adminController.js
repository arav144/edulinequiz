const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');
const Student = require('../models/Student');
const Subject = require('../models/Subject');

// Helper: Start of today in UTC
const getStartOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

// @desc  Get real-time dashboard statistics
// @route GET /api/admin/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const startOfToday = getStartOfToday();

    const [
      totalStudents,
      totalQuizzes,
      publishedQuizzes,
      draftQuizzes,
      closedQuizzes,
      totalQuestions,
      totalAttempts,
      todayAttempts,
      allAttempts,
    ] = await Promise.all([
      Student.countDocuments(),
      Quiz.countDocuments(),
      Quiz.countDocuments({ status: 'Published' }),
      Quiz.countDocuments({ status: 'Draft' }),
      Quiz.countDocuments({ status: 'Closed' }),
      Question.countDocuments(),
      Attempt.countDocuments(),
      Attempt.countDocuments({ submittedAt: { $gte: startOfToday } }),
      Attempt.find({}, 'score totalQuestions percentage result').lean(),
    ]);

    const avgScore = allAttempts.length
      ? Math.round(allAttempts.reduce((sum, a) => sum + a.percentage, 0) / allAttempts.length)
      : 0;
    const highestScore = allAttempts.length
      ? Math.max(...allAttempts.map((a) => a.percentage))
      : 0;
    const passCount = allAttempts.filter((a) => a.result === 'Pass').length;
    const passRate = allAttempts.length ? Math.round((passCount / allAttempts.length) * 100) : 0;

    // Recent 10 attempts
    const recentAttempts = await Attempt.find()
      .sort({ submittedAt: -1 })
      .limit(10)
      .populate({
        path: 'quizId',
        select: 'name subjectId',
        populate: { path: 'subjectId', select: 'name' },
      })
      .lean();

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalQuizzes,
        publishedQuizzes,
        draftQuizzes,
        closedQuizzes,
        totalQuestions,
        totalAttempts,
        todayAttempts,
        avgScore,
        highestScore,
        passRate,
      },
      recentAttempts: recentAttempts.map((att) => ({
        _id: att._id,
        studentName: att.studentName,
        studentIdentifier: att.studentIdentifier,
        quizName: att.quizId ? att.quizId.name : 'Unknown',
        subject: att.quizId?.subjectId ? att.quizId.subjectId.name : '',
        score: att.score,
        totalQuestions: att.totalQuestions,
        percentage: att.percentage,
        result: att.result,
        certificateId: att.certificateId,
        submittedAt: att.submittedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ─── QUIZ MANAGEMENT ─────────────────────────────────────────────────────────

// @desc    Get all quizzes with question counts & attempt telemetry
// @route   GET /api/admin/quizzes
const getAdminQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find()
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const quizzesWithCounts = await Promise.all(
      quizzes.map(async (quiz) => {
        const questionCount = await Question.countDocuments({ quizId: quiz._id });
        const attemptCount = await Attempt.countDocuments({ quizId: quiz._id });
        return {
          ...quiz,
          subject: quiz.subjectId ? quiz.subjectId.name : '',
          questionsAdded: questionCount,
          attemptCount,
          isReadyToPublish: questionCount === quiz.numberOfQuestions,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: quizzesWithCounts.length,
      quizzes: quizzesWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// Helper to validate questions array
const validateQuestionsArray = (questions, requiredCount, isPublishing) => {
  if (isPublishing && (!questions || questions.length !== requiredCount)) {
    const current = questions ? questions.length : 0;
    const diff = requiredCount - current;
    return `${requiredCount} questions are required. ${current} ${current === 1 ? 'has' : 'have'} been added. Please ${diff > 0 ? `add ${diff} more question${diff > 1 ? 's' : ''}` : `remove ${Math.abs(diff)} question${Math.abs(diff) > 1 ? 's' : ''}`}.`;
  }

  if (questions && questions.length > 0) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qNum = i + 1;

      if (!q.question || !q.question.trim()) {
        return `Question ${qNum} text is required.`;
      }

      if (!q.options || typeof q.options !== 'object') {
        return `Question ${qNum} must have Options A, B, C, and D.`;
      }

      if (!q.options.A || !q.options.A.trim()) {
        return `Question ${qNum} is missing Option A.`;
      }
      if (!q.options.B || !q.options.B.trim()) {
        return `Question ${qNum} is missing Option B.`;
      }
      if (!q.options.C || !q.options.C.trim()) {
        return `Question ${qNum} is missing Option C.`;
      }
      if (!q.options.D || !q.options.D.trim()) {
        return `Question ${qNum} is missing Option D.`;
      }

      const cleanKey = String(q.correctAnswer || '').trim().toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(cleanKey)) {
        return `Question ${qNum} does not have a valid correct answer (must be A, B, C, or D).`;
      }
    }
  }

  return null;
};

// @desc    Create new quiz (with questions together)
// @route   POST /api/admin/quizzes
const createQuiz = async (req, res, next) => {
  try {
    const {
      name,
      numberOfQuestions,
      status = 'Draft',
      passingPercentage,
      subjectId,
      timePerQuestion,
      description,
      instructions,
      contactInfo,
      language = 'en',
      targetClass = 'All',
      questions = [],
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Quiz name is required.' });
    }
    const targetCount = Number(numberOfQuestions);
    if (!targetCount || targetCount < 1) {
      return res.status(400).json({ success: false, message: 'A quiz must require at least 1 question.' });
    }

    const isPublishing = status === 'Published';
    const validationError = validateQuestionsArray(questions, targetCount, isPublishing);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    // Create quiz
    const quiz = await Quiz.create({
      name: name.trim(),
      numberOfQuestions: targetCount,
      status,
      passingPercentage: passingPercentage ? Number(passingPercentage) : 50,
      timePerQuestion: timePerQuestion ? Number(timePerQuestion) : 30,
      description: description ? description.trim() : '',
      instructions: instructions ? instructions.trim() : '',
      contactInfo: contactInfo ? contactInfo.trim() : '',
      language: language === 'hi' ? 'hi' : 'en',
      targetClass: targetClass ? targetClass.trim() : 'All',
      subjectId: subjectId || null,
    });

    // Create associated questions
    if (questions && questions.length > 0) {
      try {
        const questionDocs = questions.map((q) => ({
          quizId: quiz._id,
          subjectId: subjectId || null,
          question: q.question.trim(),
          options: {
            A: q.options.A.trim(),
            B: q.options.B.trim(),
            C: q.options.C.trim(),
            D: q.options.D.trim(),
          },
          correctAnswer: String(q.correctAnswer).trim().toUpperCase(),
          explanation: q.explanation ? q.explanation.trim() : '',
          imageUrl: q.imageUrl || '',
          imagePublicId: q.imagePublicId || '',
          audioUrl: q.audioUrl || '',
          audioPublicId: q.audioPublicId || '',
        }));

        await Question.insertMany(questionDocs);
      } catch (insertError) {
        // Rollback created quiz to prevent orphaned incomplete quiz
        await Quiz.findByIdAndDelete(quiz._id);
        throw insertError;
      }
    }

    const populatedQuiz = await Quiz.findById(quiz._id).populate('subjectId', 'name').lean();
    const savedQuestions = await Question.find({ quizId: quiz._id }).sort({ createdAt: 1 }).lean();

    res.status(201).json({
      success: true,
      message: `Quiz "${quiz.name}" created successfully with ${savedQuestions.length} questions.`,
      quiz: populatedQuiz,
      questions: savedQuestions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quiz with all questions (including answer keys)
// @route   GET /api/admin/quizzes/:id
const getAdminQuizById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id).populate('subjectId', 'name').lean();

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    const questions = await Question.find({ quizId: quiz._id }).sort({ createdAt: 1 }).lean();
    const attempts = await Attempt.find({ quizId: quiz._id }).sort({ submittedAt: -1 }).lean();

    res.status(200).json({
      success: true,
      quiz: {
        ...quiz,
        subject: quiz.subjectId ? quiz.subjectId.name : '',
        questionsAdded: questions.length,
        attemptCount: attempts.length,
        isReadyToPublish: questions.length === quiz.numberOfQuestions,
      },
      questions,
      attempts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quiz (and sync all questions together)
// @route   PUT /api/admin/quizzes/:id
const updateQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      numberOfQuestions,
      status,
      passingPercentage,
      subjectId,
      timePerQuestion,
      description,
      instructions,
      contactInfo,
      language,
      questions,
    } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    const targetQuestionsCount =
      numberOfQuestions !== undefined ? Number(numberOfQuestions) : quiz.numberOfQuestions;
    const newStatus = status !== undefined ? status : quiz.status;
    const isPublishing = newStatus === 'Published';

    // If questions array is supplied in update payload
    if (questions !== undefined && Array.isArray(questions)) {
      const validationError = validateQuestionsArray(questions, targetQuestionsCount, isPublishing);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      // Sync questions atomically for this quiz
      await Question.deleteMany({ quizId: quiz._id });
      if (questions.length > 0) {
        const questionDocs = questions.map((q) => ({
          quizId: quiz._id,
          subjectId: subjectId !== undefined ? subjectId : quiz.subjectId,
          question: q.question.trim(),
          options: {
            A: q.options.A.trim(),
            B: q.options.B.trim(),
            C: q.options.C.trim(),
            D: q.options.D.trim(),
          },
          correctAnswer: String(q.correctAnswer).trim().toUpperCase(),
          explanation: q.explanation ? q.explanation.trim() : '',
          imageUrl: q.imageUrl || '',
          imagePublicId: q.imagePublicId || '',
          audioUrl: q.audioUrl || '',
          audioPublicId: q.audioPublicId || '',
        }));

        await Question.insertMany(questionDocs);
      }
    } else if (isPublishing) {
      // If updating status to Published without passing questions array, verify existing count
      const actualQuestionsCount = await Question.countDocuments({ quizId: quiz._id });
      if (actualQuestionsCount !== targetQuestionsCount) {
        return res.status(400).json({
          success: false,
          code: 'INCOMPLETE_QUESTIONS',
          message: `Cannot publish quiz! Configured question quota is ${targetQuestionsCount}, but only ${actualQuestionsCount} questions have been added. Add all required questions before publishing.`,
          required: targetQuestionsCount,
          current: actualQuestionsCount,
        });
      }
    }

    if (name) quiz.name = name.trim();
    if (numberOfQuestions) quiz.numberOfQuestions = Number(numberOfQuestions);
    if (status) quiz.status = status;
    if (passingPercentage !== undefined) quiz.passingPercentage = Number(passingPercentage);
    if (timePerQuestion !== undefined) quiz.timePerQuestion = Number(timePerQuestion);
    if (description !== undefined) quiz.description = description.trim();
    if (instructions !== undefined) quiz.instructions = instructions.trim();
    if (contactInfo !== undefined) quiz.contactInfo = contactInfo.trim();
    if (language !== undefined) quiz.language = language === 'hi' ? 'hi' : 'en';
    if (req.body.targetClass !== undefined) quiz.targetClass = req.body.targetClass.trim() || 'All';
    if (subjectId !== undefined) quiz.subjectId = subjectId || null;

    await quiz.save();

    const populatedQuiz = await Quiz.findById(quiz._id).populate('subjectId', 'name').lean();
    const updatedQuestions = await Question.find({ quizId: quiz._id }).sort({ createdAt: 1 }).lean();

    res.status(200).json({
      success: true,
      message: 'Quiz and questions updated successfully',
      quiz: {
        ...populatedQuiz,
        subject: populatedQuiz.subjectId ? populatedQuiz.subjectId.name : '',
        questionsAdded: updatedQuestions.length,
      },
      questions: updatedQuestions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete quiz and all its associated questions and attempts
// @route   DELETE /api/admin/quizzes/:id
const deleteQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findByIdAndDelete(id);

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    await Question.deleteMany({ quizId: id });
    await Attempt.deleteMany({ quizId: id });

    res.status(200).json({
      success: true,
      message: 'Quiz and all associated questions have been deleted.',
    });
  } catch (error) {
    next(error);
  }
};

// ─── QUESTION MANAGEMENT ─────────────────────────────────────────────────────

// @desc    Get all questions across all quizzes
// @route   GET /api/admin/questions
const getAllQuestions = async (req, res, next) => {
  try {
    const { quizId, subjectId, search } = req.query;
    const filter = {};
    if (quizId) filter.quizId = quizId;
    if (subjectId) filter.subjectId = subjectId;
    if (search) filter.question = { $regex: search, $options: 'i' };

    const questions = await Question.find(filter)
      .populate('quizId', 'name')
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add single MCQ question to quiz
// @route   POST /api/admin/questions
const addQuestion = async (req, res, next) => {
  try {
    const { quizId, question, options, correctAnswer, explanation, subjectId, imageUrl, imagePublicId, audioUrl, audioPublicId } = req.body;

    if (!quizId) {
      return res.status(400).json({ success: false, message: 'Quiz ID association is required.' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Associated quiz not found.' });
    }

    if (
      !options ||
      !options.A || !options.B || !options.C || !options.D ||
      !options.A.trim() || !options.B.trim() || !options.C.trim() || !options.D.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'All 4 options (A, B, C, D) must contain non-empty text.',
      });
    }

    const cleanKey = String(correctAnswer || '').trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(cleanKey)) {
      return res.status(400).json({
        success: false,
        message: 'Correct answer must be strictly A, B, C, or D.',
      });
    }

    const newQuestion = await Question.create({
      quizId: quiz._id,
      subjectId: subjectId || quiz.subjectId || null,
      question: question.trim(),
      options: {
        A: options.A.trim(),
        B: options.B.trim(),
        C: options.C.trim(),
        D: options.D.trim(),
      },
      correctAnswer: cleanKey,
      explanation: explanation ? explanation.trim() : '',
      imageUrl: imageUrl || '',
      imagePublicId: imagePublicId || '',
      audioUrl: audioUrl || '',
      audioPublicId: audioPublicId || '',
    });

    const currentTotal = await Question.countDocuments({ quizId: quiz._id });

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      question: newQuestion,
      questionsAdded: currentTotal,
      targetQuota: quiz.numberOfQuestions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update MCQ question
// @route   PUT /api/admin/questions/:id
const updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question, options, correctAnswer, explanation, subjectId, imageUrl, imagePublicId, audioUrl, audioPublicId } = req.body;

    const q = await Question.findById(id);
    if (!q) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    if (question) q.question = question.trim();
    if (options) {
      if (options.A) q.options.A = options.A.trim();
      if (options.B) q.options.B = options.B.trim();
      if (options.C) q.options.C = options.C.trim();
      if (options.D) q.options.D = options.D.trim();
    }
    if (correctAnswer) {
      const cleanKey = String(correctAnswer).trim().toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(cleanKey)) {
        q.correctAnswer = cleanKey;
      }
    }
    if (explanation !== undefined) q.explanation = explanation.trim();
    if (subjectId !== undefined) q.subjectId = subjectId || null;
    if (imageUrl !== undefined) q.imageUrl = imageUrl;
    if (imagePublicId !== undefined) q.imagePublicId = imagePublicId;
    if (audioUrl !== undefined) q.audioUrl = audioUrl;
    if (audioPublicId !== undefined) q.audioPublicId = audioPublicId;

    await q.save();

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      question: q,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete MCQ question
// @route   DELETE /api/admin/questions/:id
const deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const q = await Question.findByIdAndDelete(id);

    if (!q) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ─── ATTEMPTS / RESULTS ───────────────────────────────────────────────────────

// @desc  Get all attempts (admin results panel)
// @route GET /api/admin/attempts
const getAllAttempts = async (req, res, next) => {
  try {
    const { quizId, search, result, sortBy, limit = 50, page = 1 } = req.query;
    const filter = {};
    if (quizId) filter.quizId = quizId;
    if (result) filter.result = result;
    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { studentIdentifier: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions = {};
    if (sortBy === 'score') sortOptions.percentage = -1;
    else if (sortBy === 'date') sortOptions.submittedAt = -1;
    else sortOptions.submittedAt = -1;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Attempt.countDocuments(filter);
    const attempts = await Attempt.find(filter)
      .populate({
        path: 'quizId',
        select: 'name numberOfQuestions passingPercentage subjectId',
        populate: { path: 'subjectId', select: 'name' },
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      attempts: attempts.map((att) => ({
        _id: att._id,
        studentName: att.studentName,
        studentIdentifier: att.studentIdentifier,
        quizName: att.quizId ? att.quizId.name : 'Unknown',
        subject: att.quizId?.subjectId ? att.quizId.subjectId.name : '',
        score: att.score,
        totalQuestions: att.totalQuestions,
        percentage: att.percentage,
        result: att.result,
        certificateId: att.certificateId,
        submittedAt: att.submittedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single attempt detail (admin)
// @route GET /api/admin/attempts/:id
const getAttemptById = async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate({
        path: 'quizId',
        select: 'name numberOfQuestions passingPercentage subjectId',
        populate: { path: 'subjectId', select: 'name' },
      })
      .populate('studentId', 'name studentIdentifier')
      .lean();

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    res.status(200).json({ success: true, attempt });
  } catch (error) {
    next(error);
  }
};

// @desc  Get attempts for a specific quiz
// @route GET /api/admin/quizzes/:id/attempts
const getQuizAttempts = async (req, res, next) => {
  try {
    const { id: quizId } = req.params;
    const quiz = await Quiz.findById(quizId).populate('subjectId', 'name').lean();
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    const attempts = await Attempt.find({ quizId: quiz._id })
      .sort({ submittedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      quiz: { _id: quiz._id, name: quiz.name, subject: quiz.subjectId ? quiz.subjectId.name : '', numberOfQuestions: quiz.numberOfQuestions },
      count: attempts.length,
      attempts: attempts.map((att) => ({
        _id: att._id,
        studentIdentifier: att.studentIdentifier,
        studentName: att.studentName,
        score: att.score,
        totalQuestions: att.totalQuestions,
        percentage: att.percentage,
        result: att.result,
        certificateId: att.certificateId,
        submittedAt: att.submittedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAdminQuizzes,
  createQuiz,
  getAdminQuizById,
  updateQuiz,
  deleteQuiz,
  getAllQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getAllAttempts,
  getAttemptById,
  getQuizAttempts,
};

