const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
const useCloudinary = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf' };

/**
 * Stores a multer memory file and returns its public URL.
 * Uses Cloudinary when configured, otherwise server/uploads/<folder> (dev only:
 * Render's disk is wiped on every deploy, so set Cloudinary keys in production).
 */
async function storeFile(file, folder, req) {
  if (useCloudinary) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `bluecollar/${folder}`, resource_type: 'auto' },
        (err, result) => (err ? reject(err) : resolve(result.secure_url))
      );
      stream.end(file.buffer);
    });
  }

  const dir = path.join(UPLOAD_ROOT, folder);
  await fs.mkdir(dir, { recursive: true });
  const name = `${crypto.randomBytes(16).toString('hex')}${EXTENSIONS[file.mimetype] || ''}`;
  await fs.writeFile(path.join(dir, name), file.buffer);
  return `${req.protocol}://${req.get('host')}/uploads/${folder}/${name}`;
}

module.exports = { storeFile, useCloudinary };
