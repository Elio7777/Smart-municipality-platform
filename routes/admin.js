// routes/admin.js
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');                                  // ← declared ONCE here
const adminDashboardController = require('../controllers/adminDashboard');
const adminReportsController = require('../controllers/adminReports');
const adminNewsController = require('../controllers/adminNews');
const serviceRequestsController = require('../controllers/serviceRequests');

// Dashboard
router.get('/stats', requireAdmin, adminDashboardController.getStats);

// Reports management
router.get('/reports', requireAdmin, adminReportsController.getAllReports);
router.get('/reports/:id', requireAdmin, adminReportsController.getReportById);
router.patch('/reports/:id/status', requireAdmin, adminReportsController.updateStatus);
router.post('/reports/:id/responses', requireAdmin, adminReportsController.addResponse);

// Categories
router.get('/categories', requireAdmin, async (req, res) => {
    const db = require('../config/db');
    try {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY name ASC');
        res.json({ categories: rows });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// News management (uses upload — image only)
router.get('/news', requireAdmin, adminNewsController.getAllNews);
router.get('/news/:id', requireAdmin, adminNewsController.getNewsById);
router.post('/news', requireAdmin, upload.single('image'), adminNewsController.createNews);
router.put('/news/:id', requireAdmin, upload.single('image'), adminNewsController.updateNews);
router.delete('/news/:id', requireAdmin, adminNewsController.deleteNews);

// Service requests management (uses upload.document — any file type)
router.get('/service-requests', requireAdmin, serviceRequestsController.getAllRequests);
router.get('/service-requests/:id', requireAdmin, serviceRequestsController.getRequestById);
router.post('/service-requests/:id/respond',
    requireAdmin,
    upload.document.single('document'),
    serviceRequestsController.respondToRequest);
// Contact & Info management
const adminContactController = require('../controllers/adminContact');

// Municipality info (singleton)
router.get('/contact/info', requireAdmin, adminContactController.getInfo);
router.put('/contact/info', requireAdmin, adminContactController.updateInfo);

// Working hours
router.get('/contact/hours', requireAdmin, adminContactController.getHours);
router.put('/contact/hours', requireAdmin, adminContactController.updateHours);

// Departments CRUD
router.get('/contact/departments', requireAdmin, adminContactController.getDepartments);
router.post('/contact/departments', requireAdmin, adminContactController.createDepartment);
router.put('/contact/departments/:id', requireAdmin, adminContactController.updateDepartment);
router.delete('/contact/departments/:id', requireAdmin, adminContactController.deleteDepartment);

// Emergency contacts CRUD
router.get('/contact/emergency', requireAdmin, adminContactController.getEmergency);
router.post('/contact/emergency', requireAdmin, adminContactController.createEmergency);
router.put('/contact/emergency/:id', requireAdmin, adminContactController.updateEmergency);
router.delete('/contact/emergency/:id', requireAdmin, adminContactController.deleteEmergency);

module.exports = router;