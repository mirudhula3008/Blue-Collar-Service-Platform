const mongoose = require('mongoose');
const User = require('../models/User');
const Review = require('../models/Review');
const { categoryIds } = require('../data/categories');

const PUBLIC_WORKER_FIELDS = {
  password: 0,
  email: 0,
  phone: 0,
  idProofUrl: 0,
};

const MAX_RADIUS_KM = 50;

function toNumber(value) {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

// GET /api/workers?lat=&lng=&category=&radius=&minPrice=&maxPrice=&minRating=&available=
// Returns verified workers near the point, nearest first, with `distance` in metres.
async function searchWorkers(req, res, next) {
  try {
    const lat = toNumber(req.query.lat);
    const lng = toNumber(req.query.lng);
    if (lat === undefined || lng === undefined || Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: 'lat and lng query parameters are required numbers' });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: 'lat/lng out of range' });
    }

    const radiusKm = Math.min(toNumber(req.query.radius) || 10, MAX_RADIUS_KM);
    const minPrice = toNumber(req.query.minPrice);
    const maxPrice = toNumber(req.query.maxPrice);
    const minRating = toNumber(req.query.minRating);
    const { category } = req.query;

    const match = { role: 'worker', isVerified: true };

    if (category) {
      if (!categoryIds.includes(category)) {
        return res.status(400).json({ message: `Unknown category "${category}"` });
      }
      match.serviceCategory = category;
    }

    if (req.query.available === 'true') match.availability = true;
    if (minRating > 0) match.averageRating = { $gte: minRating };

    // A worker matches the price filter if at least one service falls in range.
    const priceRange = {};
    if (minPrice >= 0) priceRange.$gte = minPrice;
    if (maxPrice >= 0) priceRange.$lte = maxPrice;
    if (Object.keys(priceRange).length) {
      match.services = { $elemMatch: { price: priceRange } };
    }

    const workers = await User.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: radiusKm * 1000,
          spherical: true,
          query: match,
        },
      },
      { $project: PUBLIC_WORKER_FIELDS },
      {
        $addFields: {
          minPrice: { $min: '$services.price' },
          maxPrice: { $max: '$services.price' },
        },
      },
      { $limit: 50 },
    ]);

    res.json({ count: workers.length, radiusKm, workers });
  } catch (err) {
    next(err);
  }
}

// GET /api/workers/:id
async function getWorker(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid worker id' });
    }

    const worker = await User.findOne({ _id: id, role: 'worker' })
      .select(Object.keys(PUBLIC_WORKER_FIELDS).map((f) => `-${f}`).join(' '))
      .lean();

    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    const prices = (worker.services || []).map((s) => s.price);
    worker.minPrice = prices.length ? Math.min(...prices) : null;
    worker.maxPrice = prices.length ? Math.max(...prices) : null;

    res.json(worker);
  } catch (err) {
    next(err);
  }
}

// GET /api/workers/:id/reviews?page=1&limit=10
async function getWorkerReviews(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid worker id' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const [reviews, total] = await Promise.all([
      Review.find({ workerId: id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('customerId', 'name profilePhoto')
        .lean(),
      Review.countDocuments({ workerId: id }),
    ]);

    res.json({ reviews, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

module.exports = { searchWorkers, getWorker, getWorkerReviews };
