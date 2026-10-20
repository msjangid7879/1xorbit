const express = require('express');
const router = express.Router();
const { getTasks, createTask,updateTask, updateTaskStatus, updateTaskAssignee, deleteTask } = require('../controllers/taskController');

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/assignee', updateTaskAssignee);
router.delete('/:id', deleteTask);

module.exports = router;