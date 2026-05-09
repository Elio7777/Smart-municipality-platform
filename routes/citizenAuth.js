// routes/citizenAuth.js
// URL endpoints for citizen authentication

const express = require('express');
const router = express.Router();
const citizenAuthController = require('../controllers/citizenAuth');

// POST /api/citizens/register
router.post('/register', citizenAuthController.register);

// POST /api/citizens/login
router.post('/login', citizenAuthController.login);

// POST /api/citizens/forgot-password
router.post('/forgot-password', citizenAuthController.resetPassword);

module.exports = router;