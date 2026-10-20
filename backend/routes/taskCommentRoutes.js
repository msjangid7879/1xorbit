const express = require('express');
const router = express.Router();
const { getTaskComments, addTaskComment, markTaskCommentsRead, getUnreadCounts } = require('../controllers/taskCommentController');

// ✅ Corrected routes
router.get('/unread/counts', getUnreadCounts);
router.get('/:task_id', getTaskComments);
router.post('/:task_id', addTaskComment);
router.post('/:task_id/read', markTaskCommentsRead);

module.exports = router;