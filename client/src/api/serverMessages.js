import { translate } from '../context/LanguageContext';

// The API answers in English. Known user-facing messages are mapped to
// translation keys here; anything unknown is shown as the server sent it.
const EXACT = {
  'Invalid email or password': 'server.invalidLogin',
  'An account with this email already exists': 'server.emailExists',
  'Please enter a valid email address': 'server.invalidEmail',
  'Please enter a valid phone number': 'server.invalidPhone',
  'Password must be at least 6 characters': 'auth.errors.passwordShort',
  'Name, email, phone and password are required': 'server.requiredFields',
  'Workers must share their location so customers can find them': 'auth.errors.shareLocation',
  'ID proof is required for workers': 'auth.errors.uploadId',
  'Please choose a valid service category': 'auth.errors.chooseCategory',
  'Not authorised, please log in': 'server.loginRequired',
  'Session expired, please log in again': 'server.sessionExpired',
  'Account no longer exists': 'server.sessionExpired',
  'You do not have permission to do this': 'server.forbidden',
  'Worker not found': 'server.workerNotFound',
  'Booking not found': 'server.bookingNotFound',
  'This worker is not verified yet': 'server.workerNotVerified',
  'This worker is not taking new jobs right now': 'server.workerBusy',
  'This worker is not accepting bookings right now': 'server.workerInactive',
  'Please choose one of the services this worker offers': 'server.chooseService',
  'You cannot book a date in the past': 'server.pastDate',
  'You already have a booking with this worker at that time': 'server.duplicateBooking',
  'This booking does not belong to you': 'server.notYourBooking',
  'This booking was just updated. Please refresh.': 'server.staleBooking',
  'This booking is already paid': 'server.alreadyPaid',
  'Card declined by bank (test card)': 'server.cardDeclined',
  'This card has expired': 'server.cardExpired',
  'Enter a valid card number': 'payment.errors.cardNumber',
  'Expiry must be MM/YY': 'payment.errors.expiry',
  'Enter a valid CVV': 'payment.errors.cvv',
  'Enter a valid UPI ID, e.g. name@okaxis': 'payment.errors.upi',
  'Booking is no longer active': 'server.bookingClosed',
  'Booking was already paid': 'server.alreadyPaid',
  'You have already reviewed this booking': 'server.alreadyReviewed',
  'You can only review a job after it is completed': 'server.reviewAfterComplete',
  'You can only review your own bookings': 'server.notYourBooking',
  'Rating must be a whole number from 1 to 5': 'server.ratingRange',
  'File is too large (max 5 MB)': 'server.fileTooLarge',
  'ID proof must be a JPG, PNG, WEBP or PDF file': 'server.badIdProofFile',
  'Photo must be a JPG, PNG or WEBP image': 'server.badPhotoFile',
  'A reason of at least 10 characters is required for every status change': 'server.reasonRequired',
  'Evidence must be a list of http(s) URLs': 'server.badEvidence',
  'This worker was just updated by someone else. Please refresh.': 'server.staleWorker',
  'Server error': 'common.error',
};

// Messages with a variable part: [pattern, key, (match) => vars]
const PATTERNS = [
  [/^Cannot (\w+) a booking that is (.+)$/, 'server.cannotChangeBooking', (m) => ({ status: statusLabel(m[2]) })],
  [/^Worker is already (.+)$/, 'server.alreadyStatus', (m) => ({ status: translate(`admin.status.${m[1].replace(' ', '_')}`) })],
  [/^This booking was (.+)$/, 'server.bookingWas', (m) => ({ status: statusLabel(m[1]) })],
];

function statusLabel(text) {
  const key = text.trim().replace(/ /g, '_');
  const label = translate(`booking.status.${key}`);
  return label.startsWith('booking.status.') ? text : label;
}

export function translateServerMessage(message) {
  if (!message) return message;
  if (EXACT[message]) return translate(EXACT[message]);
  for (const [re, key, vars] of PATTERNS) {
    const match = re.exec(message);
    if (match) return translate(key, vars(match));
  }
  return message;
}
