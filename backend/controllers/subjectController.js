const Subject = require('../models/Subject');

// @desc  Get all subjects (public)
// @route GET /api/subjects
const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 }).lean();
    res.status(200).json({ success: true, count: subjects.length, subjects });
  } catch (error) {
    next(error);
  }
};

// @desc  Create subject (admin)
// @route POST /api/admin/subjects
const createSubject = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject name is required.' });
    }
    const subject = await Subject.create({ name: name.trim() });
    res.status(201).json({ success: true, message: 'Subject created successfully', subject });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A subject with this name already exists.' });
    }
    next(error);
  }
};

// @desc  Update subject (admin)
// @route PUT /api/admin/subjects/:id
const updateSubject = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject name is required.' });
    }
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
    res.status(200).json({ success: true, message: 'Subject updated', subject });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A subject with this name already exists.' });
    }
    next(error);
  }
};

// @desc  Delete subject (admin)
// @route DELETE /api/admin/subjects/:id
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });
    res.status(200).json({ success: true, message: 'Subject deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSubjects, createSubject, updateSubject, deleteSubject };
