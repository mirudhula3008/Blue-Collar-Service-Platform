const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { recalculateWorkerRating } = require('../utils/ratings');
const { asyncHandler, httpError } = require('../utils/http');

const CUSTOMER_FIELDS = 'name profilePhoto';

// POST /api/reviews   (customer)  { bookingId, rating, comment }
// One review per completed booking, written by the booking's customer.
const createReview = asyncHandler(async (req, res) => {
  const { bookingId, comment = '' } = req.body;
  const rating = Number(req.body.rating);

  if (!mongoose.isValidObjectId(bookingId)) throw httpError(400, 'A valid bookingId is required');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw httpError(400, 'Rating must be a whole number from 1 to 5');
  }
  if (String(comment).length > 1000) throw httpError(400, 'Comment must be 1000 characters or fewer');

  const booking = await Booking.findById(bookingId);
  if (!booking) throw httpError(404, 'Booking not found');
  if (!booking.customerId.equals(req.user._id)) throw httpError(403, 'You can only review your own bookings');
  if (booking.status !== 'completed') throw httpError(400, 'You can only review a job after it is completed');
  if (await Review.exists({ bookingId })) throw httpError(409, 'You have already reviewed this booking');

  let review;
  try {
    review = await Review.create({
      bookingId,
      customerId: req.user._id,
      workerId: booking.workerId,
      rating,
      comment: String(comment).trim(),
    });
  } catch (err) {
    // Two submissions racing past the exists() check above
    if (err.code === 11000) throw httpError(409, 'You have already reviewed this booking');
    throw err;
  }

  const workerRating = await recalculateWorkerRating(booking.workerId);
  await review.populate('customerId', CUSTOMER_FIELDS);
  res.status(201).json({ review, workerRating });
});

// GET /api/reviews/worker/:id?page=1&limit=10   (public)
// Includes a 1–5 star breakdown for the summary bar chart.
const getWorkerReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'Invalid worker id');

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const workerId = new mongoose.Types.ObjectId(id);

  const [reviews, breakdownRows] = await Promise.all([
    Review.find({ workerId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('customerId', CUSTOMER_FIELDS)
      .lean(),
    Review.aggregate([{ $match: { workerId } }, { $group: { _id: '$rating', count: { $sum: 1 } } }]),
  ]);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  breakdownRows.forEach((row) => {
    breakdown[row._id] = row.count;
  });
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const sum = Object.entries(breakdown).reduce((acc, [stars, count]) => acc + stars * count, 0);

  res.json({
    reviews,
    total,
    page,
    pages: Math.ceil(total / limit),
    averageRating: total ? Math.round((sum / total) * 10) / 10 : 0,
    breakdown,
  });
});

// GET /api/reviews/booking/:bookingId   (customer/worker on the booking, or admin)
// Lets the bookings page know whether to show "Leave a review". Returns { review: null } if none.
const getBookingReview = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  if (!mongoose.isValidObjectId(bookingId)) throw httpError(400, 'Invalid booking id');

  const review = await Review.findOne({ bookingId }).populate('customerId', CUSTOMER_FIELDS);
  if (!review) return res.json({ review: null });

  const me = req.user._id;
  const allowed =
    req.user.role === 'admin' || review.customerId._id.equals(me) || review.workerId.equals(me);
  if (!allowed) throw httpError(403, 'You do not have permission to view this review');

  res.json({ review });
});

module.exports = { createReview, getWorkerReviews, getBookingReview };
