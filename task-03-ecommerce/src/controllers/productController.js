// src/controllers/productController.js
const asyncHandler = require('../utils/asyncHandler');
const ApiError     = require('../utils/ApiError');
const Product      = require('../models/Product');
const Offer        = require('../models/Offer');
const { OFFER_STATUS } = require('../config/constants');

/* ── GET /api/products ── landing page: one card per product */
exports.list = asyncHandler(async (req, res) => {
  const { q, category, sort = 'popular', page = 1, limit = 24 } = req.query;

  const filter = { isActive: true };
  if (category) filter.category = category;
  if (q) filter.$text = { $search: q };

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  /* Aggregate lowestPrice + offerCount per product */
  const ids = products.map((p) => p._id);
  const agg = await Offer.aggregate([
    { $match: { product: { $in: ids }, status: OFFER_STATUS.ACTIVE } },
    { $group: {
        _id: '$product',
        offerCount: { $sum: 1 },
        lowestPricePerKg: { $min: '$pricePerKg' },
        totalStock: { $sum: '$stock' },
      },
    },
  ]);
  const map = Object.fromEntries(agg.map((a) => [a._id.toString(), a]));

  const enriched = products.map((p) => {
    const stats = map[p._id.toString()] || { offerCount: 0, lowestPricePerKg: 0, totalStock: 0 };
    return { ...p.toObject(), ...stats };
  });

  if (sort === 'lowest-price') enriched.sort((a, b) => a.lowestPricePerKg - b.lowestPricePerKg);
  if (sort === 'offers')       enriched.sort((a, b) => b.offerCount - a.offerCount);

  const total = await Product.countDocuments(filter);

  res.json({
    success: true,
    data: enriched,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  });
});

/* ── GET /api/products/:slug ── single product + all its offers */
exports.getOne = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) throw ApiError.notFound('Product not found');

  const offers = await Offer.find({ product: product._id, status: OFFER_STATUS.ACTIVE })
    .populate('seller', 'businessName scale rating ratingCount ordersCompleted fulfillmentRate verificationStatus')
    .sort({ pricePerKg: 1 });

  res.json({ success: true, data: { product, offers } });
});