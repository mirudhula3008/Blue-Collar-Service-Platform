const express = require('express');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const { uploadIdProof, uploadProfilePhoto } = require('../controllers/userController');

const router = express.Router();

router.post('/id-proof', protect, authorize('worker'), upload.single('idProof'), uploadIdProof);
router.post('/profile-photo', protect, upload.single('profilePhoto'), uploadProfilePhoto);

module.exports = router;
