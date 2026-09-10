const ClassLevel = require('../models/ClassLevel');
const Quiz = require('../models/Quiz');

// @desc    Get active classes for student portal (public)
// @route   GET /api/classes
const getActiveClasses = async (req, res, next) => {
  try {
    const classes = await ClassLevel.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .populate('assignedQuizId', 'name numberOfQuestions timePerQuestion passingPercentage status')
      .lean();

    res.status(200).json({
      success: true,
      count: classes.length,
      classes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all classes for admin console
// @route   GET /api/admin/classes
const getAdminClasses = async (req, res, next) => {
  try {
    const classes = await ClassLevel.find()
      .sort({ order: 1, name: 1 })
      .populate('assignedQuizId', 'name numberOfQuestions timePerQuestion passingPercentage status targetClass')
      .lean();

    res.status(200).json({
      success: true,
      count: classes.length,
      classes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new class (Admin)
// @route   POST /api/admin/classes
const createClass = async (req, res, next) => {
  try {
    const { name, displayHindi, order, isActive = true, assignedQuizId = null } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Class name is required (e.g. Class 9).' });
    }

    const cleanName = name.trim();
    const existing = await ClassLevel.findOne({ name: cleanName });
    if (existing) {
      return res.status(400).json({ success: false, message: `Class "${cleanName}" already exists.` });
    }

    const newClass = await ClassLevel.create({
      name: cleanName,
      displayHindi: displayHindi ? displayHindi.trim() : cleanName,
      order: order ? Number(order) : parseInt(cleanName.replace(/\D/g, '') || '0', 10),
      isActive: isActive !== false,
      assignedQuizId: assignedQuizId || null,
    });

    const populated = await ClassLevel.findById(newClass._id)
      .populate('assignedQuizId', 'name numberOfQuestions status')
      .lean();

    res.status(201).json({
      success: true,
      message: `Class "${cleanName}" added successfully.`,
      classItem: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update class (Admin)
// @route   PUT /api/admin/classes/:id
const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, displayHindi, order, isActive, assignedQuizId } = req.body;

    const classDoc = await ClassLevel.findById(id);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    if (name && name.trim()) classDoc.name = name.trim();
    if (displayHindi !== undefined) classDoc.displayHindi = displayHindi.trim();
    if (order !== undefined) classDoc.order = Number(order);
    if (isActive !== undefined) classDoc.isActive = !!isActive;
    if (assignedQuizId !== undefined) classDoc.assignedQuizId = assignedQuizId || null;

    await classDoc.save();

    const populated = await ClassLevel.findById(classDoc._id)
      .populate('assignedQuizId', 'name numberOfQuestions status')
      .lean();

    res.status(200).json({
      success: true,
      message: `Class "${classDoc.name}" updated successfully.`,
      classItem: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle class active/inactive (Admin)
// @route   PATCH /api/admin/classes/:id/toggle
const toggleClassActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classDoc = await ClassLevel.findById(id);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    classDoc.isActive = !classDoc.isActive;
    await classDoc.save();

    res.status(200).json({
      success: true,
      message: `Class "${classDoc.name}" is now ${classDoc.isActive ? 'Active' : 'Inactive'}.`,
      isActive: classDoc.isActive,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign quiz to class directly (Admin)
// @route   PATCH /api/admin/classes/:id/assign-quiz
const assignQuizToClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quizId } = req.body;

    const classDoc = await ClassLevel.findById(id);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    if (quizId) {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ success: false, message: 'Quiz not found.' });
      }
      classDoc.assignedQuizId = quiz._id;
    } else {
      classDoc.assignedQuizId = null;
    }

    await classDoc.save();

    const populated = await ClassLevel.findById(classDoc._id)
      .populate('assignedQuizId', 'name numberOfQuestions status')
      .lean();

    res.status(200).json({
      success: true,
      message: `Quiz assigned to "${classDoc.name}" successfully.`,
      classItem: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete class (Admin)
// @route   DELETE /api/admin/classes/:id
const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classDoc = await ClassLevel.findById(id);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    await ClassLevel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Class "${classDoc.name}" deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveClasses,
  getAdminClasses,
  createClass,
  updateClass,
  toggleClassActive,
  assignQuizToClass,
  deleteClass,
};
