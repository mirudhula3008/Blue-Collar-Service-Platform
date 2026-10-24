const multer = require('multer');

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ID_PROOF_TYPES = [...IMAGE_TYPES, 'application/pdf'];

// Files are kept in memory and handed to utils/storage (Cloudinary or local disk).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 2 },
  fileFilter: (req, file, cb) => {
    const allowed = file.fieldname === 'idProof' ? ID_PROOF_TYPES : IMAGE_TYPES;
    if (allowed.includes(file.mimetype)) return cb(null, true);
    const err = new Error(
      file.fieldname === 'idProof' ? 'ID proof must be a JPG, PNG, WEBP or PDF file' : 'Photo must be a JPG, PNG or WEBP image'
    );
    err.status = 400;
    cb(err);
  },
});

module.exports = upload;
