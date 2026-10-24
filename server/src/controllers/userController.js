const User = require('../models/User');
const { LANGUAGES } = require('../models/User');
const { categoryIds } = require('../data/categories');
const { storeFile } = require('../utils/storage');
const { asyncHandler, httpError } = require('../utils/http');
const { PHONE_RE, toBool, parseLocation, parseServices } = require('../utils/validation');

// GET /api/users/profile
const getProfile = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// PUT /api/users/profile
// Email, role, verification and ratings can't be changed here.
const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const body = req.body;

  if (body.name !== undefined) {
    if (!String(body.name).trim()) throw httpError(400, 'Name cannot be empty');
    user.name = String(body.name).trim();
  }
  if (body.phone !== undefined) {
    if (!PHONE_RE.test(body.phone)) throw httpError(400, 'Please enter a valid phone number');
    user.phone = String(body.phone).trim();
  }
  if (body.address !== undefined) user.address = String(body.address).trim();

  const location = parseLocation(body.lat, body.lng);
  if (location) user.location = location;

  if (user.role === 'worker') {
    if (body.serviceCategory !== undefined) {
      if (!categoryIds.includes(body.serviceCategory)) throw httpError(400, 'Please choose a valid service category');
      user.serviceCategory = body.serviceCategory;
    }
    const services = parseServices(body.services);
    if (services) user.services = services;
    if (body.bio !== undefined) user.bio = String(body.bio).trim();
    if (body.experienceYears !== undefined) user.experienceYears = Math.max(0, Number(body.experienceYears) || 0);
    if (body.isNegotiable !== undefined) user.isNegotiable = toBool(body.isNegotiable);
    if (body.availability !== undefined) user.availability = toBool(body.availability);
  }

  await user.save();
  res.json(user);
});

// POST /api/upload/id-proof   (worker, multipart field "idProof")
// A new ID proof resets verification until an admin reviews it again.
const uploadIdProof = asyncHandler(async (req, res) => {
  if (!req.file) throw httpError(400, 'Please attach your ID proof (field "idProof")');
  req.user.idProofUrl = await storeFile(req.file, 'id-proofs', req);
  req.user.isVerified = false;
  await req.user.save();
  res.json(req.user);
});

// POST /api/upload/profile-photo   (any user, multipart field "profilePhoto")
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw httpError(400, 'Please attach a photo (field "profilePhoto")');
  req.user.profilePhoto = await storeFile(req.file, 'profile-photos', req);
  await req.user.save();
  res.json(req.user);
});


// PATCH /api/users/language   { language: 'en' | 'ta' | 'hi' | 'bn' }
// Atomic update so it never races with a concurrent profile save.
const updateLanguage = asyncHandler(async (req, res) => {
  const { language } = req.body;
  if (!LANGUAGES.includes(language)) throw httpError(400, `Language must be one of: ${LANGUAGES.join(', ')}`);
  await User.updateOne({ _id: req.user._id }, { preferredLanguage: language });
  res.json({ preferredLanguage: language });
});

module.exports = { getProfile, updateProfile, uploadIdProof, uploadProfilePhoto, updateLanguage };
