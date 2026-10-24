// Wraps an async route handler so rejected promises reach the error middleware.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Creates an Error the error middleware turns into `{ message }` with this status.
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { asyncHandler, httpError };
