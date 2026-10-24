const express = require('express');
const { categories } = require('../data/categories');

const router = express.Router();

// GET /api/categories
router.get('/', (req, res) => {
  res.json(categories);
});

module.exports = router;
