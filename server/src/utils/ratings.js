const mongoose = require('mongoose');
const Review = require('../models/Review');
const User = require('../models/User');

// Recomputes a worker's averageRating (1 decimal) and totalReviews from their reviews.
async function recalculateWorkerRating(workerId) {
  const [stats] = await Review.aggregate([
    { $match: { workerId: new mongoose.Types.ObjectId(String(workerId)) } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const averageRating = stats ? Math.round(stats.average * 10) / 10 : 0;
  const totalReviews = stats ? stats.count : 0;
  await User.updateOne({ _id: workerId }, { averageRating, totalReviews });
  return { averageRating, totalReviews };
}

module.exports = { recalculateWorkerRating };
