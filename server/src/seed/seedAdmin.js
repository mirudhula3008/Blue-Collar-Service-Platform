// Creates the first admin account (admins can't sign up through the app).
// Usage: npm run seed:admin   — uses ADMIN_EMAIL / ADMIN_PASSWORD from .env

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@seed.local').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      console.log(`Promoted existing account ${email} to admin.`);
    } else {
      console.log(`Admin ${email} already exists.`);
    }
  } else {
    await User.create({ name: 'Platform Admin', email, phone: '9000000000', password, role: 'admin' });
    console.log(`Created admin ${email}.`);
  }

  await mongoose.disconnect();
}

seedAdmin().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
