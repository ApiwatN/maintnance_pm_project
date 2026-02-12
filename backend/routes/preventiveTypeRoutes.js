const express = require('express');
const router = express.Router();
const preventiveTypeController = require('../controllers/preventiveTypeController');

const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, preventiveTypeController.getAllTypes);
router.post('/', preventiveTypeController.createType);
router.put('/:id', preventiveTypeController.updateType);
router.delete('/:id', preventiveTypeController.deleteType);

router.post('/:id/checklists', preventiveTypeController.addMasterChecklist);
router.put('/checklists/reorder', preventiveTypeController.reorderMasterChecklists);
router.put('/checklists/:itemId', preventiveTypeController.updateMasterChecklist);
router.delete('/checklists/:itemId', preventiveTypeController.deleteMasterChecklist);

module.exports = router;
