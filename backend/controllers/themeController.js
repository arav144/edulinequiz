const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Theme = require('../models/Theme');

// Multer Memory Storage for Theme Assets (Prevents EROFS error on Vercel Serverless)
const storage = multer.memoryStorage();

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

    let uploadedUrl = null;
    let fileId = null;

    // 1. Primary: Upload to Cloudinary CDN (Works seamlessly in serverless / Vercel)
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'quiz-system/theme',
            resource_type: 'image',
          },
          (error, res) => {
            if (error) return reject(error);
            resolve(res);
          }
        );
        stream.end(req.file.buffer);
      });

      if (result && result.secure_url) {
        uploadedUrl = result.secure_url;
        fileId = result.public_id;
      }
    } catch (cloudErr) {
      console.warn('Cloudinary upload failed for theme asset, trying fallback:', cloudErr.message || cloudErr);
    }

    // 2. Secondary: If Cloudinary fails and local disk is writable (development / non-Vercel)
    if (!uploadedUrl && !process.env.VERCEL) {
      try {
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
        const sanitizedBase = path
          .basename(req.file.originalname, ext)
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 30);
        const filename = `theme_${sanitizedBase}_${Date.now()}${ext}`;
        fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
        uploadedUrl = `/uploads/${filename}`;
        fileId = filename;
      } catch (diskErr) {
        console.warn('Local disk write failed:', diskErr.message);
      }
    }

    // 3. Guaranteed Serverless Fallback: Base64 Data URI (Never throws EROFS error)
    if (!uploadedUrl) {
      const mime = req.file.mimetype || 'image/jpeg';
      uploadedUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
      fileId = `theme_data_${Date.now()}`;
    }

    res.status(200).json({
      success: true,
      message: 'Theme asset uploaded successfully',
      url: uploadedUrl,
      filename: fileId,
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
