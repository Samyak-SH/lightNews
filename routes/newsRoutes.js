// routes/newsRoutes.js
const express = require('express');
const router = express.Router();

const {
  initFeed,
  handleSwipe,
  categoryFeed,
  listCategories
} = require('../controllers/newsController');

// /api/init
router.post('/init', initFeed);

// /api/swipe
router.post('/swipe', handleSwipe);

// /api/feed
router.get('/feed', categoryFeed);

// /api/categories
router.get('/categories', listCategories);

module.exports = router;
