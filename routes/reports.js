// routes/reports.js
// URL endpoints for reports

const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports');
const { requireCitizen } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Categories (used by the submit form)
router.get('/categories', requireCitizen, reportsController.getCategories);


// Citizen's own reports
router.get('/my', requireCitizen, reportsController.getMyReports);
router.get('/my/stats', requireCitizen, reportsController.getMyStats);
// Public map endpoints
router.get('/public', requireCitizen, reportsController.getPublicReports);
router.get('/public/:id', requireCitizen, reportsController.getPublicReportById);
router.get('/:id', requireCitizen, reportsController.getReportById);

// Submit a new report (with photo)
router.post('/', requireCitizen, upload.single('photo'), reportsController.submitReport);

// Delete a report
router.delete('/:id', requireCitizen, reportsController.deleteReport);

module.exports = router;