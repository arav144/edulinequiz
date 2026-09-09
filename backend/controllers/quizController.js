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

    // Available quizzes (Published and Draft, excluding Closed)
    const allPublished = await Quiz.find({ status: { $ne: 'Closed' } })
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 })
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

    // Process quizzes with availability rules
    const quizzes = allPublished.map((quiz) => {
      const quizIdStr = quiz._id.toString();
      const existingAttempt = studentAttemptMap[quizIdStr] || null;

      // Available to play if published and not yet attempted
      const isPlayable = !existingAttempt;

      return {
        _id: quiz._id,
        name: quiz.name,
        subjectId: quiz.subjectId?._id || quiz.subjectId || null,
        subject: quiz.subjectId?.name || '',
        numberOfQuestions: quiz.numberOfQuestions,
        status: quiz.status,
        passingPercentage: quiz.passingPercentage || 50,
        timePerQuestion: quiz.timePerQuestion || 30,
        description: quiz.description || '',
        instructions: quiz.instructions || '',
        contactInfo: quiz.contactInfo || '',
        language: quiz.language || 'en',
        isPlayable,
        isAttempted: !!existingAttempt,
        attemptResult: existingAttempt,
        createdAt: quiz.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes,
      data: quizzes,
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

    // Check if attempt exists
    const existingAttempt = await Attempt.findOne({
      studentId: student._id,
      quizId,
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

    const quiz = await Quiz.findById(quizId).populate('subjectId', 'name').lean();
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    if (quiz.status === 'Closed') {
      return res.status(403).json({
        success: false,
        message: 'This quiz is not currently open for examination.',
      });
    }

    // Check student attempt status
    const student = await Student.findOne({ studentIdentifier });
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
      name: quiz.name,
      subjectId: quiz.subjectId?._id || quiz.subjectId || null,
      subject: quiz.subjectId?.name || '',
      numberOfQuestions: quiz.numberOfQuestions,
      passingPercentage: quiz.passingPercentage || 50,
      timePerQuestion: quiz.timePerQuestion || 30,
      description: quiz.description || '',
      instructions: quiz.instructions || '',
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
      quizId: quiz._id,
    });

    if (existing) {
      return res.status(403).json({
        success: false,
        code: 'ALREADY_ATTEMPTED',
        message: 'This quiz has already been attempted by this student. Duplicate submission rejected.',
      });
    }

    // 4. Fetch all questions with answers from database
    const questions = await Question.find({ quizId: quiz._id }).lean();
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
    const passingPercentage = quiz.passingPercentage || 50;
    const result = percentage >= passingPercentage ? 'Pass' : 'Fail';

    // 6. Generate Certificate ID for students
    let certificateId = await generateCertificateId();

    // 7. Record Attempt with MongoDB Unique Constraint
    const attempt = await Attempt.create({
      studentId: student._id,
      quizId: quiz._id,
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

