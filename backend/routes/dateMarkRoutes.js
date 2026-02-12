const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { getDateMarks, createDateMark, deleteDateMark, deleteDateMarkByDate } = require('../controllers/dateMarkController');

// All routes require authentication
router.get('/', authenticateToken, getDateMarks);
router.post('/', authenticateToken, createDateMark);
router.delete('/:id', authenticateToken, deleteDateMark);
router.delete('/', authenticateToken, deleteDateMarkByDate);

module.exports = router;
