const express = require('express');
const router = express.Router();
const userMasterController = require('../controllers/userMasterController');

const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, userMasterController.getAll);
router.post('/', authenticateToken, authorizeRole('ADMIN'), userMasterController.create);
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), userMasterController.update);
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), userMasterController.delete);

module.exports = router;
