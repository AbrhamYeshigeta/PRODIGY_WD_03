// src/models/Seller.js
const mongoose = require('mongoose');
const { SELLER_SCALES, SELLER_STATUS } = require('../config/constants');

const sellerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  businessName: { type: String, required: true, trim: true },
  businessType: {
    type: String,
    enum: ['farm', 'retailer', 'wholesaler', 'cooperative', 'exporter', 'distributor'],
    required: true,
  },
  scale: {
    type: String,
    enum: Object.keys(SELLER_SCALES),
    default: 'wholesale',
    required: true,
  },

  phone:   { type: String, required: true },
  city:    { type: String, required: true },
  country: { type: String, default: 'Ethiopia' },
  bio:     { type: String, default: '' },

  /* Verification */
  verificationStatus: {
    type: String,
    enum: Object.values(SELLER_STATUS),
    default: SELLER_STATUS.PENDING,
    index: true,
  },
  verificationNote: String,
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  /* Documents */
  documents: {
    licenseUrl:    String,
    nationalIdUrl: String,
  },

  /* Tax + ID */
  faydaId: String,   // 12-digit national ID
  tin:     String,   // 10-digit tax ID

  /* Bank / Chapa */
  bank: {
    name:          String,
    accountNumber: String,
    holderName:    String,
  },
  chapaSubaccountId: String,

  /* Reputation (rolled up from orders) */
  rating:             { type: Number, default: 0, min: 0, max: 5 },
  ratingCount:        { type: Number, default: 0 },
  ordersCompleted:    { type: Number, default: 0 },
  fulfillmentRate:    { type: Number, default: 100 },
  avgResponseMinutes: { type: Number, default: 120 },
}, { timestamps: true });

sellerSchema.index({ verificationStatus: 1, city: 1 });
sellerSchema.index({ businessName: 'text' });

/* Virtuals */
sellerSchema.virtual('unit').get(function () {
  return SELLER_SCALES[this.scale].unit;
});
sellerSchema.virtual('kgFactor').get(function () {
  return SELLER_SCALES[this.scale].kgFactor;
});
sellerSchema.virtual('scaleLabel').get(function () {
  return SELLER_SCALES[this.scale].label;
});

sellerSchema.set('toJSON', { virtuals: true });
sellerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Seller', sellerSchema);