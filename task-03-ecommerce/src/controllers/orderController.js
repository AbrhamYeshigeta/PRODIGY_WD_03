// src/controllers/orderController.js
const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { format: fmtMoney } = require('../utils/money');

/* ── POST /api/orders/checkout ── */
exports.createOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { shippingAddress, paymentMethod } = req.body;

  // 1. Get the user's cart and all related offer/product data
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          offer: true
        }
      }
    }
  });

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Your cart is empty');
  }

  // 2. Calculate totals and verify stock
  let subtotal = 0;
  for (const item of cart.items) {
    if (item.offer.stock < item.quantity) {
      throw ApiError.badRequest(`Insufficient stock for ${item.offer.id}`);
    }
    subtotal += item.offer.pricePerUnit * item.quantity;
  }
  const shipping = 5000; // 50.00 ETB
  const totalAmount = subtotal + shipping;

  // 3. Execute the order creation in a Transaction
  const order = await prisma.$transaction(async (tx) => {
    // A. Create the Order
    const newOrder = await tx.order.create({
      data: {
        userId,
        subtotal,
        shipping,
        totalAmount,
        shippingAddress: JSON.stringify(shippingAddress),
        paymentMethod,
        status: 'pending_payment',
        items: {
          create: cart.items.map(item => ({
            offerId: item.offerId,
            quantity: item.quantity,
            priceAtPurchase: item.offer.pricePerUnit
          }))
        }
      }
    });

    // B. Deduct stock from the Offers
    for (const item of cart.items) {
      await tx.offer.update({
        where: { id: item.offerId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    // C. Clear the user's cart
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id }
    });

    return newOrder;
  });

  res.status(201).json({ success: true, data: order });
});

/* ── GET /api/orders ── (Buyer's order history) ── */
exports.listMine = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: {
      items: {
        include: {
          offer: {
            include: { product: true, seller: { select: { businessName: true } } }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ success: true, data: orders });
});