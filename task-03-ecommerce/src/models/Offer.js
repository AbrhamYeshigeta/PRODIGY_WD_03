// src/models/Offer.js
const mongoose = require('mongoose');
const { OFFER_STATUS } = require('../config/constants');

const KG_FACTOR = { 
  kg: 1, 
  piece: 1, 
  bunch: 1, 
  pack: 1, 
  quintal: 100, 
  ton: 1000 
};

const offerSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  seller:  { type: mongoose.Schema.Types.ObjectId, ref: 'Seller',  required: true, index: true },

  unit: {
    type: String,
    enum: Object.keys(KG_FACTOR),
    required: true,
  },

  pricePerUnit: { type: Number, required: true, min: 0 },   // in cents
  pricePerKg:   { type: Number, required: true, min: 0, index: true }, // computed

  // NEW: Used only for piece, bunch, or pack
  estimatedWeightKg: { type: Number, min: 0 }, 

  comparePricePerUnit: { type: Number, min: 0 },

  stock:    { type: Number, required: true, min: 0 },
  minOrder: { type: Number, default: 1, min: 1 },

  handlingDays:     { type: Number, default: 1, min: 0 },
  shippingFeeCents: { type: Number, default: 0, min: 0 },

  images: [String],
  note:   { type: String, default: '' },

  status: {
    type: String,
    enum: Object.values(OFFER_STATUS),
    default: OFFER_STATUS.ACTIVE,
    index: true,
  },

  sold:  { type: Number, default: 0 },
  views: { type: Number, default: 0 },
}, { timestamps: true });

/* Compute pricePerKg on every save */
offerSchema.pre('save', function (next) {
  if (['piece', 'bunch', 'pack'].includes(this.unit) && this.estimatedWeightKg > 0) {
    // If selling by piece/bunch/pack and weight is provided
    this.pricePerKg = Math.round(this.pricePerUnit / this.estimatedWeightKg);
  } else {
    // Normal math for kg, quintal, ton
    const factor = KG_FACTOR[this.unit] || 1;
    this.pricePerKg = Math.round(this.pricePerUnit / factor);
  }
  next();
});

offerSchema.index({ product: 1, status: 1, pricePerKg: 1 });
offerSchema.index({ seller: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Offer', offerSchema);