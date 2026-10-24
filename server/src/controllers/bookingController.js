const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const User = require('../models/User');
const { ACTIONS, ACTIVE_STATUSES } = require('../utils/bookingStatus');
const { asyncHandler, httpError } = require('../utils/http');
const { parseLocation } = require('../utils/validation');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS_AHEAD = 60;

const PARTY_FIELDS = 'name phone profilePhoto serviceCategory averageRating totalReviews address';

// Phone numbers are shared only once the worker has accepted the job.
const PHONE_VISIBLE = ['accepted', 'in_progress', 'completed'];

function serialize(booking, reviewedIds) {
  const b = booking.toObject ? booking.toObject() : booking;
  if (!PHONE_VISIBLE.includes(b.status)) {
    if (b.customerId?.phone) b.customerId.phone = undefined;
    if (b.workerId?.phone) b.workerId.phone = undefined;
  }
  if (reviewedIds) b.reviewed = reviewedIds.has(String(b._id));
  return b;
}

async function reviewedSet(bookings) {
  const completed = bookings.filter((b) => b.status === 'completed').map((b) => b._id);
  if (!completed.length) return new Set();
  const reviews = await Review.find({ bookingId: { $in: completed } }).select('bookingId').lean();
  return new Set(reviews.map((r) => String(r.bookingId)));
}

// ?status=active | completed | cancelled | <exact status>
function statusFilter(status) {
  if (!status) return {};
  if (status === 'active') return { status: { $in: ACTIVE_STATUSES } };
  if (status === 'cancelled') return { status: { $in: ['cancelled', 'rejected'] } };
  if (Object.values(ACTIONS).some((a) => a.to === status) || status === 'requested') return { status };
  throw httpError(400, `Unknown status filter "${status}"`);
}

// POST /api/bookings   (customer)
// { workerId, serviceName, description, scheduledDate: 'YYYY-MM-DD', scheduledTime: 'HH:MM', agreedPrice, lat?, lng? }
const createBooking = asyncHandler(async (req, res) => {
  const { workerId, serviceName, description = '', scheduledDate, scheduledTime } = req.body;

  if (!mongoose.isValidObjectId(workerId)) throw httpError(400, 'A valid workerId is required');
  if (!DATE_RE.test(scheduledDate || '')) throw httpError(400, 'scheduledDate must be YYYY-MM-DD');
  if (!TIME_RE.test(scheduledTime || '')) throw httpError(400, 'scheduledTime must be HH:MM (24-hour)');
  if (String(description).length > 1000) throw httpError(400, 'Description must be 1000 characters or fewer');

  const date = new Date(`${scheduledDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw httpError(400, 'Invalid scheduledDate');
  // Compare by calendar day with a day of slack so time zones never block "today".
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  if (date < new Date(today - DAY_MS)) throw httpError(400, 'You cannot book a date in the past');
  if (date > new Date(today.getTime() + MAX_DAYS_AHEAD * DAY_MS)) {
    throw httpError(400, `You can book at most ${MAX_DAYS_AHEAD} days ahead`);
  }

  const worker = await User.findOne({ _id: workerId, role: 'worker' });
  if (!worker) throw httpError(404, 'Worker not found');
  if (!worker.isVerified) throw httpError(400, 'This worker is not verified yet');
  if (!worker.availability) throw httpError(400, 'This worker is not taking new jobs right now');

  const service = (worker.services || []).find((s) => s.name === serviceName);
  if (!service) throw httpError(400, 'Please choose one of the services this worker offers');

  // Fixed-price workers always get their listed price; negotiable ones get the customer's offer.
  let agreedPrice = service.price;
  if (worker.isNegotiable && req.body.agreedPrice !== undefined && req.body.agreedPrice !== '') {
    agreedPrice = Number(req.body.agreedPrice);
    if (!Number.isFinite(agreedPrice) || agreedPrice <= 0) throw httpError(400, 'Please enter a valid price');
  }

  const duplicate = await Booking.exists({
    customerId: req.user._id,
    workerId,
    scheduledDate: date,
    scheduledTime,
    status: { $in: ACTIVE_STATUSES },
  });
  if (duplicate) throw httpError(409, 'You already have a booking with this worker at that time');

  const customerLocation =
    parseLocation(req.body.lat, req.body.lng) ||
    (req.user.location?.coordinates?.length === 2 ? req.user.location : undefined);

  const booking = await Booking.create({
    customerId: req.user._id,
    workerId,
    serviceCategory: worker.serviceCategory,
    serviceName: service.name,
    description: String(description).trim(),
    scheduledDate: date,
    scheduledTime,
    agreedPrice,
    customerLocation,
  });

  await booking.populate([
    { path: 'workerId', select: PARTY_FIELDS },
    { path: 'customerId', select: PARTY_FIELDS },
  ]);
  res.status(201).json(serialize(booking));
});

const listBookings = (field) =>
  asyncHandler(async (req, res) => {
    const filter = { [field]: req.user._id, ...statusFilter(req.query.status) };
    const bookings = await Booking.find(filter)
      .sort({ scheduledDate: -1, scheduledTime: -1, createdAt: -1 })
      .limit(200)
      .populate('workerId', PARTY_FIELDS)
      .populate('customerId', PARTY_FIELDS);
    const reviewed = await reviewedSet(bookings);
    res.json(bookings.map((b) => serialize(b, reviewed)));
  });

// GET /api/bookings/customer   (customer)
const getCustomerBookings = listBookings('customerId');

// GET /api/bookings/worker   (worker)
const getWorkerBookings = listBookings('workerId');

// GET /api/bookings/:id   (the booking's customer or worker, or admin)
const getBooking = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, 'Invalid booking id');
  const booking = await Booking.findById(req.params.id)
    .populate('workerId', PARTY_FIELDS)
    .populate('customerId', PARTY_FIELDS);
  if (!booking) throw httpError(404, 'Booking not found');

  const me = String(req.user._id);
  const isParty = String(booking.customerId._id) === me || String(booking.workerId._id) === me;
  if (!isParty && req.user.role !== 'admin') throw httpError(403, 'You do not have access to this booking');

  res.json(serialize(booking, await reviewedSet([booking])));
});

// PUT /api/bookings/:id/{accept|reject|start|complete|cancel}
const changeStatus = (actionName) =>
  asyncHandler(async (req, res) => {
    const action = ACTIONS[actionName];
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw httpError(400, 'Invalid booking id');

    const ownerField = action.role === 'worker' ? 'workerId' : 'customerId';
    const booking = await Booking.findById(id);
    if (!booking) throw httpError(404, 'Booking not found');
    if (!booking[ownerField].equals(req.user._id)) throw httpError(403, 'This booking does not belong to you');
    if (!action.from.includes(booking.status)) {
      throw httpError(409, `Cannot ${actionName} a booking that is ${booking.status.replace('_', ' ')}`);
    }

    const update = { status: action.to };
    if (action.to === 'completed') update.completedAt = new Date();

    // Conditional update so two clicks (or two devices) can't both apply.
    const updated = await Booking.findOneAndUpdate({ _id: id, status: { $in: action.from } }, update, { new: true })
      .populate('workerId', PARTY_FIELDS)
      .populate('customerId', PARTY_FIELDS);
    if (!updated) throw httpError(409, 'This booking was just updated. Please refresh.');

    res.json(serialize(updated, await reviewedSet([updated])));
  });

module.exports = {
  createBooking,
  getCustomerBookings,
  getWorkerBookings,
  getBooking,
  acceptBooking: changeStatus('accept'),
  rejectBooking: changeStatus('reject'),
  startBooking: changeStatus('start'),
  completeBooking: changeStatus('complete'),
  cancelBooking: changeStatus('cancel'),
};
