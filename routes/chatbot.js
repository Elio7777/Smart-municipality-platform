// routes/chatbot.js
const express = require('express');
const router = express.Router();
const { requireCitizen } = require('../middleware/auth');
const chatbotController = require('../controllers/chatbot');

// Citizens must be logged in to use the chatbot (prevents API abuse)
router.post('/', requireCitizen, chatbotController.chat);

module.exports = router;