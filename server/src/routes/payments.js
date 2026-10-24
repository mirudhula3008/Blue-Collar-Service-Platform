const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/paymentController');

const router = express.Router();

router.use(protect);

router.post('/', authorize('customer'), c.createPayment);
router.patch('/:id/process', authorize('customer'), c.processPayment);
router.get('/booking/:bookingId', c.getPaymentForBooking);
router.get('/my', c.getMyPayments);

module.exports = router;
