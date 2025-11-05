// routes/userRoutes.js
const express = require('express');
const router = express.Router();

const {
  getPreferences,
  updateFilters
} = require('../controllers/userController');

// /api/user/:id/preferences
router.get('/user/:id/preferences', getPreferences);

// /api/user/:id/filters  (PATCH)
router.patch('/user/:id/filters', updateFilters);

module.exports = router;
