const express = require('express');
const upload = require('../middleware/upload');
const { register, login } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  upload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'profilePhoto', maxCount: 1 },
  ]),
  register
);
router.post('/login', login);

module.exports = router;
