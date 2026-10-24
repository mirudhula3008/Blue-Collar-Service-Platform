const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getStats, listUsers, setWorkerVerification } = require('../controllers/adminController');

const router = express.Router();

// Every admin route requires a logged-in admin.
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.put('/workers/:id/verify', setWorkerVerification);

module.exports = router;
