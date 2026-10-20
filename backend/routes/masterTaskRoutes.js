const express = require('express');
const router = express.Router();
const { getMasterTasks, createMasterTask, deleteMasterTask, updateMasterTask } = require('../controllers/masterTaskController');

router.get('/', getMasterTasks);
router.post('/', createMasterTask);
router.put('/:id', updateMasterTask);
router.delete('/:id', deleteMasterTask);

module.exports = router;