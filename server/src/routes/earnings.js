const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/earningsController');

const router = express.Router();

router.use(protect, authorize('worker'));

router.get('/summary', c.getSummary);
router.get('/history', c.getHistory);
router.get('/transactions', c.getTransactions);

module.exports = router;
