const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/stats', authenticateToken, dashboardController.getDashboardStats);
router.get('/operator-stats', dashboardController.getOperatorStats);

module.exports = router;
