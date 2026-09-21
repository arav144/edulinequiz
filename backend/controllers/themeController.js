const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Theme = require('../models/Theme');

// Ensure local upload directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage for Theme Assets
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `theme_${sanitizedBase}_${uniqueSuffix}${ext}`);
  },
});

const uploadThemeImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|svg\+xml|svg|gif/;
    const mimeMatch = allowedTypes.test(file.mimetype);
    const extMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimeMatch || extMatch) {
      return cb(null, true);
    }
    cb(new Error('Only image files (PNG, JPG, WEBP, SVG, GIF) are allowed.'));
  },
});

// Default fallback theme
const DEFAULT_THEME = {
  key: 'default',
  topRightImage: '/img/ghadhi.png',
  showTopRightImage: true,
  topRightImageWidth: 160,
  topRightTop: 80,
  topRightRight: 40,
  enableBgImage: true,
  bgImage: '/img/background.jpg',
  bgColor: '#FAF9F5',
};

// ─── Get Theme (Public) ───────────────────────────────────────────────────────
// @route GET /api/theme and /api/admin/theme
const getTheme = async (req, res, next) => {
  try {
    let theme = await Theme.findOne({ key: 'default' }).lean();
    if (!theme) {
      theme = await Theme.create(DEFAULT_THEME);
    }
    res.status(200).json({
      success: true,
      theme,
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    // Return default theme gracefully even on database hiccups
    res.status(200).json({
      success: true,
      theme: DEFAULT_THEME,
    });
  }
};

// ─── Update Theme (Admin Only) ───────────────────────────────────────────────
// @route PUT /api/admin/theme
const updateTheme = async (req, res, next) => {
  try {
    const {
      topRightImage,
      showTopRightImage,
      topRightImageWidth,
      topRightTop,
      topRightRight,
      enableBgImage,
      bgImage,
      bgColor,
    } = req.body;

    const updateData = {};
    if (typeof topRightImage === 'string') updateData.topRightImage = topRightImage.trim();
    if (typeof showTopRightImage === 'boolean') updateData.showTopRightImage = showTopRightImage;
    if (typeof topRightImageWidth === 'number' && topRightImageWidth >= 50 && topRightImageWidth <= 500) {
      updateData.topRightImageWidth = topRightImageWidth;
    }
    if (typeof topRightTop === 'number') updateData.topRightTop = Math.max(0, Math.round(topRightTop));
    if (typeof topRightRight === 'number') updateData.topRightRight = Math.max(0, Math.round(topRightRight));
    if (typeof enableBgImage === 'boolean') updateData.enableBgImage = enableBgImage;
    if (typeof bgImage === 'string') updateData.bgImage = bgImage.trim();
    if (typeof bgColor === 'string') updateData.bgColor = bgColor.trim();

    const theme = await Theme.findOneAndUpdate(
      { key: 'default' },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Theme settings updated successfully',
      theme,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Upload Theme Image Asset (Admin Only) ───────────────────────────────────
// @route POST /api/admin/theme/upload
const uploadThemeAsset = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    // Relative URL accessible via Express static serving
    const relativeUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Theme asset uploaded successfully',
      url: relativeUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadThemeImage,
  getTheme,
  updateTheme,
  uploadThemeAsset,
};
