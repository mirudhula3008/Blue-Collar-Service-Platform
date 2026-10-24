// Seeds sample workers, customers and reviews around Chennai.
// Only touches accounts with an @seed.local email, so real data is left alone.
// Usage: npm run seed   (all seeded accounts use the password "password123")

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Review = require('../models/Review');

const SEED_DOMAIN = '@seed.local';

// [name, category, area, lat, lng, negotiable, available, years, services]
const WORKERS = [
  ['Ravi Kumar', 'plumbing', 'T. Nagar', 13.0418, 80.2341, true, true, 8,
    [['Tap / faucet repair', 250], ['Pipe leak fixing', 400], ['Bathroom fitting installation', 900]]],
  ['Senthil Murugan', 'plumbing', 'Velachery', 12.975, 80.2212, false, true, 5,
    [['Drain unclogging', 350], ['Water tank cleaning', 800], ['Motor pump repair', 600]]],
  ['Abdul Rahman', 'plumbing', 'Anna Nagar', 13.085, 80.2101, true, false, 12,
    [['Tap / faucet repair', 200], ['Geyser installation', 700], ['Full bathroom plumbing', 3500]]],

  ['Karthik Raja', 'electrical', 'Adyar', 13.0012, 80.2565, true, true, 6,
    [['Switch / socket repair', 150], ['Ceiling fan installation', 350], ['Full house wiring check', 1500]]],
  ['Prakash Babu', 'electrical', 'Mylapore', 13.0339, 80.2619, false, true, 10,
    [['Light fitting installation', 200], ['MCB / fuse replacement', 300], ['Inverter installation', 900]]],
  ['Manoj Kumar', 'electrical', 'Porur', 13.0382, 80.1565, true, true, 3,
    [['Switch / socket repair', 120], ['Ceiling fan repair', 250], ['AC point wiring', 800]]],

  ['Murugan Selvam', 'carpentry', 'Guindy', 13.0067, 80.2206, true, true, 15,
    [['Door lock fitting', 300], ['Furniture repair', 600], ['Wardrobe assembly', 1200]]],
  ['Joseph Antony', 'carpentry', 'Kodambakkam', 13.0521, 80.2255, false, false, 9,
    [['Hinge / handle replacement', 200], ['Bed assembly', 800], ['Custom shelf making', 2500]]],
  ['Ganesh Pandian', 'carpentry', 'Chromepet', 12.9516, 80.1462, true, true, 7,
    [['Furniture repair', 500], ['Window frame repair', 700], ['Modular kitchen fitting', 4000]]],

  ['Suresh Babu', 'painting', 'Egmore', 13.0732, 80.2609, true, true, 11,
    [['Single wall painting', 1200], ['1 BHK interior painting', 8000], ['Waterproofing coat', 3000]]],
  ['Vijay Anand', 'painting', 'Perambur', 13.121, 80.2329, false, true, 4,
    [['Touch-up painting', 600], ['Door / grill painting', 900], ['2 BHK interior painting', 14000]]],
  ['Dinesh Kumar', 'painting', 'Tambaram', 12.9249, 80.1, true, true, 6,
    [['Single wall painting', 1000], ['Exterior wall painting', 6000], ['Texture painting', 4500]]],

  ['Lakshmi Devi', 'cleaning', 'Nungambakkam', 13.0569, 80.2425, false, true, 5,
    [['Kitchen deep cleaning', 1200], ['Bathroom cleaning', 500], ['Full home deep cleaning', 3500]]],
  ['Meena Kumari', 'cleaning', 'Besant Nagar', 13.0002, 80.2668, true, true, 3,
    [['Sofa shampooing', 900], ['Bathroom cleaning', 450], ['Move-in / move-out cleaning', 4000]]],
  ['Selvi Rajan', 'cleaning', 'Royapettah', 13.054, 80.264, true, false, 7,
    [['Kitchen deep cleaning', 1000], ['Window & balcony cleaning', 600], ['Full home deep cleaning', 3000]]],
];

const CUSTOMERS = [
  ['Arun Prasad', 13.0475, 80.2400],
  ['Divya Shankar', 13.0100, 80.2500],
  ['Harish Venkat', 13.0800, 80.2200],
];

const REVIEW_TEXT = [
  [5, 'Very professional and finished the job quickly. Highly recommended!'],
  [5, 'Came on time, explained the problem clearly and charged a fair price.'],
  [4, 'Good work overall, just arrived a little late.'],
  [4, 'Neat and tidy work. Would book again.'],
  [3, 'Job was done but took longer than expected.'],
  [5, 'Excellent service, very polite and skilled.'],
];

const slug = (name) => name.toLowerCase().replace(/[^a-z]+/g, '.');

async function seed() {
  await connectDB();
  await User.syncIndexes();

  const oldSeedUsers = await User.find({ email: { $regex: `${SEED_DOMAIN.replace('.', '\\.')}$` } }).select('_id');
  const oldIds = oldSeedUsers.map((u) => u._id);
  await Review.deleteMany({ $or: [{ workerId: { $in: oldIds } }, { customerId: { $in: oldIds } }] });
  await User.deleteMany({ _id: { $in: oldIds } });

  const password = await bcrypt.hash('password123', 10);

  const customers = await User.insertMany(
    CUSTOMERS.map(([name, lat, lng], i) => ({
      name,
      email: `${slug(name)}${SEED_DOMAIN}`,
      phone: `98400000${String(i).padStart(2, '0')}`,
      password,
      role: 'customer',
      location: { type: 'Point', coordinates: [lng, lat] },
    }))
  );

  const workers = await User.insertMany(
    WORKERS.map(([name, category, area, lat, lng, negotiable, available, years, services], i) => ({
      name,
      email: `${slug(name)}${SEED_DOMAIN}`,
      phone: `94440000${String(i).padStart(2, '0')}`,
      password,
      role: 'worker',
      profilePhoto: `https://i.pravatar.cc/300?img=${i + 11}`,
      location: { type: 'Point', coordinates: [lng, lat] },
      address: `${area}, Chennai`,
      serviceCategory: category,
      services: services.map(([serviceName, price]) => ({ name: serviceName, price })),
      bio: `${years} years of experience in ${category} work around ${area} and nearby areas.`,
      experienceYears: years,
      isNegotiable: negotiable,
      isVerified: true,
      availability: available,
    }))
  );

  // 2–4 reviews per worker, then store the real average on the worker.
  const reviews = [];
  workers.forEach((worker, wi) => {
    const count = 2 + (wi % 3);
    for (let r = 0; r < count; r++) {
      const [rating, comment] = REVIEW_TEXT[(wi + r) % REVIEW_TEXT.length];
      reviews.push({
        bookingId: new mongoose.Types.ObjectId(),
        customerId: customers[(wi + r) % customers.length]._id,
        workerId: worker._id,
        rating,
        comment,
        createdAt: new Date(Date.now() - (wi * 3 + r) * 24 * 60 * 60 * 1000),
      });
    }
  });
  // timestamps: false keeps the back-dated createdAt values above.
  await Review.insertMany(reviews, { timestamps: false });

  await Promise.all(
    workers.map((worker) => {
      const own = reviews.filter((r) => r.workerId.equals(worker._id));
      const avg = own.reduce((sum, r) => sum + r.rating, 0) / own.length;
      return User.updateOne(
        { _id: worker._id },
        { averageRating: Math.round(avg * 10) / 10, totalReviews: own.length }
      );
    })
  );

  console.log(`Seeded ${workers.length} workers, ${customers.length} customers, ${reviews.length} reviews.`);
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
