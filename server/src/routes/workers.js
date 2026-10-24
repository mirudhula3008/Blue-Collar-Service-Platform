const express = require('express');
const { searchWorkers, getWorker, getWorkerReviews } = require('../controllers/workerController');

const router = express.Router();

router.get('/', searchWorkers);
router.get('/:id', getWorker);
router.get('/:id/reviews', getWorkerReviews);

module.exports = router;
