const express = require('express');
const router = express.Router();
const { getResult, downloadResultPdf, downloadCertificatePdf } = require('../controllers/resultController');

// Student: secured by studentIdentifier query param
// Admin: secured by adminDownload=true query param (admin verifies via their own auth before calling)
router.get('/:attemptId', getResult);
router.get('/:attemptId/pdf', downloadResultPdf);
router.get('/:attemptId/certificate', downloadCertificatePdf);

module.exports = router;
