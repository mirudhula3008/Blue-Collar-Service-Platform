const Payment = require('../models/Payment');
const { COMMISSION_RATE } = require('../models/Payment');
const { asyncHandler, httpError } = require('../utils/http');

// All period boundaries use Indian Standard Time (UTC+5:30, no DST).
const TZ = 'Asia/Kolkata';
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const round = (n) => Math.round((n || 0) * 100) / 100;
const commissionOf = (amount) => round(amount * COMMISSION_RATE);
const netOf = (amount) => round(amount - commissionOf(amount));

// Wall-clock parts of `date` in IST, read from a shifted UTC date.
const ist = (date) => new Date(date.getTime() + IST_OFFSET_MS);
// Converts an IST wall-clock (as UTC fields) back to a real instant.
const fromIst = (y, m, d) => new Date(Date.UTC(y, m, d) - IST_OFFSET_MS);

function boundaries(now = new Date()) {
  const t = ist(now);
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth();
  const d = t.getUTCDate();
  const mondayOffset = (t.getUTCDay() + 6) % 7; // Mon = 0
  return {
    today: fromIst(y, m, d),
    week: fromIst(y, m, d - mondayOffset),
    month: fromIst(y, m, 1),
  };
}

// Completed payments for jobs that are actually done. `earnedAt` is when the
// job was completed — money for a job that hasn't happened isn't earned yet.
const earnedPipeline = (workerId) => [
  { $match: { workerId, status: 'completed' } },
  { $lookup: { from: 'bookings', localField: 'bookingId', foreignField: '_id', as: 'booking' } },
  { $unwind: '$booking' },
  { $match: { 'booking.status': 'completed' } },
  { $addFields: { earnedAt: { $ifNull: ['$booking.completedAt', '$completedAt'] } } },
];

const sumIf = (cond, value) => ({ $sum: { $cond: [cond, value, 0] } });

function period(earnings, jobs) {
  return { earnings: round(earnings), jobs, commission: commissionOf(earnings), net: netOf(earnings) };
}

// GET /api/earnings/summary
const getSummary = asyncHandler(async (req, res) => {
  const { today, week, month } = boundaries();
  const workerId = req.user._id;

  const [[totals = {}], [awaiting = {}]] = await Promise.all([
    Payment.aggregate([
      ...earnedPipeline(workerId),
      {
        $group: {
          _id: null,
          lifetime: { $sum: '$amount' },
          lifetimeJobs: { $sum: 1 },
          today: sumIf({ $gte: ['$earnedAt', today] }, '$amount'),
          todayJobs: sumIf({ $gte: ['$earnedAt', today] }, 1),
          week: sumIf({ $gte: ['$earnedAt', week] }, '$amount'),
          weekJobs: sumIf({ $gte: ['$earnedAt', week] }, 1),
          month: sumIf({ $gte: ['$earnedAt', month] }, '$amount'),
          monthJobs: sumIf({ $gte: ['$earnedAt', month] }, 1),
          unsettled: sumIf({ $ne: ['$settled', true] }, '$amount'),
        },
      },
    ]),
    // Paid up front for jobs still to be done.
    Payment.aggregate([
      { $match: { workerId, status: 'completed' } },
      { $lookup: { from: 'bookings', localField: 'bookingId', foreignField: '_id', as: 'booking' } },
      { $unwind: '$booking' },
      { $match: { 'booking.status': { $in: ['requested', 'accepted', 'in_progress'] } } },
      { $group: { _id: null, amount: { $sum: '$amount' }, jobs: { $sum: 1 } } },
    ]),
  ]);

  const lifetime = totals.lifetime || 0;
  const lifetimeJobs = totals.lifetimeJobs || 0;

  res.json({
    today: period(totals.today, totals.todayJobs || 0),
    thisWeek: period(totals.week, totals.weekJobs || 0),
    thisMonth: period(totals.month, totals.monthJobs || 0),
    totalLifetime: period(lifetime, lifetimeJobs),
    commissionRate: COMMISSION_RATE,
    platformCommission: commissionOf(lifetime),
    netEarnings: {
      today: netOf(totals.today),
      thisWeek: netOf(totals.week),
      thisMonth: netOf(totals.month),
      lifetime: netOf(lifetime),
    },
    // What the platform still owes the worker (their share of unsettled payments).
    pendingPayouts: netOf(totals.unsettled),
    awaitingCompletion: { amount: round(awaiting.amount), jobs: awaiting.jobs || 0 },
    averageRating: req.user.averageRating || 0,
    totalReviews: req.user.totalReviews || 0,
    averageJobValue: lifetimeJobs ? round(lifetime / lifetimeJobs) : 0,
  });
});

// GET /api/earnings/history?period=daily|weekly|monthly
// daily: last 7 days · weekly: last 4 weeks (Mon–Sun) · monthly: last 6 months. Gaps are zero-filled.
const getHistory = asyncHandler(async (req, res) => {
  const periodName = req.query.period || 'daily';
  if (!['daily', 'weekly', 'monthly'].includes(periodName)) {
    throw httpError(400, 'period must be daily, weekly or monthly');
  }

  const { today, week } = boundaries();
  const t = ist(new Date());
  let buckets;
  let groupKey;

  if (periodName === 'daily') {
    buckets = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(today.getTime() - (6 - i) * DAY_MS);
      const s = ist(start);
      return { key: s.toISOString().slice(0, 10), start, label: `${MONTHS[s.getUTCMonth()]} ${s.getUTCDate()}` };
    });
    groupKey = { $dateToString: { format: '%Y-%m-%d', date: '$earnedAt', timezone: TZ } };
  } else if (periodName === 'weekly') {
    buckets = Array.from({ length: 4 }, (_, i) => {
      const start = new Date(week.getTime() - (3 - i) * 7 * DAY_MS);
      const s = ist(start);
      return {
        key: s.toISOString().slice(0, 10),
        start,
        label: i === 3 ? 'This week' : `Week of ${MONTHS[s.getUTCMonth()]} ${s.getUTCDate()}`,
      };
    });
    groupKey = {
      $dateToString: {
        format: '%Y-%m-%d',
        date: { $dateTrunc: { date: '$earnedAt', unit: 'week', startOfWeek: 'monday', timezone: TZ } },
        timezone: TZ,
      },
    };
  } else {
    buckets = Array.from({ length: 6 }, (_, i) => {
      const y = t.getUTCFullYear();
      const m = t.getUTCMonth() - (5 - i);
      const s = new Date(Date.UTC(y, m, 1));
      return {
        key: `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, '0')}`,
        start: fromIst(s.getUTCFullYear(), s.getUTCMonth(), 1),
        label: MONTHS[s.getUTCMonth()],
      };
    });
    groupKey = { $dateToString: { format: '%Y-%m', date: '$earnedAt', timezone: TZ } };
  }

  const rows = await Payment.aggregate([
    ...earnedPipeline(req.user._id),
    { $match: { earnedAt: { $gte: buckets[0].start } } },
    { $group: { _id: groupKey, earnings: { $sum: '$amount' }, jobs: { $sum: 1 } } },
  ]);
  const byKey = new Map(rows.map((r) => [r._id, r]));

  const labelField = { daily: 'date', weekly: 'week', monthly: 'month' }[periodName];
  res.json(
    buckets.map((b) => {
      const row = byKey.get(b.key) || { earnings: 0, jobs: 0 };
      // `start` (ISO) lets clients format the label in their own language.
      return { [labelField]: b.label, label: b.label, start: b.start.toISOString(), earnings: round(row.earnings), net: netOf(row.earnings), jobs: row.jobs };
    })
  );
});

// GET /api/earnings/transactions?page=1&limit=20
const getTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);

  const [result] = await Payment.aggregate([
    ...earnedPipeline(req.user._id),
    { $sort: { earnedAt: -1 } },
    {
      $facet: {
        total: [{ $count: 'n' }],
        items: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $lookup: { from: 'users', localField: 'customerId', foreignField: '_id', as: 'customer' } },
          { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              transactionId: 1,
              amount: 1,
              method: 1,
              methodDetails: 1,
              settled: 1,
              earnedAt: 1,
              serviceName: '$booking.serviceName',
              serviceCategory: '$booking.serviceCategory',
              bookingId: '$booking._id',
              customerName: '$customer.name',
            },
          },
        ],
      },
    },
  ]);

  const total = result.total[0]?.n || 0;
  res.json({
    transactions: result.items.map((p) => ({
      ...p,
      commission: commissionOf(p.amount),
      net: netOf(p.amount),
      // Never send method internals beyond what a worker needs.
      methodLabel: methodLabel(p.method, p.methodDetails),
      methodDetails: undefined,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

function methodLabel(method, details = {}) {
  if (method === 'card') return `${details.brand || 'Card'} ••${details.last4 || ''}`;
  if (method === 'upi') return 'UPI';
  if (method === 'wallet') return { paytm: 'Paytm', amazonpay: 'Amazon Pay', phonepe: 'PhonePe' }[details.wallet] || 'Wallet';
  return 'Cash';
}

module.exports = { getSummary, getHistory, getTransactions, methodLabel };
