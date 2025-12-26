const express = require('express');
const router = express.Router();
const machineMasterController = require('../controllers/machineMasterController');

const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, machineMasterController.getAll);
router.post('/', machineMasterController.create);
router.put('/:id', machineMasterController.update);
router.delete('/:id', machineMasterController.delete);

module.exports = router;
