const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, reportController.getReport);

module.exports = router;
