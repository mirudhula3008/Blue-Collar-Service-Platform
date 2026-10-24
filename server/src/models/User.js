const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Shared User model, owned by Module 1. Keep this file identical across
// module branches so merges don't conflict.

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'per job' },
  },
  { _id: true }
);

const ACCOUNT_STATUSES = ['active', 'suspended', 'blocked', 'under_review'];
const LANGUAGES = ['en', 'ta', 'hi', 'bn'];

const statusChangeSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ACCOUNT_STATUSES, required: true },
    reason: { type: String, required: true, minlength: 10, trim: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
    evidence: [{ type: String }],
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['customer', 'worker', 'admin'], default: 'customer' },
    profilePhoto: { type: String, default: '' },

    // GeoJSON point: coordinates are [longitude, latitude].
    // No defaults, so users without a location don't break the 2dsphere index.
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: undefined },
    },
    address: { type: String, default: '' },
    // UI language. Unset until the user picks one, so their pre-login choice isn't overwritten.
    preferredLanguage: { type: String, enum: LANGUAGES },

    // Worker-specific fields
    serviceCategory: { type: String },
    services: { type: [serviceSchema], default: undefined },
    bio: { type: String, default: '' },
    experienceYears: { type: Number, default: 0 },
    isNegotiable: { type: Boolean, default: false },
    idProofUrl: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    availability: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },

    // Admin account control. Only `active` workers can be found and booked.
    accountStatus: { type: String, enum: ACCOUNT_STATUSES, default: 'active' },
    // Append-only audit log: every status change with who made it and why.
    statusHistory: { type: [statusChangeSchema], default: undefined },
  },
  { timestamps: true }
);

userSchema.index({ location: '2dsphere' });
userSchema.index({ role: 1, serviceCategory: 1 });

// insertMany (used by seed scripts) skips this hook, so seeds hash passwords themselves.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Requires the document to be loaded with .select('+password').
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
module.exports.ACCOUNT_STATUSES = ACCOUNT_STATUSES;
module.exports.LANGUAGES = LANGUAGES;
