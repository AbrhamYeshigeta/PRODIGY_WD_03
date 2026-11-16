// src/controllers/offerController.js
const asyncHandler = require('../utils/asyncHandler');
const ApiError     = require('../utils/ApiError');
const prisma       = require('../config/prisma'); // Replaced Mongoose models
const { OFFER_UNITS, OFFER_STATUS } = require('../config/constants');
const { toCents } = require('../utils/money');

function normalizedPrice(pricePerUnitCents, unit, estimatedWeightKg) {
  const config = OFFER_UNITS[unit];
  if (!config) throw ApiError.badRequest('Choose a supported selling unit');
  if (config.requiresEstimatedWeight) {
    const weight = Number(estimatedWeightKg);
    if (!Number.isFinite(weight) || weight <= 0) {
      throw ApiError.badRequest(`Enter the estimated weight in kg for one ${unit}`);
    }
    return Math.max(1, Math.round(pricePerUnitCents / weight));
  }
  return Math.max(1, Math.round(pricePerUnitCents / config.kgFactor));
}

function ensureDraftAccess(seller, offer) {
  if (seller.verificationStatus !== 'verified' && offer.status !== OFFER_STATUS.DRAFT) {
    throw ApiError.forbidden('Only draft offers can be managed before seller verification.');
  }
}

/* ── POST /api/sellers/me/offers ── */
exports.create = asyncHandler(async (req, res) => {
  const seller = req.seller;

  const {
    productId, unit, pricePerUnit, stock, estimatedWeightKg,
  } = req.body;

  if (!OFFER_UNITS[unit]) throw ApiError.badRequest('Choose a supported selling unit');
  if (typeof productId !== 'string' || !productId.trim()) {
    throw ApiError.badRequest('Choose a product from the catalog');
  }
  if (!Number.isFinite(Number(pricePerUnit)) || Number(pricePerUnit) <= 0) {
    throw ApiError.badRequest('Enter a price greater than zero');
  }
  if (!Number.isInteger(Number(stock)) || Number(stock) < 1) {
    throw ApiError.badRequest('Stock must be a whole number greater than zero');
  }

  // Find Product using Prisma
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound('Product not found');

  /* Prevent duplicate offer for the same product by the same seller */
  const existingOffer = await prisma.offer.findFirst({
    where: { sellerId: seller.id, productId, unit },
  });
  if (existingOffer) {
    throw ApiError.conflict(`You already have an offer for this product by ${unit}`);
  }

  const pricePerUnitCents = toCents(pricePerUnit);
  if (pricePerUnitCents < 1) throw ApiError.badRequest('Price must be at least 0.01 ETB');
  const estimatedWeight = OFFER_UNITS[unit].requiresEstimatedWeight ? Number(estimatedWeightKg) : null;
  const pricePerKg = normalizedPrice(pricePerUnitCents, unit, estimatedWeight);

  // Create Offer using Prisma
  const offer = await prisma.offer.create({
    data: {
      productId: productId,
      sellerId:  seller.id,
      unit,
      pricePerUnit: pricePerUnitCents,
      pricePerKg,
      estimatedWeightKg: estimatedWeight,
      stock: Number(stock),
      status: seller.verificationStatus === 'verified' ? OFFER_STATUS.ACTIVE : OFFER_STATUS.DRAFT,
    },
  });

  res.status(201).json({ success: true, data: offer });
});

/* ── GET /api/sellers/me/offers ── */
exports.listMine = asyncHandler(async (req, res) => {
  const offers = await prisma.offer.findMany({
    where: { sellerId: req.seller.id },
    include: { product: true }, // Prisma equivalent of populate
    orderBy: { createdAt: 'desc' }
  });
  res.json({ success: true, data: offers });
});

/* ── GET /api/products/:slug/offers ── public ── */
exports.listByProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
  if (!product) throw ApiError.notFound('Product not found');

  const offers = await prisma.offer.findMany({
    where: {
      productId: product.id,
      status: OFFER_STATUS.ACTIVE,
      stock: { gt: 0 },
      seller: { is: { verificationStatus: 'verified' } },
    },
    include: {
      seller: {
        select: {
          id: true,
          businessName: true,
          businessType: true,
          city: true,
          country: true,
          rating: true,
          verificationStatus: true,
        },
      },
    },
    orderBy: { pricePerKg: 'asc' }
  });

  res.json({ success: true, data: { product, offers } });
});

/* ── PATCH /api/offers/:id ── */
exports.update = asyncHandler(async (req, res) => {
  // First verify ownership
  const offer = await prisma.offer.findFirst({ 
    where: { id: req.params.id, sellerId: req.seller.id } 
  });
  if (!offer) throw ApiError.notFound('Offer not found');
  ensureDraftAccess(req.seller, offer);

  const patch = {};
  let nextPrice = offer.pricePerUnit;
  let nextEstimatedWeightKg = offer.estimatedWeightKg;
  if (req.body.pricePerUnit !== undefined) {
    const price = Number(req.body.pricePerUnit);
    if (!Number.isFinite(price) || price <= 0) {
      throw ApiError.badRequest('Enter a price greater than zero');
    }
    nextPrice = toCents(price);
    if (nextPrice < 1) throw ApiError.badRequest('Price must be at least 0.01 ETB');
    patch.pricePerUnit = nextPrice;
  }

  if (req.body.estimatedWeightKg !== undefined) {
    nextEstimatedWeightKg = Number(req.body.estimatedWeightKg);
    if (!Number.isFinite(nextEstimatedWeightKg) || nextEstimatedWeightKg <= 0) {
      throw ApiError.badRequest('Estimated weight must be greater than zero kg');
    }
    patch.estimatedWeightKg = nextEstimatedWeightKg;
  }

  if (req.body.pricePerUnit !== undefined || req.body.estimatedWeightKg !== undefined) {
    patch.pricePerKg = normalizedPrice(nextPrice, offer.unit, nextEstimatedWeightKg);
  }
  
  if (req.body.stock !== undefined) {
    const stock = Number(req.body.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      throw ApiError.badRequest('Stock must be a whole number zero or greater');
    }
    patch.stock = stock;
  }

  const updated = await prisma.offer.update({
    where: { id: offer.id },
    data: patch
  });
  
  res.json({ success: true, data: updated });
});

/* ── PATCH /api/offers/:id/pause ── */
exports.togglePause = asyncHandler(async (req, res) => {
  const offer = await prisma.offer.findFirst({ 
    where: { id: req.params.id, sellerId: req.seller.id } 
  });
  if (!offer) throw ApiError.notFound('Offer not found');
  if (req.seller.verificationStatus !== 'verified') {
    throw ApiError.forbidden('Verify your seller account before publishing or pausing offers.');
  }

  const newStatus = offer.status === OFFER_STATUS.ACTIVE
    ? OFFER_STATUS.PAUSED
    : OFFER_STATUS.ACTIVE;

  const updated = await prisma.offer.update({
    where: { id: offer.id },
    data: { status: newStatus }
  });
  
  res.json({ success: true, data: updated });
});

/* ── DELETE /api/offers/:id ── */
exports.remove = asyncHandler(async (req, res) => {
  // Verify ownership first
  const offer = await prisma.offer.findFirst({ 
    where: { id: req.params.id, sellerId: req.seller.id } 
  });
  if (!offer) throw ApiError.notFound('Offer not found');
  ensureDraftAccess(req.seller, offer);

  await prisma.offer.delete({ where: { id: offer.id } });
  
  res.json({ success: true, message: 'Offer deleted' });
});