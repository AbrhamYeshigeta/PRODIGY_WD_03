// src/controllers/offerController.js
const asyncHandler = require('../utils/asyncHandler');
const ApiError     = require('../utils/ApiError');
const Offer        = require('../models/Offer');
const Product      = require('../models/Product');
const { SELLER_SCALES, OFFER_STATUS } = require('../config/constants');
const { toCents } = require('../utils/money');

const KG_FACTOR = { kg: 1, quintal: 100, ton: 1000 };

/* ── POST /api/sellers/me/offers ── */
exports.create = asyncHandler(async (req, res) => {
  const seller = req.seller;

  const {
    productId, unit, pricePerUnit, comparePricePerUnit,
    stock, minOrder, handlingDays, shippingFee, note,
  } = req.body;

  /* Unit must match the seller's scale — prevents spoofing */
  const expectedUnit = SELLER_SCALES[seller.scale].unit;
  if (unit !== expectedUnit) {
    throw ApiError.badRequest(`Your selling scale requires unit "${expectedUnit}"`);
  }

  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');

  /* Prevent duplicate offer for the same product by the same seller */
  if (await Offer.findOne({ seller: seller._id, product: productId })) {
    throw ApiError.conflict('You already have an offer for this product');
  }

  const pricePerUnitCents = toCents(pricePerUnit);
  const pricePerKg = Math.round(pricePerUnitCents / KG_FACTOR[unit]);

  const offer = await Offer.create({
    product: productId,
    seller:  seller._id,
    unit,
    pricePerUnit: pricePerUnitCents,
    pricePerKg,
    comparePricePerUnit: comparePricePerUnit ? toCents(comparePricePerUnit) : undefined,
    stock,
    minOrder: minOrder || 1,
    handlingDays: handlingDays || 1,
    shippingFeeCents: shippingFee ? toCents(shippingFee) : 0,
    images: (req.files || []).map((f) => `/uploads/offers/${f.filename}`),
    note,
    status: OFFER_STATUS.ACTIVE,
  });

  res.status(201).json({ success: true, data: offer });
});

/* ── GET /api/sellers/me/offers ── */
exports.listMine = asyncHandler(async (req, res) => {
  const offers = await Offer.find({ seller: req.seller._id })
    .populate('product', 'name slug category images')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: offers });
});

/* ── GET /api/products/:slug/offers ── public ── */
exports.listByProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) throw ApiError.notFound('Product not found');

  const offers = await Offer.find({ product: product._id, status: OFFER_STATUS.ACTIVE })
    .populate('seller', 'businessName scale rating ratingCount ordersCompleted fulfillmentRate verificationStatus city')
    .sort({ pricePerKg: 1 });

  res.json({ success: true, data: { product, offers } });
});

/* ── PATCH /api/offers/:id ── */
exports.update = asyncHandler(async (req, res) => {
  const offer = await Offer.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!offer) throw ApiError.notFound('Offer not found');

  const patch = {};
  if (req.body.pricePerUnit !== undefined) {
    patch.pricePerUnit = toCents(req.body.pricePerUnit);
    patch.pricePerKg = Math.round(patch.pricePerUnit / KG_FACTOR[offer.unit]);
  }
  ['stock', 'minOrder', 'handlingDays', 'note'].forEach((k) => {
    if (req.body[k] !== undefined) patch[k] = req.body[k];
  });
  if (req.body.shippingFee !== undefined) patch.shippingFeeCents = toCents(req.body.shippingFee);

  const updated = await Offer.findByIdAndUpdate(offer._id, patch, { new: true, runValidators: true });
  res.json({ success: true, data: updated });
});

/* ── PATCH /api/offers/:id/pause ── */
exports.togglePause = asyncHandler(async (req, res) => {
  const offer = await Offer.findOne({ _id: req.params.id, seller: req.seller._id });
  if (!offer) throw ApiError.notFound('Offer not found');
  offer.status = offer.status === OFFER_STATUS.ACTIVE
    ? OFFER_STATUS.PAUSED
    : OFFER_STATUS.ACTIVE;
  await offer.save();
  res.json({ success: true, data: offer });
});

/* ── DELETE /api/offers/:id ── */
exports.remove = asyncHandler(async (req, res) => {
  const offer = await Offer.findOneAndDelete({ _id: req.params.id, seller: req.seller._id });
  if (!offer) throw ApiError.notFound('Offer not found');
  res.json({ success: true, message: 'Offer deleted' });
});