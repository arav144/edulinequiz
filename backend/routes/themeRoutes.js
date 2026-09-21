const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/authMiddleware');
const {
  uploadThemeImage,
  getTheme,
  updateTheme,
  uploadThemeAsset,
} = require('../controllers/themeController');

// ─── Public / Admin Route to Get Theme ─────────────────────────────────────────
// Both GET /api/theme and GET /api/admin/theme resolve here
router.get('/', getTheme);

// ─── Admin Protected Routes ───────────────────────────────────────────────────
// PUT /api/admin/theme (or PUT /api/theme)
router.put('/', requireAdminAuth, updateTheme);

// POST /api/admin/theme/upload (or POST /api/theme/upload)
router.post('/upload', requireAdminAuth, uploadThemeImage.single('image'), uploadThemeAsset);

// Backward-compat in case /admin subpath is hit
router.get('/admin', requireAdminAuth, getTheme);
router.put('/admin', requireAdminAuth, updateTheme);
router.post('/admin/upload', requireAdminAuth, uploadThemeImage.single('image'), uploadThemeAsset);

module.exports = router;
