const mongoose = require('mongoose');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const { BOOKING_STATUSES } = require('../models/Booking');
const { asyncHandler, httpError } = require('../utils/http');

// Turns [{ _id: key, count }] into { key: count }, starting from `initial`.
const countsToObject = (rows, initial = {}) =>
  rows.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), { ...initial });

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/admin/stats
const getStats = asyncHandler(async (req, res) => {
  const [roles, verification, categories, bookingStatuses, reviewStats, recentUsers] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.aggregate([{ $match: { role: 'worker' } }, { $group: { _id: '$isVerified', count: { $sum: 1 } } }]),
    User.aggregate([
      { $match: { role: 'worker' } },
      { $group: { _id: '$serviceCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Review.aggregate([{ $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } }]),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email role isVerified createdAt').lean(),
  ]);

  const roleCounts = countsToObject(roles, { customer: 0, worker: 0, admin: 0 });
  const verifiedCounts = countsToObject(verification, { true: 0, false: 0 });
  const statusCounts = countsToObject(
    bookingStatuses,
    Object.fromEntries(BOOKING_STATUSES.map((s) => [s, 0]))
  );

  res.json({
    users: {
      total: roleCounts.customer + roleCounts.worker + roleCounts.admin,
      customers: roleCounts.customer,
      workers: roleCounts.worker,
      admins: roleCounts.admin,
    },
    workers: {
      verified: verifiedCounts.true,
      pendingVerification: verifiedCounts.false,
      byCategory: categories.map((c) => ({ category: c._id || 'unknown', count: c.count })),
    },
    bookings: {
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      byStatus: statusCounts,
    },
    reviews: {
      total: reviewStats[0]?.count || 0,
      averageRating: reviewStats[0] ? Math.round(reviewStats[0].average * 10) / 10 : 0,
    },
    recentUsers,
  });
});

// GET /api/admin/users?role=&verified=true|false&search=&page=1&limit=20
const listUsers = asyncHandler(async (req, res) => {
  const { role, verified, search } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const filter = {};
  if (role) {
    if (!['customer', 'worker', 'admin'].includes(role)) throw httpError(400, 'Invalid role filter');
    filter.role = role;
  }
  if (verified === 'true' || verified === 'false') {
    filter.role = 'worker';
    filter.isVerified = verified === 'true';
  }
  if (search?.trim()) {
    const re = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: re }, { email: re }, { phone: re }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name email phone role profilePhoto serviceCategory isVerified idProofUrl averageRating totalReviews availability address createdAt')
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({ users, total, page, pages: Math.ceil(total / limit) });
});

// PUT /api/admin/workers/:id/verify   { isVerified: true | false }  (defaults to true)
const setWorkerVerification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'Invalid worker id');

  const isVerified = req.body.isVerified === undefined ? true : req.body.isVerified === true || req.body.isVerified === 'true';

  const worker = await User.findOne({ _id: id, role: 'worker' });
  if (!worker) throw httpError(404, 'Worker not found');

  worker.isVerified = isVerified;
  await worker.save();
  res.json(worker);
});

module.exports = { getStats, listUsers, setWorkerVerification };
