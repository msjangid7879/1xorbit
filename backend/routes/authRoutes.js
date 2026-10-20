const express = require('express');
const router = express.Router();
const { registerCompany, login, getUsers, addUser, updateUser, deleteUser } = require('../controllers/authController');

router.post('/register', registerCompany);
router.post('/login', login);
router.get('/users', getUsers);
router.post('/users', addUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;