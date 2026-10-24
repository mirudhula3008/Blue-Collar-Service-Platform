const { httpError } = require('./http');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s-]{6,16}$/;

// Multipart forms send everything as strings; accept both real and string booleans.
const toBool = (v) => v === true || v === 'true' || v === 'on' || v === '1';

function parseLocation(lat, lng) {
  if (lat === undefined || lat === '' || lng === undefined || lng === '') return undefined;
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln) || la < -90 || la > 90 || ln < -180 || ln > 180) {
    throw httpError(400, 'Invalid location coordinates');
  }
  return { type: 'Point', coordinates: [ln, la] };
}

// Accepts an array or a JSON string (from multipart forms).
function parseServices(raw) {
  if (raw === undefined || raw === '') return undefined;
  let list = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      throw httpError(400, 'Services must be valid JSON');
    }
  }
  if (!Array.isArray(list)) throw httpError(400, 'Services must be a list');
  if (list.length > 20) throw httpError(400, 'You can list at most 20 services');

  return list.map((s, i) => {
    const name = String(s?.name || '').trim();
    const price = Number(s?.price);
    if (!name) throw httpError(400, `Service ${i + 1} needs a name`);
    if (!Number.isFinite(price) || price < 0) throw httpError(400, `Service "${name}" needs a valid price`);
    return { name, price, unit: String(s?.unit || 'per job').trim() };
  });
}

module.exports = { EMAIL_RE, PHONE_RE, toBool, parseLocation, parseServices };
