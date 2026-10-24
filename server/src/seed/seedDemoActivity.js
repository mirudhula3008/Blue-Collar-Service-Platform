// Seeds ~6 months of completed, paid jobs for the sample workers so the
// earnings and admin dashboards have realistic data.
// Run after `npm run seed`. Re-running replaces only the bookings it created
// (description starts with "[demo]") and their payments.
// Usage: npm run seed:demo

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const DAY_MS = 24 * 60 * 60 * 1000;
const DEMO_PREFIX = '[demo]';
const METHODS = ['upi', 'upi', 'upi', 'card', 'wallet', 'cash'];
const WALLETS = ['paytm', 'amazonpay', 'phonepe'];
const NOTES = [
  'Regular maintenance visit',
  'Urgent repair, same day',
  'Follow-up job from last month',
  'Flat on 2nd floor, lift available',
  'Weekend job',
];

// Small deterministic PRNG so every run produces the same history.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const pick = (rand, list) => list[Math.floor(rand() * list.length)];

function methodDetails(method, rand, customer) {
  if (method === 'upi') return { upiId: `${customer.name.split(' ')[0].toLowerCase()}@okaxis`, app: pick(rand, ['gpay', 'phonepe', 'paytm']) };
  if (method === 'card') return { brand: pick(rand, ['Visa', 'Mastercard', 'RuPay']), last4: String(1000 + Math.floor(rand() * 9000)) };
  if (method === 'wallet') return { wallet: pick(rand, WALLETS) };
  return { note: 'Paid in cash after the job' };
}

async function seedDemo() {
  await connectDB();

  const workers = await User.find({ role: 'worker', email: /@seed\.local$/ }).sort({ email: 1 });
  const customers = await User.find({ role: 'customer', email: /@seed\.local$/ });
  if (!workers.length || !customers.length) {
    throw new Error('No seeded workers/customers found. Run `npm run seed` first.');
  }

  const old = await Booking.find({ description: { $regex: `^\\${DEMO_PREFIX}` } }).select('_id');
  await Payment.deleteMany({ bookingId: { $in: old.map((b) => b._id) } });
  await Booking.deleteMany({ _id: { $in: old.map((b) => b._id) } });

  const now = Date.now();
  const bookings = [];
  const payments = [];

  workers.forEach((worker, wi) => {
    const rand = rng(wi + 7);
    const services = worker.services || [];
    if (!services.length) return;

    // Busier workers get more jobs; recent months get more than older ones.
    const jobCount = 10 + Math.floor(rand() * 18);
    const daysAgoList = Array.from({ length: jobCount }, () => Math.floor(Math.pow(rand(), 1.6) * 180) + 1);
    // Ravi is the demo worker account: give him jobs today and earlier this week.
    if (worker.email === 'ravi.kumar@seed.local') daysAgoList.push(0, 0, 1, 2, 3);

    daysAgoList.forEach((daysAgo) => {
      const service = pick(rand, services);
      const customer = pick(rand, customers);
      const hour = 9 + Math.floor(rand() * 9);
      const completedAt = new Date(now - daysAgo * DAY_MS);
      completedAt.setHours(hour, 30, 0, 0);
      if (completedAt.getTime() > now) {
        // A "today" job in a future hour: place it between local midnight and now so it stays today.
        const midnight = new Date(now);
        midnight.setHours(0, 0, 0, 0);
        completedAt.setTime(midnight.getTime() + rand() * (now - midnight.getTime()));
      }
      const scheduled = new Date(Date.UTC(completedAt.getFullYear(), completedAt.getMonth(), completedAt.getDate()));
      const price = worker.isNegotiable ? Math.round((service.price * (0.85 + rand() * 0.15)) / 10) * 10 : service.price;
      const method = pick(rand, METHODS);
      const bookingId = new mongoose.Types.ObjectId();

      bookings.push({
        _id: bookingId,
        customerId: customer._id,
        workerId: worker._id,
        serviceCategory: worker.serviceCategory,
        serviceName: service.name,
        description: `${DEMO_PREFIX} ${pick(rand, NOTES)}`,
        scheduledDate: scheduled,
        scheduledTime: `${String(hour).padStart(2, '0')}:00`,
        agreedPrice: price,
        status: 'completed',
        completedAt,
        paymentStatus: 'paid',
        paymentMethod: method,
        customerLocation: customer.location,
        createdAt: new Date(completedAt.getTime() - 2 * DAY_MS),
        updatedAt: completedAt,
      });
      payments.push({
        bookingId,
        customerId: customer._id,
        workerId: worker._id,
        amount: price,
        method,
        status: 'completed',
        methodDetails: methodDetails(method, rand, customer),
        completedAt: new Date(completedAt.getTime() - 2 * DAY_MS),
        // Payouts are settled to workers after 7 days.
        settled: daysAgo > 7,
        settledAt: daysAgo > 7 ? new Date(completedAt.getTime() + 7 * DAY_MS) : undefined,
        createdAt: new Date(completedAt.getTime() - 2 * DAY_MS),
        updatedAt: completedAt,
      });
    });
  });

  await Booking.insertMany(bookings, { timestamps: false });
  await Payment.insertMany(payments, { timestamps: false });

  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  console.log(
    `Seeded ${bookings.length} completed demo jobs across ${workers.length} workers (₹${total.toLocaleString('en-IN')} total).`
  );
  await mongoose.disconnect();
}

seedDemo().catch(async (err) => {
  console.error(err.message || err);
  await mongoose.disconnect();
  process.exit(1);
});
