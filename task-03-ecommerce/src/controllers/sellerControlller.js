// src/controllers/sellerController.js
const asyncHandler = require('../utils/asyncHandler');
const ApiError     = require('../utils/ApiError');
const Seller       = require('../models/Seller');
const Offer        = require('../models/Offer');
const Order        = require('../models/Order');
const User         = require('../models/User');
const { ROLES, SELLER_STATUS, ORDER_STATUS } = require('../config/constants');
const { format: fmtMoney } = require('../utils/money');

/* ── POST /api/sellers/apply ── */
exports.apply = asyncHandler(async (req, res) => {
  // 1. Check if they already applied
  if (await Seller.findOne({ user: req.user._id })) {
    throw ApiError.conflict('You have already applied for a merchant account.');
  }

  // 2. Extract fields from req.body (matches the FormData from frontend)
  const {
    businessName, businessType, scale,
    phone, city, country, bio,
    faydaId, tin,
    bankName, accountNumber, holderName,
  } = req.body;

  // 3. Handle the file upload (multer places it in req.files)
  let licenseUrl = null;
  if (req.files && req.files.license && req.files.license[0]) {
    licenseUrl = `/uploads/documents/${req.files.license[0].filename}`;
  }

  // 4. Create the Seller profile
  const seller = await Seller.create({
    user: req.user._id,
    businessName, 
    businessType,
    scale: scale || 'wholesale',
    phone, 
    city, 
    country: country || 'Ethiopia',
    bio: bio || '',
    faydaId, 
    tin,
    bank: { 
      name: bankName, 
      accountNumber, 
      holderName 
    },
    verificationStatus: SELLER_STATUS.PENDING,
    documents: {
      licenseUrl: licenseUrl,
    },
  });

  // 5. Upgrade the User's role to 'seller'
  await User.findByIdAndUpdate(req.user._id, { role: ROLES.SELLER });

  res.status(201).json({ success: true, data: seller });
});

/* ── GET /api/sellers/me ── */
exports.me = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({ user: req.user._id });
  if (!seller) throw ApiError.notFound('Seller profile not found');
  res.json({ success: true, data: seller });
});

/* ── GET /api/sellers/me/stats ── */
exports.stats = asyncHandler(async (req, res) => {
  const seller = req.seller;

  const offers = await Offer.find({ seller: seller._id });
  const orders = await Order.find({ 'items.seller': seller._id })
    .sort({ createdAt: -1 })
    .limit(50);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const revenueToday = orders
    .filter((o) => o.createdAt >= todayStart && o.status !== ORDER_STATUS.CANCELLED)
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const newOrders = orders.filter((o) =>
    [ORDER_STATUS.PENDING_PAYMENT, ORDER_STATUS.PAID].includes(o.status)
  ).length;

  const lowStock = offers
    .filter((o) => o.stock > 0 && o.stock <= 3 && o.status === 'active')
    .map((o) => ({ name: o.product?.name || 'Product', qty: o.stock, unit: o.unit }));

  res.json({
    success: true,
    data: {
      revenueToday,
      revenueTodayFormatted: fmtMoney(revenueToday),
      ordersNew: newOrders,
      offersActive: offers.filter((o) => o.status === 'active').length,
      offersTotal: offers.length,
      rating: seller.rating,
      ratingCount: seller.ratingCount,
      fulfillmentRate: seller.fulfillmentRate,
      lowStock,
      recentOrders: orders.slice(0, 5),
    },
  });
});

/* ── PATCH /api/sellers/me ── */
exports.updateMe = asyncHandler(async (req, res) => {
  const allowed = ['businessName', 'businessType', 'phone', 'city', 'country', 'bio'];
  const patch = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });

  const seller = await Seller.findByIdAndUpdate(req.seller._id, patch, { new: true, runValidators: true });
  res.json({ success: true, data: seller });
});

/* ── GET /api/sellers/:id ── public storefront ── */
exports.publicProfile = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.params.id).select(
    'businessName businessType scale city country bio rating ratingCount ordersCompleted fulfillmentRate verificationStatus createdAt'
  );
  if (!seller || seller.verificationStatus !== SELLER_STATUS.VERIFIED) {
    throw ApiError.notFound('Seller not found');
  }

  const offers = await Offer.find({ seller: seller._id, status: 'active' })
    .populate('product', 'name images category slug')
    .sort({ pricePerKg: 1 });

  res.json({ success: true, data: { seller, offers } });
});