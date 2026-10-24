const express = require('express');
const { protect } = require('../middleware/auth');
const { getProfile, updateProfile, updateLanguage } = require('../controllers/userController');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.patch('/language', protect, updateLanguage);

module.exports = router;
