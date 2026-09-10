const express = require('express');
const router = express.Router();
const { getActiveClasses } = require('../controllers/classController');

// @route   GET /api/classes
// @desc    Get active classes with assigned quiz details for student portal
// @access  Public
router.get('/', getActiveClasses);

module.exports = router;
