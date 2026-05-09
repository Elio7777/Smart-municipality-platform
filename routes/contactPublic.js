// routes/contactPublic.js
// Public contact info — citizens just need to read it (still requires login)

const express = require('express');
const router = express.Router();
const { requireCitizen } = require('../middleware/auth');
const controller = require('../controllers/contactPublic');

router.get('/', requireCitizen, controller.getAllInfo);

module.exports = router;