const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, getGroups, createGroup, deleteMessage, markAsRead } = require('../controllers/chatController');

router.get('/', getMessages);
router.post('/', sendMessage);
router.post('/read', markAsRead); // ✅ Corrected path '/read'
router.get('/groups', getGroups);
router.post('/groups', createGroup);
router.delete('/:id', deleteMessage);

module.exports = router;