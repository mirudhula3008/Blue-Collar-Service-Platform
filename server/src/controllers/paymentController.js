const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { PAYMENT_METHODS } = require('../models/Payment');
const { asyncHandler, httpError } = require('../utils/http');

// Simulated gateway: no money moves. Processing waits this long, then succeeds
// (except for the documented test card that always fails).
const GATEWAY_DELAY_MS = 2000;
const FAILING_TEST_CARD = '4000000000000002';

const UPI_RE = /^[\w.-]{2,}@[a-zA-Z]{2,}$/;
const UPI_APPS = ['gpay', 'phonepe', 'paytm'];
const WALLETS = ['paytm', 'amazonpay', 'phonepe'];
const CLOSED_BOOKING = ['rejected', 'cancelled', 'cancelled_by_admin'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cardBrand(number) {
  if (/^4/.test(number)) return 'Visa';
  if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'Mastercard';
  if (/^6/.test(number)) return 'RuPay';
  if (/^3[47]/.test(number)) return 'Amex';
  return 'Card';
}

// Validates the method-specific input and returns only what is safe to store.
function methodDetailsFor(method, input = {}) {
  switch (method) {
    case 'upi': {
      const upiId = String(input.upiId || '').trim().toLowerCase();
      if (!UPI_RE.test(upiId)) throw httpError(400, 'Enter a valid UPI ID, e.g. name@okaxis');
      const app = UPI_APPS.includes(input.app) ? input.app : undefined;
      return { upiId, app };
    }
    case 'card': {
      const number = String(input.cardNumber || '').replace(/\D/g, '');
      if (number.length < 13 || number.length > 19) throw httpError(400, 'Enter a valid card number');
      const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(String(input.expiry || '').trim());
      if (!match) throw httpError(400, 'Expiry must be MM/YY');
      const expiryEnd = new Date(2000 + Number(match[2]), Number(match[1]), 1); // first day after expiry month
      if (expiryEnd <= new Date()) throw httpError(400, 'This card has expired');
      if (!/^\d{3,4}$/.test(String(input.cvv || ''))) throw httpError(400, 'Enter a valid CVV');
      // CVV and full number are never stored.
      return { brand: cardBrand(number), last4: number.slice(-4), testDecline: number === FAILING_TEST_CARD };
    }
    case 'wallet': {
      if (!WALLETS.includes(input.wallet)) throw httpError(400, 'Choose a wallet');
      return { wallet: input.wallet };
    }
    case 'cash':
      return { note: 'Pay the worker in cash when the job is done' };
    default:
      throw httpError(400, `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`);
  }
}

const isParty = (doc, user) =>
  user.role === 'admin' || doc.customerId.equals(user._id) || doc.workerId.equals(user._id);

// POST /api/payments   (customer)  { bookingId, method, methodDetails }
const createPayment = asyncHandler(async (req, res) => {
  const { bookingId, method } = req.body;
  if (!mongoose.isValidObjectId(bookingId)) throw httpError(400, 'A valid bookingId is required');

  const booking = await Booking.findById(bookingId);
  if (!booking) throw httpError(404, 'Booking not found');
  if (!booking.customerId.equals(req.user._id)) throw httpError(403, 'This booking does not belong to you');
  if (CLOSED_BOOKING.includes(booking.status)) throw httpError(400, `This booking was ${booking.status.replace(/_/g, ' ')}`);
  if (booking.paymentStatus === 'paid') throw httpError(409, 'This booking is already paid');

  const details = methodDetailsFor(method, req.body.methodDetails);
  const { testDecline, ...methodDetails } = details;

  const payment = await Payment.create({
    bookingId,
    customerId: booking.customerId,
    workerId: booking.workerId,
    amount: booking.agreedPrice, // always the server-side price, never the client's
    method,
    methodDetails: testDecline ? { ...methodDetails, testDecline: true } : methodDetails,
  });

  res.status(201).json(payment);
});

// PATCH /api/payments/:id/process   (customer who created it)
const processPayment = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(400, 'Invalid payment id');

  // Atomically claim the pending payment so a double click can't process it twice.
  const payment = await Payment.findOneAndUpdate(
    { _id: req.params.id, customerId: req.user._id, status: 'pending' },
    { status: 'processing' },
    { new: true }
  );
  if (!payment) {
    const existing = await Payment.findById(req.params.id);
    if (!existing) throw httpError(404, 'Payment not found');
    if (!existing.customerId.equals(req.user._id)) throw httpError(403, 'This payment does not belong to you');
    throw httpError(409, `Payment is already ${existing.status}`);
  }

  await sleep(GATEWAY_DELAY_MS);

  const booking = await Booking.findById(payment.bookingId);
  const declined = payment.methodDetails?.testDecline;
  const bookingClosed = !booking || CLOSED_BOOKING.includes(booking.status);

  if (declined || bookingClosed || booking.paymentStatus === 'paid') {
    payment.status = 'failed';
    payment.methodDetails = {
      ...payment.methodDetails,
      failureReason: declined
        ? 'Card declined by bank (test card)'
        : bookingClosed
          ? 'Booking is no longer active'
          : 'Booking was already paid',
    };
    payment.markModified('methodDetails');
    await payment.save();
    return res.status(402).json({ message: payment.methodDetails.failureReason, payment });
  }

  payment.status = 'completed';
  payment.completedAt = new Date();
  await payment.save();

  booking.paymentStatus = 'paid';
  booking.paymentMethod = payment.method;
  await booking.save();

  res.json(payment);
});

// GET /api/payments/booking/:bookingId   (booking's customer/worker, or admin)
// Latest payment for the booking, or null.
const getPaymentForBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  if (!mongoose.isValidObjectId(bookingId)) throw httpError(400, 'Invalid booking id');

  const booking = await Booking.findById(bookingId).select('customerId workerId');
  if (!booking) throw httpError(404, 'Booking not found');
  if (!isParty(booking, req.user)) throw httpError(403, 'You do not have access to this booking');

  const payment = await Payment.findOne({ bookingId }).sort({ createdAt: -1 });
  res.json(payment);
});

// GET /api/payments/my   (customer: payments made; worker: payments received)
const getMyPayments = asyncHandler(async (req, res) => {
  const field = req.user.role === 'worker' ? 'workerId' : 'customerId';
  const payments = await Payment.find({ [field]: req.user._id, status: { $ne: 'pending' } })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('bookingId', 'serviceName serviceCategory scheduledDate scheduledTime status')
    .populate(field === 'workerId' ? 'customerId' : 'workerId', 'name');
  res.json(payments);
});

module.exports = { createPayment, processPayment, getPaymentForBooking, getMyPayments };
