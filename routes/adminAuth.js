// routes/adminAuth.js
// URL endpoints for admin authentication

const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuth');

// POST /api/admins/login
router.post('/login', adminAuthController.login);

module.exports = router;