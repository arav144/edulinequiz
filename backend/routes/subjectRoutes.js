const express = require('express');
const router = express.Router();
const { getSubjects } = require('../controllers/subjectController');

// Public — students can read subjects for display
router.get('/', getSubjects);

module.exports = router;
