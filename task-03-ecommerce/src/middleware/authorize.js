// src/middleware/authorize.js
const ApiError = require('../utils/ApiError');
const Seller  = require('../models/Seller');
const { ROLES, SELLER_STATUS } = require('../config/constants');

/* Any authenticated user with one of the given roles */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden('Insufficient role'));
    next();
  };
}

/* Verified seller only — attaches req.seller */
async function requireVerifiedSeller(req, _res, next) {
  try {
    if (!req.user) return next(ApiError.unauthorized());
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) return next(ApiError.forbidden('Not a seller'));
    if (seller.verificationStatus !== SELLER_STATUS.VERIFIED) {
      return next(ApiError.forbidden('Seller not verified yet'));
    }
    req.seller = seller;
    next();
  } catch (err) {
    next(err);
  }
}

/* Any seller (even pending) — attaches req.seller */
async function attachSeller(req, _res, next) {
  try {
    if (!req.user) return next(ApiError.unauthorized());
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) return next(ApiError.forbidden('Not a seller'));
    req.seller = seller;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireRole, requireVerifiedSeller, attachSeller };