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
      startDate: req.body.startDate ? new Date(req.body.startDate) : new Date('2026-08-15T00:00:00.000Z'),
      endDate: req.body.endDate ? new Date(req.body.endDate) : new Date('2026-09-30T23:59:59.000Z'),
      timing: req.body.timing ? req.body.timing.trim() : '00:10 Hours',
      totalScore: req.body.totalScore ? Number(req.body.totalScore) : (targetCount * 2 || 20),
      scheduleStatus: req.body.scheduleStatus || 'Ongoing',
      bannerUrl: req.body.bannerUrl ? req.body.bannerUrl.trim() : '/img/hindidiwas.png',
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
    if (req.body.startDate !== undefined) quiz.startDate = new Date(req.body.startDate);
    if (req.body.endDate !== undefined) quiz.endDate = new Date(req.body.endDate);
    if (req.body.timing !== undefined) quiz.timing = req.body.timing.trim();
    if (req.body.totalScore !== undefined) quiz.totalScore = Number(req.body.totalScore);
    if (req.body.scheduleStatus !== undefined) quiz.scheduleStatus = req.body.scheduleStatus;
    if (req.body.bannerUrl !== undefined) quiz.bannerUrl = req.body.bannerUrl.trim();

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

// @desc    Update quiz schedule, dates, timing, and portal visibility
// @route   PATCH /api/admin/quizzes/:id/schedule
const updateQuizSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      startDate,
      endDate,
      timing,
      showTiming,
      isFeaturedOnPortal,
      status,
      durationMinutes,
      totalScore,
      bannerUrl,
    } = req.body;

    const quiz = await Quiz.findById(id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    if (startDate !== undefined) quiz.startDate = new Date(startDate);
    if (endDate !== undefined) quiz.endDate = new Date(endDate);
    if (timing !== undefined) quiz.timing = String(timing).trim();
    if (showTiming !== undefined) quiz.showTiming = Boolean(showTiming);
    if (isFeaturedOnPortal !== undefined) quiz.isFeaturedOnPortal = Boolean(isFeaturedOnPortal);
    if (status !== undefined) quiz.status = status;
    if (durationMinutes !== undefined) quiz.durationMinutes = Number(durationMinutes);
    if (totalScore !== undefined) quiz.totalScore = Number(totalScore);
    if (bannerUrl !== undefined) quiz.bannerUrl = String(bannerUrl).trim();

    // Dynamically calculate scheduleStatus
    const now = new Date();
    if (quiz.status === 'Closed' || (quiz.endDate && new Date(quiz.endDate) < now)) {
      quiz.scheduleStatus = 'Past';
    } else if (quiz.startDate && new Date(quiz.startDate) > now) {
      quiz.scheduleStatus = 'Upcoming';
    } else {
      quiz.scheduleStatus = 'Ongoing';
    }

    await quiz.save();

    res.status(200).json({
      success: true,
      message: 'Quiz schedule updated successfully',
      quiz,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Batch update quiz schedules (multiple quizzes selected at once)
// @route   POST /api/admin/quizzes/schedule/batch
const updateBatchQuizSchedule = async (req, res, next) => {
  try {
    const {
      quizIds,
      startDate,
      endDate,
      timing,
      showTiming,
      isFeaturedOnPortal,
      bannerUrl,
      competitionTitle,
      status,
    } = req.body;

    if (!quizIds || !Array.isArray(quizIds) || quizIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one quiz.' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date/time and End date/time are required.' });
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid start or end date.' });
    }

    if (eDate < sDate) {
      return res.status(400).json({ success: false, message: 'End date/time cannot be earlier than start date/time.' });
    }

    const now = new Date();
    let dynamicStatus = 'Ongoing';
    if (status === 'Closed' || eDate < now) {
      dynamicStatus = 'Past';
    } else if (sDate > now) {
      dynamicStatus = 'Upcoming';
    }

    const selectedQuizzes = await Quiz.find({ _id: { $in: quizIds } });
    if (!selectedQuizzes.length) {
      return res.status(404).json({ success: false, message: 'No matching quizzes found.' });
    }

    // Determine batch / competition title
    let resolvedTitle = competitionTitle && competitionTitle.trim() ? competitionTitle.trim() : '';
    if (!resolvedTitle) {
      // Auto derive from first quiz
      const firstQuiz = selectedQuizzes[0];
      resolvedTitle = (firstQuiz.name || '')
        .replace(/\s*[-–—]\s*(कक्षा|Class)\s*\d+/i, '')
        .replace(/हिंदी दिवस क्विज़/g, 'हिंदी दिवस प्रतियोगिता')
        .replace(/क्विज़/g, 'प्रतियोगिता')
        .trim();
      if (!resolvedTitle) resolvedTitle = 'प्रतियोगिता';
    }

    // Generate unique batch ID or reuse existing if editing
    const batchId = (req.body.batchId && req.body.batchId.trim() && !req.body.batchId.startsWith('standalone_'))
      ? req.body.batchId.trim()
      : `batch_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    // If updating an existing batch, remove any quizzes that were deselected
    if (req.body.batchId && req.body.batchId.trim()) {
      const selectedIds = selectedQuizzes.map((q) => q._id);
      await Quiz.updateMany(
        { scheduleBatchId: batchId, _id: { $nin: selectedIds } },
        { $set: { scheduleBatchId: null, isFeaturedOnPortal: false, isRepresentative: false } }
      );
    }

    const finalBanner = bannerUrl && bannerUrl.trim() ? bannerUrl.trim() : '/img/hindidiwas.png';
    const timingVal = (timing !== undefined && String(timing).trim() !== '') ? String(timing).trim() : '00:10 Hours';
    const showTimingVal = showTiming !== undefined ? Boolean(showTiming) : true;
    const shouldFeature = isFeaturedOnPortal !== false;

    // Identify which quiz represents this batch on the student portal:
    // 1. If a quiz has targetClass === 'All', that's the representative
    // 2. Otherwise, pick the first quiz in the batch as the representative
    let repQuizId = null;
    const allClassQuiz = selectedQuizzes.find((q) => q.targetClass === 'All');
    if (allClassQuiz) {
      repQuizId = allClassQuiz._id.toString();
    } else {
      repQuizId = selectedQuizzes[0]._id.toString();
    }

    // Update each quiz in the batch
    for (const quiz of selectedQuizzes) {
      const qIdStr = quiz._id.toString();
      const isRep = (qIdStr === repQuizId);

      quiz.startDate = sDate;
      quiz.endDate = eDate;
      quiz.timing = timingVal;
      quiz.showTiming = showTimingVal;
      quiz.bannerUrl = finalBanner;
      quiz.scheduleBatchId = batchId;
      quiz.batchName = resolvedTitle;
      quiz.scheduleStatus = dynamicStatus;
      quiz.status = status || 'Published';
      quiz.isRepresentative = isRep;

      // CRITICAL REQUIREMENT:
      // Only the single representative quiz is featured on the portal so 6 separate class cards do NOT appear!
      quiz.isFeaturedOnPortal = shouldFeature ? isRep : false;

      // Clean quiz description and instructions to ensure no class-specific text shows on the portal card or instructions modal
      let cleanDesc = (quiz.description || '')
        .replace(/कक्षा\s*\d+\s*के\s*(विद्यार्थियों|छात्रों)\s*के\s*लिए\s*/gi, 'विद्यार्थियों के लिए ')
        .replace(/कक्षा\s*\d+\s*/gi, '')
        .replace(/Class\s*\d+\s*/gi, '')
        .trim();
      if (cleanDesc.includes('वर्णमाला, बुनियादी शब्द ज्ञान') || !cleanDesc) {
        cleanDesc = 'विद्यार्थियों के लिए हिंदी व्याकरण, भाषा ज्ञान, मुहावरे, साहित्य और सामान्य ज्ञान पर आधारित रोचक प्रतियोगिता।';
      }
      quiz.description = cleanDesc;

      let cleanInst = (quiz.instructions || '')
        .replace(/कक्षा\s*\d+\s*के\s*(विद्यार्थियों|छात्रों)\s*के\s*लिए\s*/gi, 'विद्यार्थियों के लिए ')
        .replace(/कक्षा\s*\d+\s*/gi, '')
        .replace(/Class\s*\d+\s*/gi, '')
        .trim();
      quiz.instructions = cleanInst;

      await quiz.save();
    }

    res.status(200).json({
      success: true,
      message: `Successfully scheduled ${selectedQuizzes.length} quiz(zes) as "${resolvedTitle}"!`,
      batchId,
      batchName: resolvedTitle,
      representativeQuizId: repQuizId,
      modifiedCount: selectedQuizzes.length,
      scheduleStatus: dynamicStatus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active scheduled batches
// @route   GET /api/admin/quizzes/schedule/batches
const getScheduledBatches = async (req, res, next) => {
  try {
    const allScheduledQuizzes = await Quiz.find({
      $or: [
        { scheduleBatchId: { $ne: null } },
        { isFeaturedOnPortal: true },
      ],
    }).sort({ startDate: -1 }).lean();

    const now = new Date();
    const batchMap = new Map();

    for (const q of allScheduledQuizzes) {
      const batchKey = q.scheduleBatchId || `standalone_${q._id}`;
      if (!batchMap.has(batchKey)) {
        batchMap.set(batchKey, {
          batchId: batchKey,
          isBatch: Boolean(q.scheduleBatchId),
          batchName: q.batchName || q.name,
          bannerUrl: q.bannerUrl || '/img/hindidiwas.png',
          startDate: q.startDate,
          endDate: q.endDate,
          timing: q.timing || '00:10 Hours',
          showTiming: q.showTiming !== false,
          scheduleStatus: q.scheduleStatus,
          status: q.status,
          quizzes: [],
          representativeQuiz: null,
        });
      }

      const batch = batchMap.get(batchKey);
      batch.quizzes.push({
        _id: q._id,
        name: q.name,
        targetClass: q.targetClass || 'All',
        numberOfQuestions: q.numberOfQuestions,
        isRepresentative: q.isRepresentative || (q._id.toString() === batch.representativeQuiz?._id?.toString()),
        isFeaturedOnPortal: q.isFeaturedOnPortal,
      });

      if (q.isRepresentative || q.isFeaturedOnPortal) {
        batch.representativeQuiz = q;
        if (q.batchName) batch.batchName = q.batchName;
      }
    }

    const batches = Array.from(batchMap.values()).map((b) => {
      const sDateObj = b.startDate ? new Date(b.startDate) : null;
      const eDateObj = b.endDate ? new Date(b.endDate) : null;
      let liveStatus = 'Ongoing';
      if (b.status === 'Closed' || (eDateObj && eDateObj < now)) {
        liveStatus = 'Past';
      } else if (sDateObj && sDateObj > now) {
        liveStatus = 'Upcoming';
      }

      return {
        ...b,
        scheduleStatus: liveStatus,
        quizCount: b.quizzes.length,
      };
    });

    res.status(200).json({
      success: true,
      count: batches.length,
      batches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or unschedule a batch
// @route   DELETE /api/admin/quizzes/schedule/batch/:batchId
const removeScheduledBatch = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    if (!batchId) {
      return res.status(400).json({ success: false, message: 'Batch ID is required' });
    }

    if (batchId.startsWith('standalone_')) {
      const qId = batchId.replace('standalone_', '');
      await Quiz.findByIdAndUpdate(qId, {
        isFeaturedOnPortal: false,
        status: 'Draft',
      });
    } else {
      await Quiz.updateMany(
        { scheduleBatchId: batchId },
        {
          scheduleBatchId: null,
          isFeaturedOnPortal: false,
          isRepresentative: false,
          status: 'Draft',
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Batch schedule successfully removed / unpublished!',
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
  updateQuizSchedule,
  updateBatchQuizSchedule,
  getScheduledBatches,
  removeScheduledBatch,
  getAllQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getAllAttempts,
  getAttemptById,
  getQuizAttempts,
};


