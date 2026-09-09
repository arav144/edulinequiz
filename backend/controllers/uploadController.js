const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// ─── Image Upload Storage ────────────────────────────────────────────────────
const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'quiz-system/questions/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpg, jpeg, png, gif, webp).'), false);
    }
  },
});

// ─── Audio Upload Storage ────────────────────────────────────────────────────
const audioStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'quiz-system/questions/audio',
    allowed_formats: ['mp3', 'wav', 'm4a', 'ogg', 'aac'],
    resource_type: 'video', // Cloudinary uses 'video' type for audio
  },
});

const audioUpload = multer({
  storage: audioStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg', 'audio/aac', 'audio/x-m4a'];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed (mp3, wav, m4a, ogg, aac).'), false);
    }
  },
});

// ─── Upload Image Handler ────────────────────────────────────────────────────
// @route POST /api/admin/upload/image
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: req.file.path,
      publicId: req.file.filename,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Upload Audio Handler ────────────────────────────────────────────────────
// @route POST /api/admin/upload/audio
const uploadAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio file provided.' });
    }
    res.status(200).json({
      success: true,
      message: 'Audio uploaded successfully',
      audioUrl: req.file.path,
      publicId: req.file.filename,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Delete Cloudinary Asset ─────────────────────────────────────────────────
// @route DELETE /api/admin/upload/:publicId
const deleteAsset = async (req, res, next) => {
  try {
    const { publicId, resourceType } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'Public ID is required.' });
    }
    const type = resourceType === 'audio' ? 'video' : 'image';
    await cloudinary.uploader.destroy(publicId, { resource_type: type });
    res.status(200).json({ success: true, message: 'Asset deleted from Cloudinary.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { imageUpload, audioUpload, uploadImage, uploadAudio, deleteAsset };
