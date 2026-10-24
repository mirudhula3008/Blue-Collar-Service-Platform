const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { categoryIds } = require('../data/categories');
const { storeFile } = require('../utils/storage');
const { asyncHandler, httpError } = require('../utils/http');
const { EMAIL_RE, PHONE_RE, toBool, parseLocation, parseServices } = require('../utils/validation');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
// JSON for customers; multipart/form-data for workers (files: idProof, profilePhoto).
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = 'customer', address } = req.body;

  if (!name?.trim() || !email || !phone || !password) {
    throw httpError(400, 'Name, email, phone and password are required');
  }
  if (!EMAIL_RE.test(email)) throw httpError(400, 'Please enter a valid email address');
  if (!PHONE_RE.test(phone)) throw httpError(400, 'Please enter a valid phone number');
  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters');
  if (!['customer', 'worker'].includes(role)) throw httpError(400, 'Role must be customer or worker');

  if (await User.exists({ email: email.toLowerCase().trim() })) {
    throw httpError(409, 'An account with this email already exists');
  }

  const data = {
    name: name.trim(),
    email,
    phone: phone.trim(),
    password,
    role,
    address: address?.trim() || '',
    location: parseLocation(req.body.lat, req.body.lng),
  };

  const files = req.files || {};

  if (role === 'worker') {
    const { serviceCategory } = req.body;
    if (!categoryIds.includes(serviceCategory)) throw httpError(400, 'Please choose a valid service category');
    if (!data.location) throw httpError(400, 'Workers must share their location so customers can find them');
    if (!files.idProof?.[0]) throw httpError(400, 'ID proof is required for workers');

    Object.assign(data, {
      serviceCategory,
      services: parseServices(req.body.services) || [],
      bio: req.body.bio?.trim() || '',
      experienceYears: Number(req.body.experienceYears) || 0,
      isNegotiable: toBool(req.body.isNegotiable),
      isVerified: false,
      availability: true,
      idProofUrl: await storeFile(files.idProof[0], 'id-proofs', req),
    });
  }

  if (files.profilePhoto?.[0]) {
    data.profilePhoto = await storeFile(files.profilePhoto[0], 'profile-photos', req);
  }

  const user = await User.create(data);
  res.status(201).json({ token: signToken(user), user });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw httpError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw httpError(401, 'Invalid email or password');
  }

  res.json({ token: signToken(user), user });
});

module.exports = { register, login };
