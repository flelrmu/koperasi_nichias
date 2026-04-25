const express = require('express');
const router = express.Router();
const { register, login, adminCreateUser } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/admin/create-user
router.post('/admin/create-user', adminCreateUser);

module.exports = router;
