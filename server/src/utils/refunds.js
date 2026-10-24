const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// Marks completed payments for these bookings as refunded (simulated) and
// flags the bookings. Called when a paid booking is rejected or cancelled.
async function refundBookings(bookingIds) {
  if (!bookingIds.length) return 0;
  const { modifiedCount } = await Payment.updateMany(
    { bookingId: { $in: bookingIds }, status: 'completed' },
    { status: 'refunded' }
  );
  await Booking.updateMany({ _id: { $in: bookingIds }, paymentStatus: 'paid' }, { paymentStatus: 'refunded' });
  return modifiedCount;
}

module.exports = { refundBookings };
