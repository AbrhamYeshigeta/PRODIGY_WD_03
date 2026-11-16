// src/controllers/sellerController.js
const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/* ── POST /api/sellers/apply ── */
exports.apply = asyncHandler(async (req, res) => {
  const existingSeller = await prisma.seller.findUnique({ where: { userId: req.user.id } });
  if (existingSeller) throw ApiError.conflict('You have already applied.');

  const {
    businessName, businessType, scale, phone, city, country, bio,
    faydaId, tin, bankName, accountNumber, holderName,
  } = req.body;

  let licenseUrl = null;
  if (req.files && req.files.license && req.files.license[0]) {
    licenseUrl = `/uploads/documents/${req.files.license[0].filename}`;
  }

  const [seller] = await prisma.$transaction([
    prisma.seller.create({
      data: {
        userId: req.user.id,
        businessName, businessType, scale: scale || 'wholesale',
        phone, city, country: country || 'Ethiopia', bio: bio || '',
        faydaId, tin,
        bankName, bankAccount: accountNumber, bankHolder: holderName,
        verificationStatus: 'pending',
        licenseUrl: licenseUrl,
      },
    }),
    prisma.user.update({
      where: { id: req.user.id },
      data: { role: 'seller' },
    }),
  ]);

  res.status(201).json({ success: true, data: seller });
});

/* ── GET /api/sellers/me ── */
exports.me = asyncHandler(async (req, res) => {
  const seller = await prisma.seller.findUnique({
    where: { userId: req.user.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  if (!seller) throw ApiError.notFound('Seller profile not found');
  res.json({ success: true, data: seller });
});

/* ── GET /api/sellers/me/orders ── (The Seller's Inbox) ── */
exports.getSellerOrders = asyncHandler(async (req, res) => {
  const sellerId = req.seller.id;

  // Find orders that contain at least one item belonging to this seller
  const orders = await prisma.order.findMany({
    where: {
      items: { some: { offer: { sellerId: sellerId } } }
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: {
        where: { offer: { sellerId: sellerId } }, // Only show this seller's items in the order
        include: { offer: { include: { product: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ success: true, data: orders });
});

/* ── PATCH /api/sellers/me/orders/:id/status ── */
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const orderId = req.params.id;
  const sellerId = req.seller.id;

  // Verify this seller has an item in this order before updating
  const order = await prisma.order.findFirst({
    where: { 
      id: orderId,
      items: { some: { offer: { sellerId: sellerId } } }
    }
  });

  if (!order) throw ApiError.notFound('Order not found or unauthorized');

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status }
  });

  res.json({ success: true, data: updatedOrder });
});

/* ── GET /api/sellers/me/stats ── */
exports.stats = asyncHandler(async (req, res) => {
  const sellerId = req.seller.id;

  const offers = await prisma.offer.findMany({
    where: { sellerId },
    include: { product: true },
  });

  const lowStock = offers
    .filter(o => o.stock > 0 && o.stock <= 3 && o.status === 'active')
    .map(o => ({ name: o.product?.name || 'Product', qty: o.stock, unit: o.unit }));
  const stockByUnit = offers
    .filter(o => o.stock > 0 && o.status === 'active')
    .reduce((totals, offer) => {
      totals[offer.unit] = (totals[offer.unit] || 0) + offer.stock;
      return totals;
    }, {});

  res.json({
    success: true,
    data: {
      revenueToday: null,
      revenueTodayFormatted: null,
      ordersNew: null,
      orderTrackingAvailable: false,
      offersActive: offers.filter(o => o.status === 'active' && o.stock > 0).length,
      offersTotal: offers.length,
      offersDraft: offers.filter(o => o.status === 'draft').length,
      stockByUnit,
      rating: req.seller.rating || 0,
      ratingCount: 0,
      fulfillmentRate: req.seller.fulfillmentRate || 100,
      lowStock,
      recentOrders: [],
    },
  });
});

/* ── PATCH /api/sellers/me ── */
exports.updateMe = asyncHandler(async (req, res) => {
  const allowed = ['businessName', 'businessType', 'phone', 'city', 'country', 'bio'];
  const patch = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });

  const seller = await prisma.seller.update({
    where: { id: req.seller.id },
    data: patch,
  });
  res.json({ success: true, data: seller });
});

/* ── GET /api/sellers/:id ── public storefront ── */
exports.publicProfile = asyncHandler(async (req, res) => {
  const seller = await prisma.seller.findFirst({
    where: { 
      id: req.params.id,
      verificationStatus: 'verified'
    },
    select: {
      id: true, businessName: true, businessType: true, scale: true, 
      city: true, country: true, bio: true, rating: true, 
      fulfillmentRate: true, createdAt: true,
      offers: {
        where: { status: 'active', stock: { gt: 0 } },
        include: { product: true },
        orderBy: { pricePerKg: 'asc' }
      }
    }
  });

  if (!seller) throw ApiError.notFound('Seller not found');

  res.json({ success: true, data: seller });
});