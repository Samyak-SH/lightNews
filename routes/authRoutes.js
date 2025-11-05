// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

router.post('/auth/register', register);
router.post('/auth/login', login);

module.exports = router;
