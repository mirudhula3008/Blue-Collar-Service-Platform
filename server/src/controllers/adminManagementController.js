const mongoose = require('mongoose');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const { ACCOUNT_STATUSES } = require('../models/User');
const { COMMISSION_RATE } = require('../models/Payment');
const { refundBookings } = require('../utils/refunds');
const { storeFile } = require('../utils/storage');
const { asyncHandler, httpError } = require('../utils/http');

const IST_OFFSET_MS = 330 * 60 * 1000;
const MIN_REASON = 10;
const MAX_EVIDENCE = 10;
const ACTIVE_BOOKING = ['requested', 'accepted', 'in_progress'];
const CANCELLED_GROUP = ['cancelled', 'rejected', 'cancelled_by_admin'];
// Bookings an admin suspension/block cancels. Jobs already in progress are left to finish.
const CANCEL_ON_RESTRICT = ['requested', 'accepted'];

const round = (n) => Math.round((n || 0) * 100) / 100;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pageParams = (q, def = 20) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || def, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

function startOfTodayIst() {
  const t = new Date(Date.now() + IST_OFFSET_MS);
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - IST_OFFSET_MS);
}

// Accounts created before accountStatus existed have no value; they count as active.
const statusMatch = (status) =>
  status === 'active' ? { accountStatus: { $in: [null, 'active'] } } : { accountStatus: status };

// Revenue = completed payments for completed jobs (same rule as worker earnings).
const earnedStages = [
  { $match: { status: 'completed' } },
  { $lookup: { from: 'bookings', localField: 'bookingId', foreignField: '_id', as: 'booking' } },
  { $unwind: '$booking' },
  { $match: { 'booking.status': 'completed' } },
];

// GET /api/admin/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const today = startOfTodayIst();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [roles, workerStatuses, bookingCounts, revenue, unreviewed, complaints, recentActions] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.aggregate([
      { $match: { role: 'worker' } },
      { $group: { _id: { $ifNull: ['$accountStatus', 'active'] }, count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          active: { $sum: { $cond: [{ $in: ['$status', ACTIVE_BOOKING] }, 1, 0] } },
          today: { $sum: { $cond: [{ $gte: ['$createdAt', today] }, 1, 0] } },
        },
      },
    ]),
    Payment.aggregate([
      ...earnedStages,
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          today: {
            $sum: { $cond: [{ $gte: [{ $ifNull: ['$booking.completedAt', '$completedAt'] }, today] }, '$amount', 0] },
          },
        },
      },
    ]),
    // Completed jobs the customer hasn't reviewed yet.
    Booking.aggregate([
      { $match: { status: 'completed' } },
      { $lookup: { from: 'reviews', localField: '_id', foreignField: 'bookingId', as: 'review' } },
      { $match: { review: { $size: 0 } } },
      { $count: 'n' },
    ]),
    // There is no complaints collection: count restrictive status actions in the last 7 days.
    User.aggregate([
      { $match: { role: 'worker', 'statusHistory.0': { $exists: true } } },
      { $unwind: '$statusHistory' },
      {
        $match: {
          'statusHistory.changedAt': { $gte: weekAgo },
          'statusHistory.status': { $in: ['suspended', 'blocked', 'under_review'] },
        },
      },
      { $count: 'n' },
    ]),
    User.aggregate([
      { $match: { role: 'worker', 'statusHistory.0': { $exists: true } } },
      { $unwind: '$statusHistory' },
      { $sort: { 'statusHistory.changedAt': -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: 'statusHistory.changedBy', foreignField: '_id', as: 'admin' } },
      {
        $project: {
          workerId: '$_id',
          workerName: '$name',
          status: '$statusHistory.status',
          reason: '$statusHistory.reason',
          changedAt: '$statusHistory.changedAt',
          adminName: { $first: '$admin.name' },
        },
      },
    ]),
  ]);

  const roleCount = Object.fromEntries(roles.map((r) => [r._id, r.count]));
  const workerCount = Object.fromEntries(workerStatuses.map((r) => [r._id, r.count]));
  const b = bookingCounts[0] || {};
  const rev = revenue[0] || {};
  const verification = await User.countDocuments({ role: 'worker', isVerified: false });

  res.json({
    totalUsers: (roleCount.customer || 0) + (roleCount.worker || 0) + (roleCount.admin || 0),
    totalWorkers: roleCount.worker || 0,
    totalCustomers: roleCount.customer || 0,
    activeWorkers: workerCount.active || 0,
    suspendedWorkers: workerCount.suspended || 0,
    blockedWorkers: workerCount.blocked || 0,
    underReviewWorkers: workerCount.under_review || 0,
    pendingVerification: verification,
    totalBookings: b.total || 0,
    completedBookings: b.completed || 0,
    activeBookings: b.active || 0,
    todayBookings: b.today || 0,
    totalRevenue: round(rev.total),
    totalCommission: round((rev.total || 0) * COMMISSION_RATE),
    todayRevenue: round(rev.today),
    pendingReviews: unreviewed[0]?.n || 0,
    recentComplaints: complaints[0]?.n || 0,
    recentStatusActions: recentActions,
  });
});

// Per-worker job and earnings totals for a set of worker ids.
async function workerTotals(ids) {
  const [jobs, earnings] = await Promise.all([
    Booking.aggregate([
      { $match: { workerId: { $in: ids }, status: 'completed' } },
      { $group: { _id: '$workerId', n: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { workerId: { $in: ids } } },
      ...earnedStages,
      { $group: { _id: '$workerId', total: { $sum: '$amount' } } },
    ]),
  ]);
  const jobMap = new Map(jobs.map((j) => [String(j._id), j.n]));
  const earnMap = new Map(earnings.map((e) => [String(e._id), e.total]));
  return (id) => ({ totalJobs: jobMap.get(String(id)) || 0, totalEarnings: round(earnMap.get(String(id))) });
}

// GET /api/admin/workers?status=all|active|suspended|blocked|under_review&search=&page=&limit=
const listWorkers = asyncHandler(async (req, res) => {
  const { status = 'all', search } = req.query;
  const { page, limit, skip } = pageParams(req.query);

  const filter = { role: 'worker' };
  if (status !== 'all') {
    if (!ACCOUNT_STATUSES.includes(status)) throw httpError(400, 'Invalid status filter');
    Object.assign(filter, statusMatch(status));
  }
  if (search?.trim()) {
    const re = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: re }, { email: re }, { phone: re }];
  }

  const [workers, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('name email phone profilePhoto serviceCategory averageRating totalReviews isVerified availability accountStatus createdAt')
      .lean(),
    User.countDocuments(filter),
  ]);

  const totalsFor = await workerTotals(workers.map((w) => w._id));
  res.json({
    workers: workers.map((w) => ({ ...w, accountStatus: w.accountStatus || 'active', ...totalsFor(w._id) })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

const historyWithAdmins = (worker) =>
  User.populate(worker, { path: 'statusHistory.changedBy', select: 'name email' });

// GET /api/admin/workers/:id
const getWorkerProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'Invalid worker id');

  const worker = await User.findOne({ _id: id, role: 'worker' }).lean();
  if (!worker) throw httpError(404, 'Worker not found');
  await historyWithAdmins(worker);

  const workerId = worker._id;
  const [statusCounts, earned, recentBookings, recentReviews] = await Promise.all([
    Booking.aggregate([{ $match: { workerId } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    Payment.aggregate([{ $match: { workerId } }, ...earnedStages, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Booking.find({ workerId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customerId', 'name')
      .select('customerId serviceName serviceCategory agreedPrice status paymentStatus scheduledDate scheduledTime createdAt')
      .lean(),
    Review.find({ workerId }).sort({ createdAt: -1 }).limit(10).populate('customerId', 'name').lean(),
  ]);

  const counts = Object.fromEntries(statusCounts.map((s) => [s._id, s.n]));
  const totalEarnings = earned[0]?.total || 0;

  res.json({
    ...worker,
    accountStatus: worker.accountStatus || 'active',
    statusHistory: [...(worker.statusHistory || [])].reverse(), // newest first
    stats: {
      totalBookings: Object.values(counts).reduce((a, n) => a + n, 0),
      completedJobs: counts.completed || 0,
      cancelledJobs: CANCELLED_GROUP.reduce((a, s) => a + (counts[s] || 0), 0),
      activeJobs: ACTIVE_BOOKING.reduce((a, s) => a + (counts[s] || 0), 0),
      averageRating: worker.averageRating || 0,
      totalReviews: worker.totalReviews || 0,
      totalEarnings: round(totalEarnings),
      commissionPaid: round(totalEarnings * COMMISSION_RATE),
    },
    recentBookings,
    recentReviews,
  });
});

// PATCH /api/admin/workers/:id/status   { status, reason, evidence? }
// Every change is appended to statusHistory with the admin and reason; nothing is ever removed.
const setWorkerStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'Invalid worker id');

  const { status } = req.body;
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
  if (!ACCOUNT_STATUSES.includes(status)) {
    throw httpError(400, `Status must be one of: ${ACCOUNT_STATUSES.join(', ')}`);
  }
  if (reason.length < MIN_REASON) {
    throw httpError(400, `A reason of at least ${MIN_REASON} characters is required for every status change`);
  }
  if (reason.length > 2000) throw httpError(400, 'Reason must be 2000 characters or fewer');

  const evidence = Array.isArray(req.body.evidence) ? req.body.evidence : req.body.evidence ? [req.body.evidence] : [];
  if (evidence.length > MAX_EVIDENCE) throw httpError(400, `At most ${MAX_EVIDENCE} evidence links`);
  if (!evidence.every((url) => typeof url === 'string' && /^https?:\/\/\S+$/i.test(url))) {
    throw httpError(400, 'Evidence must be a list of http(s) URLs');
  }

  const current = await User.findOne({ _id: id, role: 'worker' }).select('accountStatus');
  if (!current) throw httpError(404, 'Worker not found');
  const currentStatus = current.accountStatus || 'active';
  if (currentStatus === status) throw httpError(409, `Worker is already ${status.replace('_', ' ')}`);

  // Conditional on the status we just read, so two admins can't apply conflicting changes at once.
  const worker = await User.findOneAndUpdate(
    { _id: id, role: 'worker', ...statusMatch(currentStatus) },
    {
      $set: { accountStatus: status },
      $push: { statusHistory: { status, reason, evidence, changedBy: req.user._id, changedAt: new Date() } },
    },
    { new: true, runValidators: true }
  );
  if (!worker) throw httpError(409, 'This worker was just updated by someone else. Please refresh.');

  let cancelledBookings = 0;
  let refundedPayments = 0;
  if (status === 'suspended' || status === 'blocked') {
    const affected = await Booking.find({ workerId: worker._id, status: { $in: CANCEL_ON_RESTRICT } }).select('_id');
    const ids = affected.map((b) => b._id);
    if (ids.length) {
      const result = await Booking.updateMany({ _id: { $in: ids }, status: { $in: CANCEL_ON_RESTRICT } }, { status: 'cancelled_by_admin' });
      cancelledBookings = result.modifiedCount;
      refundedPayments = await refundBookings(ids);
    }
  }

  const obj = worker.toJSON();
  await historyWithAdmins(obj);
  res.json({ worker: { ...obj, statusHistory: [...obj.statusHistory].reverse() }, cancelledBookings, refundedPayments });
});

// GET /api/admin/workers/:id/status-history   (newest first)
const getStatusHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'Invalid worker id');
  const worker = await User.findOne({ _id: id, role: 'worker' }).select('name accountStatus statusHistory').lean();
  if (!worker) throw httpError(404, 'Worker not found');
  await historyWithAdmins(worker);
  res.json({
    workerId: worker._id,
    name: worker.name,
    accountStatus: worker.accountStatus || 'active',
    history: [...(worker.statusHistory || [])].reverse(),
  });
});

// POST /api/admin/evidence   (multipart field "evidence", image) → { url }
const uploadEvidence = asyncHandler(async (req, res) => {
  if (!req.file) throw httpError(400, 'Attach an image (field "evidence")');
  res.status(201).json({ url: await storeFile(req.file, 'evidence', req) });
});

// GET /api/admin/customers?search=&page=&limit=
const listCustomers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const filter = { role: 'customer' };
  if (req.query.search?.trim()) {
    const re = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ name: re }, { email: re }, { phone: re }];
  }

  const [customers, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('name email phone address createdAt').lean(),
    User.countDocuments(filter),
  ]);

  const ids = customers.map((c) => c._id);
  const [bookings, spent] = await Promise.all([
    Booking.aggregate([{ $match: { customerId: { $in: ids } } }, { $group: { _id: '$customerId', n: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { customerId: { $in: ids }, status: 'completed' } },
      { $group: { _id: '$customerId', total: { $sum: '$amount' } } },
    ]),
  ]);
  const bookingMap = new Map(bookings.map((b) => [String(b._id), b.n]));
  const spentMap = new Map(spent.map((s) => [String(s._id), s.total]));

  res.json({
    customers: customers.map((c) => ({
      ...c,
      totalBookings: bookingMap.get(String(c._id)) || 0,
      totalSpent: round(spentMap.get(String(c._id))),
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// GET /api/admin/bookings?status=all|requested|accepted|in_progress|completed|cancelled&page=&limit=
const listBookings = asyncHandler(async (req, res) => {
  const { status = 'all' } = req.query;
  const { page, limit, skip } = pageParams(req.query);

  const filter = {};
  if (status === 'cancelled') filter.status = { $in: CANCELLED_GROUP };
  else if (status === 'active') filter.status = { $in: ACTIVE_BOOKING };
  else if (status !== 'all') {
    if (!['requested', 'accepted', 'in_progress', 'completed'].includes(status)) throw httpError(400, 'Invalid status filter');
    filter.status = status;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name')
      .populate('workerId', 'name')
      .select('customerId workerId serviceName serviceCategory agreedPrice status paymentStatus paymentMethod scheduledDate scheduledTime createdAt')
      .lean(),
    Booking.countDocuments(filter),
  ]);

  res.json({ bookings, total, page, pages: Math.ceil(total / limit) });
});

module.exports = {
  getDashboard,
  listWorkers,
  getWorkerProfile,
  setWorkerStatus,
  getStatusHistory,
  uploadEvidence,
  listCustomers,
  listBookings,
};
