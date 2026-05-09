// routes/serviceRequests.js
const express = require('express');
const router = express.Router();
const { requireCitizen } = require('../middleware/auth');
const controller = require('../controllers/serviceRequests');

// Citizen endpoints
router.post('/', requireCitizen, controller.submitRequest);
router.get('/my', requireCitizen, controller.getMyRequests);
router.delete('/:id', requireCitizen, controller.deleteMyRequest);

module.exports = router;