const mongoose = require('mongoose');

// Booking model, owned by Module 3. Module 4 only reads it (review eligibility
// and admin stats). Field names follow the team plan; keep them in sync.

const BOOKING_STATUSES = ['requested', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled', 'cancelled_by_admin'];
const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];

const bookingSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceCategory: { type: String, required: true },
    serviceName: { type: String, required: true },
    description: { type: String, default: '' },
    scheduledDate: { type: Date, required: true },
    scheduledTime: { type: String, required: true },
    agreedPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: BOOKING_STATUSES, default: 'requested' },
    customerLocation: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: undefined },
    },
    completedAt: { type: Date },
    // Payment state (see Payment model). Separate from `status` so the job lifecycle stays unchanged.
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'unpaid' },
    paymentMethod: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
