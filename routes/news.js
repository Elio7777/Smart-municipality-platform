// routes/news.js
// URL endpoints for news + comments

const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news');
const { requireCitizen } = require('../middleware/auth');

// Public-ish (still requires login because the platform is gated)
// But we'll let the frontend send token for these too
router.get('/', requireCitizen, newsController.getAllNews);
router.get('/:id', requireCitizen, newsController.getNewsById);

// Protected — comment actions
router.post('/:id/comments', requireCitizen, newsController.addComment);
router.delete('/comments/:commentId', requireCitizen, newsController.deleteComment);

module.exports = router;