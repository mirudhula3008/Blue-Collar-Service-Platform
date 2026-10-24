const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/bookingController');

const router = express.Router();

router.use(protect);

router.post('/', authorize('customer'), c.createBooking);
router.get('/customer', authorize('customer'), c.getCustomerBookings);
router.get('/worker', authorize('worker'), c.getWorkerBookings);
router.get('/:id', c.getBooking);

router.put('/:id/accept', authorize('worker'), c.acceptBooking);
router.put('/:id/reject', authorize('worker'), c.rejectBooking);
router.put('/:id/start', authorize('worker'), c.startBooking);
router.put('/:id/complete', authorize('worker'), c.completeBooking);
router.put('/:id/cancel', authorize('customer'), c.cancelBooking);

module.exports = router;
