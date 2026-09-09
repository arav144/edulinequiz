const express = require('express');
const router = express.Router();
const { loginAdmin, changePassword, getAdminProfile } = require('../controllers/authController');
const { requireAdminAuth } = require('../middleware/authMiddleware');

router.post('/login', loginAdmin);
router.post('/change-password', requireAdminAuth, changePassword);
router.get('/me', requireAdminAuth, getAdminProfile);

module.exports = router;
