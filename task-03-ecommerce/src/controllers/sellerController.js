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
  res.json({ success: true, data: await listSellerOrderRows(req.seller.id) });
});

/* ── PATCH /api/sellers/me/orders/:id/status ── */
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const {
    status,
    courierName,
    courierPhone,
    vehicleReference,
    trackingReference,
    estimatedDeliveryAt,
  } = req.body || {};
  if (!['processing', 'shipped'].includes(status)) {
    throw ApiError.badRequest('Choose a valid fulfillment status.');
  }
  const normalizedCourierName = typeof courierName === 'string' ? courierName.trim() : '';
  const normalizedCourierPhone = typeof courierPhone === 'string' ? courierPhone.trim() : '';
  const normalizedVehicleReference = typeof vehicleReference === 'string' ? vehicleReference.trim() : '';
  const normalizedTrackingReference = typeof trackingReference === 'string' ? trackingReference.trim() : '';

  if (status === 'shipped') {
    const phoneDigits = normalizedCourierPhone.replace(/\D/g, '');
    if (normalizedCourierName.length < 2 || normalizedCourierName.length > 80) {
      throw ApiError.badRequest('Enter the courier or driver name (2–80 characters).');
    }
    if (normalizedCourierPhone.length > 24 || phoneDigits.length < 7 || phoneDigits.length > 15) {
      throw ApiError.badRequest('Enter a valid courier phone number with 7–15 digits.');
    }
    if (normalizedVehicleReference.length > 80 || normalizedTrackingReference.length > 120) {
      throw ApiError.badRequest('The vehicle or tracking reference is too long.');
    }
    if (!estimatedDeliveryAt || Number.isNaN(new Date(estimatedDeliveryAt).getTime())) {
      throw ApiError.badRequest('Enter a valid estimated delivery date and time.');
    }
    if (new Date(estimatedDeliveryAt).getTime() <= Date.now()) {
      throw ApiError.badRequest('Estimated delivery must be in the future.');
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${req.params.id} FOR UPDATE`;
    const order = await tx.order.findFirst({
      where: {
        id: req.params.id,
        items: { some: { sellerId: req.seller.id } },
      },
      include: { items: true },
    });
    if (!order) throw ApiError.notFound('Order not found.');
    if (order.paymentStatus === 'pending' || order.paymentStatus === 'failed') {
      throw ApiError.badRequest('This order is not ready for fulfillment.');
    }
    if (order.status === 'cancelled') {
      throw ApiError.conflict('Cancelled orders cannot be fulfilled.');
    }

    const sellerItems = order.items.filter((item) => item.sellerId === req.seller.id);
    const previousStatus = status === 'processing' ? 'paid' : 'processing';
    if (!sellerItems.length || sellerItems.some((item) => item.status !== previousStatus)) {
      throw ApiError.conflict(`Your order items must all be ${previousStatus} before marking them ${status}.`);
    }

    const changedItems = await tx.orderItem.updateMany({
      where: {
        orderId: order.id,
        sellerId: req.seller.id,
        status: previousStatus,
      },
      data: { status },
    });
    if (changedItems.count !== sellerItems.length) {
      throw ApiError.conflict('Order items changed during this update. Refresh and try again.');
    }

    const itemsBySeller = new Map();
    for (const item of order.items) {
      const sellerItemsForOrder = itemsBySeller.get(item.sellerId) || [];
      sellerItemsForOrder.push(item);
      itemsBySeller.set(item.sellerId, sellerItemsForOrder);
    }

    for (const [sellerId, sellerOrderItems] of itemsBySeller) {
      const itemStatuses = sellerOrderItems.map((item) => (
        sellerId === req.seller.id ? status : item.status
      ));
      const fulfillmentStatus = itemStatuses.every((itemStatus) => itemStatus === itemStatuses[0])
        ? itemStatuses[0]
        : 'processing';
      const existingFulfillment = await tx.fulfillment.findUnique({
        where: { orderId_sellerId: { orderId: order.id, sellerId } },
      });

      if (!existingFulfillment) {
        await tx.fulfillment.create({
          data: {
            orderId: order.id,
            sellerId,
            status: fulfillmentStatus,
            ...(status === 'processing' ? { processingAt: new Date() } : {}),
            items: { connect: sellerOrderItems.map((item) => ({ id: item.id })) },
            ...(sellerId === req.seller.id && status === 'shipped' ? {
              courierName: normalizedCourierName,
              courierPhone: normalizedCourierPhone,
              vehicleReference: normalizedVehicleReference || null,
              trackingReference: normalizedTrackingReference || null,
              estimatedDeliveryAt: new Date(estimatedDeliveryAt),
              shippedAt: new Date(),
            } : {}),
          },
        });
      } else if (sellerId === req.seller.id) {
        await tx.fulfillment.update({
          where: { id: existingFulfillment.id },
          data: {
            status,
            ...(status === 'processing' ? { processingAt: new Date() } : {}),
            ...(status === 'shipped' ? {
              courierName: normalizedCourierName,
              courierPhone: normalizedCourierPhone,
              vehicleReference: normalizedVehicleReference || null,
              trackingReference: normalizedTrackingReference || null,
              estimatedDeliveryAt: new Date(estimatedDeliveryAt),
              shippedAt: new Date(),
            } : {}),
          },
        });
        await tx.orderItem.updateMany({
          where: { orderId: order.id, sellerId, fulfillmentId: null },
          data: { fulfillmentId: existingFulfillment.id },
        });
      }
    }

    const allFulfillments = await tx.fulfillment.findMany({
      where: { orderId: order.id },
      select: { status: true },
    });
    const statuses = allFulfillments.map((item) => item.status);
    const orderStatus = statuses.every((itemStatus) => itemStatus === 'shipped')
      ? 'shipped'
      : statuses.some((itemStatus) => ['processing', 'shipped'].includes(itemStatus))
        ? 'processing'
        : statuses.every((itemStatus) => itemStatus === 'paid')
          ? 'paid'
          : order.status;
    await tx.order.update({
      where: { id: order.id },
      data: { status: orderStatus },
    });
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        actorId: req.user.id,
        actorRole: 'seller',
        status,
        note: status === 'shipped'
          ? `${req.seller.businessName} shipped the order with ${normalizedCourierName}.`
          : `${req.seller.businessName} marked their items ${status}.`,
      },
    });
    return tx.order.findUnique({ where: { id: order.id } });
  });

  res.json({ success: true, data: updated });
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [paidItemsToday, newOrderItems, recentOrders] = await Promise.all([
    prisma.orderItem.findMany({
      where: { sellerId, order: { paymentStatus: 'paid', createdAt: { gte: today } } },
      select: { sellerAmount: true },
    }),
    prisma.orderItem.findMany({
      where: { sellerId, status: 'paid' },
      select: { orderId: true },
      distinct: ['orderId'],
    }),
    listSellerOrderRows(sellerId, 5),
  ]);
  const revenueToday = paidItemsToday.reduce((sum, item) => sum + item.sellerAmount, 0) / 100;
  const money = new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
  });

  res.json({
    success: true,
    data: {
      revenueToday,
      revenueTodayFormatted: money.format(revenueToday),
      ordersNew: newOrderItems.length,
      orderTrackingAvailable: true,
      offersActive: offers.filter(o => o.status === 'active' && o.stock > 0).length,
      offersTotal: offers.length,
      offersDraft: offers.filter(o => o.status === 'draft').length,
      stockByUnit,
      rating: req.seller.rating || 0,
      ratingCount: 0,
      fulfillmentRate: req.seller.fulfillmentRate || 100,
      lowStock,
      recentOrders: recentOrders.map((order) => ({
        ...order,
        total: order.total / 100,
        buyer: order.buyer.name,
        quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
        items: order.items.map((item) => ({
          product: { name: item.productName, image: item.productImage },
          quantity: item.quantity,
        })),
      })),
    },
  });
});

async function listSellerOrderRows(sellerId, take) {
  const items = await prisma.orderItem.findMany({
    where: { sellerId },
    include: {
      order: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
          payments: {
            select: { transactionRef: true, provider: true, status: true, verifiedAt: true },
          },
        },
      },
      fulfillment: {
        include: {
          seller: { select: { businessName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    ...(take ? { take: take * 10 } : {}),
  });
  const grouped = new Map();
  for (const item of items) {
    let order = grouped.get(item.orderId);
    if (!order) {
      const payment = item.order.payments[0];
      const fulfillment = item.fulfillment;
      order = {
        id: item.order.id,
        createdAt: item.order.createdAt,
        status: item.order.status,
        fulfillmentStatus: item.fulfillment?.status || item.status,
        courierName: fulfillment?.courierName || null,
        courierPhone: fulfillment?.courierPhone || null,
        vehicleReference: fulfillment?.vehicleReference || null,
        trackingReference: fulfillment?.trackingReference || null,
        estimatedDeliveryAt: fulfillment?.estimatedDeliveryAt || null,
        shippedAt: fulfillment?.shippedAt || null,
        deliveredAt: fulfillment?.deliveredAt || null,
        paymentStatus: item.order.paymentStatus,
        settlementStatus: item.order.settlementStatus,
        paymentMethod: item.order.paymentMethod,
        transactionRef: payment?.transactionRef || null,
        buyer: item.order.user,
        delivery: item.order.shippingAddress,
        total: 0,
        items: [],
      };
      grouped.set(item.orderId, order);
    }
    order.total += item.sellerAmount;
    order.items.push({
      id: item.id,
      productName: item.productName,
      productImage: item.productImage,
      sellerName: item.sellerName,
      quantity: item.quantity,
      unit: item.quantityUnit,
      lineTotal: item.lineTotal,
      sellerAmount: item.sellerAmount,
      status: item.status,
    });
  }
  const rows = [...grouped.values()];
  return take ? rows.slice(0, take) : rows;
}

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