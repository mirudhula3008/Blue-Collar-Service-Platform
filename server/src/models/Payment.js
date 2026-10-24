const crypto = require('crypto');
const mongoose = require('mongoose');

// Simulated payments (no real gateway). One successful payment per booking.

const PAYMENT_METHODS = ['upi', 'card', 'wallet', 'cash'];
const PAYMENT_STATES = ['pending', 'processing', 'completed', 'failed', 'refunded'];

// Platform keeps 10% of every completed job.
const COMMISSION_RATE = 0.1;

const newTransactionId = () => `TXN${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

const paymentSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    status: { type: String, enum: PAYMENT_STATES, default: 'pending' },
    transactionId: { type: String, unique: true, default: newTransactionId },
    // Only non-sensitive details: UPI ID, card brand + last 4 digits, wallet name.
    methodDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Set when the platform has paid the worker their share.
    settled: { type: Boolean, default: false },
    settledAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports.COMMISSION_RATE = COMMISSION_RATE;
