const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getStats, listUsers, setWorkerVerification } = require('../controllers/adminController');
const m = require('../controllers/adminManagementController');

const router = express.Router();

// Every admin route requires a logged-in admin.
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/dashboard', m.getDashboard);
router.get('/users', listUsers);
router.get('/customers', m.listCustomers);
router.get('/bookings', m.listBookings);

router.get('/workers', m.listWorkers);
router.get('/workers/:id', m.getWorkerProfile);
router.get('/workers/:id/status-history', m.getStatusHistory);
router.patch('/workers/:id/status', m.setWorkerStatus);
router.put('/workers/:id/verify', setWorkerVerification);

router.post('/evidence', upload.single('evidence'), m.uploadEvidence);

module.exports = router;
