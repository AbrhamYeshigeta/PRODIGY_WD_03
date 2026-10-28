// src/utils/asyncHandler.js
/* Wraps async controllers so we don't need try/catch in every one */
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);