const express = require('express');
const router = express.Router();
const { register, login, adminCreateUser } = require('../controllers/authController');


router.post('/register', register);


router.post('/login', login);


router.post('/admin/create-user', adminCreateUser);

module.exports = router;
