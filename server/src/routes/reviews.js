const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { createReview, getWorkerReviews, getBookingReview } = require('../controllers/reviewController');

const router = express.Router();

router.post('/', protect, authorize('customer'), createReview);
router.get('/worker/:id', getWorkerReviews);
router.get('/booking/:bookingId', protect, getBookingReview);

module.exports = router;
