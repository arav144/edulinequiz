const express = require('express');
const router = express.Router();
const { requireAdminAuth } = require('../middleware/authMiddleware');
const { imageUpload, audioUpload, uploadImage, uploadAudio, deleteAsset } = require('../controllers/uploadController');

// All upload routes are admin-protected
router.use(requireAdminAuth);

router.post('/image', imageUpload.single('image'), uploadImage);
router.post('/audio', audioUpload.single('audio'), uploadAudio);
router.delete('/asset', deleteAsset);

module.exports = router;
