const crypto = require('crypto');
const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const chapa = require('../services/chapa');
const env = require('../config/env');
const { OFFER_UNITS, PLATFORM_COMMISSION_PCT } = require('../config/constants');

const FREE_DELIVERY_THRESHOLD = 50000;
const STANDARD_DELIVERY_FEE = 5000;
const EXPRESS_DELIVERY_FEE = 12000;

const recordOrderEvent = (tx, { orderId, actorId = null, actorRole, status, note }) =>
  tx.orderEvent.create({
    data: { orderId, actorId, actorRole, status, note },
  });

const getUnitPrice = (offer) => OFFER_UNITS[offer.unit]?.kgFactor
  ? offer.pricePerKg
  : offer.pricePerUnit;

const getStockQuantity = (quantity, offer) => {
  const kgFactor = OFFER_UNITS[offer.unit]?.kgFactor;
  return kgFactor ? quantity / kgFactor : quantity;
};

const isValidAddress = (address) => address
  && typeof address === 'object'
  && ['name', 'email', 'phone', 'city', 'address'].every((key) => (
    typeof address[key] === 'string' && address[key].trim().length > 0
  ));

async function releaseReservedOrder(orderId, paymentStatus = 'failed') {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.paymentStatus !== 'pending') return;

    for (const item of order.items) {
      if (item.offerId) {
        await tx.offer.update({
          where: { id: item.offerId },
          data: { stock: { increment: item.stockQuantity } },
        });
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'cancelled', paymentStatus },
    });
    await tx.orderItem.updateMany({
      where: { orderId },
      data: { status: 'cancelled' },
    });
    await tx.fulfillment.updateMany({
      where: { orderId },
      data: { status: 'cancelled' },
    });
    await tx.payment.updateMany({
      where: { orderId, status: 'pending' },
      data: { status: paymentStatus },
    });
  });
}

async function verifyTransaction(transactionRef) {
  const payment = await prisma.payment.findUnique({
    where: { transactionRef },
    include: { order: { include: { items: true } } },
  });
  if (!payment) throw ApiError.notFound('Payment transaction not found.');
  if (payment.status === 'paid') return payment.order;
  if (payment.status !== 'pending') throw ApiError.badRequest('This payment is no longer pending.');

  const result = await chapa.verify(transactionRef);
  const providerData = result?.data;
  if (!providerData || providerData.tx_ref !== transactionRef) {
    throw ApiError.badRequest('Payment verification returned an invalid transaction reference.');
  }

  if (String(providerData.status).toLowerCase() !== 'success') {
    await releaseReservedOrder(payment.orderId);
    throw ApiError.badRequest('Payment was not completed.');
  }

  const paidCents = Math.round(Number(providerData.amount) * 100);
  if (!Number.isFinite(paidCents) || paidCents !== payment.amount
    || String(providerData.currency).toUpperCase() !== payment.currency) {
    throw ApiError.badRequest('The verified payment amount does not match this order.');
  }

  return prisma.$transaction(async (tx) => {
    const currentPayment = await tx.payment.findUnique({ where: { id: payment.id } });
    if (currentPayment.status === 'paid') {
      return tx.order.findUnique({
        where: { id: payment.orderId },
        include: { items: true },
      });
    }
    if (currentPayment.status !== 'pending') {
      throw ApiError.badRequest('This payment is no longer pending.');
    }

    const now = new Date();
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'paid',
        providerReference: String(providerData.reference || ''),
        verifiedAt: now,
      },
    });
    const updatedOrder = await tx.order.update({
      where: { id: payment.orderId },
      data: { status: 'paid', paymentStatus: 'paid', settlementStatus: 'held' },
      include: { items: true },
    });
    await tx.orderItem.updateMany({
      where: { orderId: payment.orderId },
      data: { status: 'paid' },
    });
    await tx.fulfillment.updateMany({
      where: { orderId: payment.orderId },
      data: { status: 'paid' },
    });
    await recordOrderEvent(tx, {
      orderId: payment.orderId,
      actorRole: 'system',
      status: 'paid',
      note: 'Chapa payment verified. Seller settlement is held until delivery confirmation.',
    });
    return updatedOrder;
  });
}

/* POST /api/orders/checkout */
exports.createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'chapa', deliveryMethod = 'standard' } = req.body;
  if (!isValidAddress(shippingAddress)) {
    throw ApiError.badRequest('Enter your name, email, phone, city, and delivery address.');
  }
  if (!['chapa', 'cod'].includes(paymentMethod)) {
    throw ApiError.badRequest('Choose a supported payment method.');
  }
  if (!['standard', 'express'].includes(deliveryMethod)) {
    throw ApiError.badRequest('Choose a supported delivery option.');
  }
  if (paymentMethod === 'chapa' && !env.chapa.secretKey) {
    throw ApiError.internal('Online payment is not configured. Set CHAPA_SECRET_KEY to enable Chapa checkout.');
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: req.user.id },
    include: {
      items: {
        include: {
          offer: { include: { product: true, seller: true } },
        },
      },
    },
  });
  if (!cart?.items.length) throw ApiError.badRequest('Your cart is empty.');

  const txRef = paymentMethod === 'chapa'
    ? `ETF-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`
    : null;

  const order = await prisma.$transaction(async (tx) => {
    let subtotal = 0;
    const itemSnapshots = [];
    const fulfillmentGroups = new Map();

    for (const cartItem of cart.items) {
      const { offer } = cartItem;
      const unit = OFFER_UNITS[offer.unit];
      if (!unit || offer.status !== 'active'
        || offer.seller.verificationStatus !== 'verified') {
        throw ApiError.badRequest(`${offer.product.name} is no longer available.`);
      }

      const stockQuantity = getStockQuantity(cartItem.quantity, offer);
      if (!Number.isFinite(stockQuantity) || stockQuantity <= 0) {
        throw ApiError.badRequest(`Invalid quantity for ${offer.product.name}.`);
      }
      const reserved = await tx.offer.updateMany({
        where: { id: offer.id, status: 'active', stock: { gte: stockQuantity } },
        data: { stock: { decrement: stockQuantity } },
      });
      if (reserved.count !== 1) {
        throw ApiError.conflict(`${offer.product.name} no longer has enough stock.`);
      }

      const unitPrice = getUnitPrice(offer);
      const lineTotal = Math.round(unitPrice * cartItem.quantity);
      const commissionAmount = Math.round(lineTotal * PLATFORM_COMMISSION_PCT / 100);
      subtotal += lineTotal;
      itemSnapshots.push({
        offerId: offer.id,
        sellerId: offer.sellerId,
        productName: offer.product.name,
        productImage: offer.product.image,
        sellerName: offer.seller.businessName,
        quantity: cartItem.quantity,
        quantityUnit: unit.kgFactor ? 'kg' : offer.unit,
        stockQuantity,
        unitPrice,
        lineTotal,
        commissionAmount,
        sellerAmount: lineTotal - commissionAmount,
        status: paymentMethod === 'cod' ? 'paid' : 'pending_payment',
      });
      if (!fulfillmentGroups.has(offer.sellerId)) {
        fulfillmentGroups.set(offer.sellerId, {
          sellerId: offer.sellerId,
          status: paymentMethod === 'cod' ? 'paid' : 'pending_payment',
        });
      }
    }

    const shipping = (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE)
      + (deliveryMethod === 'express' ? EXPRESS_DELIVERY_FEE : 0);
    const totalAmount = subtotal + shipping;
    const estimatedDeliveryAt = new Date(
      Date.now() + (deliveryMethod === 'express' ? 24 : 72) * 60 * 60 * 1000
    );
    const createdOrder = await tx.order.create({
      data: {
        userId: req.user.id,
        subtotal,
        shipping,
        totalAmount,
        status: paymentMethod === 'cod' ? 'paid' : 'pending_payment',
        paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'pending',
        settlementStatus: paymentMethod === 'cod' ? 'not_applicable' : 'pending',
        paymentMethod,
        paymentReference: txRef,
        shippingAddress,
        fulfillments: {
          create: [...fulfillmentGroups.values()].map((fulfillment) => ({
            sellerId: fulfillment.sellerId,
            status: fulfillment.status,
            estimatedDeliveryAt,
          })),
        },
        events: {
          create: {
            actorId: req.user.id,
            actorRole: 'customer',
            status: paymentMethod === 'cod' ? 'paid' : 'pending_payment',
            note: paymentMethod === 'cod'
              ? 'Cash-on-delivery order accepted.'
              : 'Order placed and awaiting verified Chapa payment.',
          },
        },
        payments: {
          create: {
            provider: paymentMethod,
            transactionRef: txRef,
            amount: totalAmount,
            status: paymentMethod === 'cod' ? 'unpaid' : 'pending',
          },
        },
      },
      include: { fulfillments: { select: { id: true, sellerId: true } } },
    });

    const fulfillmentIds = new Map(
      createdOrder.fulfillments.map((fulfillment) => [fulfillment.sellerId, fulfillment.id])
    );
    await tx.orderItem.createMany({
      data: itemSnapshots.map((item) => {
        const fulfillmentId = fulfillmentIds.get(item.sellerId);
        if (!fulfillmentId) {
          throw new Error(`Missing fulfillment for seller ${item.sellerId}.`);
        }
        return {
          ...item,
          orderId: createdOrder.id,
          fulfillmentId,
        };
      }),
    });

    return tx.order.findUnique({
      where: { id: createdOrder.id },
      include: { items: true },
    });
  });

  if (paymentMethod === 'cod') {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return res.status(201).json({
      success: true,
      data: { orderId: order.id, paymentMethod, status: order.status },
    });
  }

  try {
    const origin = `${req.protocol}://${req.get('host')}`;
    const returnUrl = new URL(env.chapa.returnUrl || `${origin}/orders.html`);
    returnUrl.searchParams.set('tx_ref', txRef);
    const chapaResponse = await chapa.initialize({
      amount: (order.totalAmount / 100).toFixed(2),
      currency: order.currency,
      email: shippingAddress.email,
      firstName: shippingAddress.name.trim().split(/\s+/)[0],
      lastName: shippingAddress.name.trim().split(/\s+/).slice(1).join(' ') || 'Customer',
      phone: shippingAddress.phone,
      txRef,
      callbackUrl: env.chapa.callbackUrl || `${origin}/api/orders/webhook`,
      returnUrl: returnUrl.toString(),
    });
    const checkoutUrl = chapaResponse?.data?.checkout_url || chapaResponse?.checkout_url;
    if (chapaResponse?.status !== 'success' || !checkoutUrl) {
      throw new Error(chapaResponse?.message || 'Chapa did not return a checkout link.');
    }
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return res.status(201).json({
      success: true,
      data: { orderId: order.id, transactionRef: txRef, checkoutUrl },
    });
  } catch (error) {
    await releaseReservedOrder(order.id);
    throw error;
  }
});

/* GET /api/orders */
exports.listMine = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: {
      items: true,
      fulfillments: { include: { seller: { select: { businessName: true, city: true } } } },
      events: { orderBy: { createdAt: 'asc' } },
      payments: {
        select: {
          provider: true,
          transactionRef: true,
          amount: true,
          currency: true,
          status: true,
          verifiedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: orders });
});

/* GET /api/orders/:id */
exports.getMine = asyncHandler(async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: {
      items: true,
      fulfillments: {
        include: {
          seller: { select: { businessName: true, city: true } },
          items: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
      },
      events: { orderBy: { createdAt: 'asc' } },
      payments: {
        select: {
          provider: true,
          transactionRef: true,
          amount: true,
          currency: true,
          status: true,
          verifiedAt: true,
        },
      },
    },
  });
  if (!order) throw ApiError.notFound('Order not found.');
  res.json({ success: true, data: order });
});

/* POST /api/orders/:id/fulfillments/:fulfillmentId/confirm-receipt */
exports.confirmFulfillmentReceipt = asyncHandler(async (req, res) => {
  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.fulfillment.findFirst({
      where: {
        id: req.params.fulfillmentId,
        orderId: req.params.id,
        order: { userId: req.user.id },
      },
      include: { items: true, seller: { select: { businessName: true } } },
    });
    if (!existing) throw ApiError.notFound('Fulfillment not found.');
    if (existing.status !== 'shipped' || !existing.items.length
      || existing.items.some((item) => item.status !== 'shipped')) {
      throw ApiError.conflict('You can confirm receipt after this supermarket shipment has been shipped.');
    }

    const now = new Date();
    const updated = await tx.fulfillment.updateMany({
      where: { id: existing.id, status: 'shipped' },
      data: { status: 'delivered', deliveredAt: now },
    });
    if (updated.count !== 1) throw ApiError.conflict('This shipment changed before receipt could be confirmed.');

    await tx.orderItem.updateMany({
      where: { fulfillmentId: existing.id, status: 'shipped' },
      data: { status: 'delivered' },
    });

    const remaining = await tx.fulfillment.count({
      where: { orderId: existing.orderId, status: { notIn: ['delivered', 'completed', 'cancelled'] } },
    });
    const orderUpdate = remaining === 0
      ? { status: 'delivered', deliveredAt: now }
      : { status: 'processing' };
    await tx.order.update({ where: { id: existing.orderId }, data: orderUpdate });
    await recordOrderEvent(tx, {
      orderId: existing.orderId,
      actorId: req.user.id,
      actorRole: 'customer',
      status: 'delivered',
      note: `${existing.seller.businessName} shipment confirmed received by the buyer.`,
    });

    return tx.order.findUnique({
      where: { id: existing.orderId },
      include: {
        items: true,
        fulfillments: { include: { seller: { select: { businessName: true, city: true } } } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
  });
  res.json({ success: true, data: order });
});

/* POST /api/orders/:id/confirm-receipt */
exports.confirmReceipt = asyncHandler(async (req, res) => {
  const order = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { items: true },
    });
    if (!existing) throw ApiError.notFound('Order not found.');
    if (existing.status !== 'shipped' || !existing.items.length
      || existing.items.some((item) => item.status !== 'shipped')) {
      throw ApiError.conflict('You can confirm receipt after every item in the order has shipped.');
    }

    const now = new Date();
    const updated = await tx.order.updateMany({
      where: { id: existing.id, userId: req.user.id, status: 'shipped' },
      data: { status: 'delivered', deliveredAt: now },
    });
    if (updated.count !== 1) {
      throw ApiError.conflict('This order changed before receipt could be confirmed. Refresh and try again.');
    }
    const changedItems = await tx.orderItem.updateMany({
      where: { orderId: existing.id, status: 'shipped' },
      data: { status: 'delivered' },
    });
    if (changedItems.count !== existing.items.length) {
      throw ApiError.conflict('Order items changed before receipt could be confirmed. Refresh and try again.');
    }
    await recordOrderEvent(tx, {
      orderId: existing.id,
      actorId: req.user.id,
      actorRole: 'customer',
      status: 'delivered',
      note: 'Buyer confirmed receipt of the order.',
    });
    return tx.order.findUnique({
      where: { id: existing.id },
      include: { items: true, events: { orderBy: { createdAt: 'asc' } } },
    });
  });
  res.json({ success: true, data: order });
});

/* GET /api/orders/verify/:transactionRef */
exports.verifyMine = asyncHandler(async (req, res) => {
  const payment = await prisma.payment.findUnique({
    where: { transactionRef: req.params.transactionRef },
    include: { order: true },
  });
  if (!payment || payment.order.userId !== req.user.id) {
    throw ApiError.notFound('Payment transaction not found.');
  }
  const order = await verifyTransaction(payment.transactionRef);
  res.json({ success: true, data: { orderId: order.id, status: order.status } });
});

/* POST /api/orders/webhook — always verify with Chapa before changing order state. */
exports.handleWebhook = asyncHandler(async (req, res) => {
  const transactionRef = req.body?.tx_ref || req.body?.txRef || req.query?.tx_ref;
  if (typeof transactionRef !== 'string' || !transactionRef) {
    throw ApiError.badRequest('Missing payment transaction reference.');
  }
  await verifyTransaction(transactionRef);
  res.json({ success: true });
});
