// src/controllers/orderController.js
const asyncHandler = require('../utils/asyncHandler');
const ApiError     = require('../utils/ApiError');
const Order        = require('../models/Order');
const Offer        = require('../models/Offer');
const Cart         = require('../models/Cart');
const generateOrderId = require('../utils/generateOrderId');
const { ORDER_STATUS, PAYMENT_METHODS } = require('../config/constants');
const { toCents } = require('../utils/money');

/* ── POST /api/orders ── create from cart */
exports.create = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, note } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.offer');
  if (!cart || !cart.items.length) throw ApiError.badRequest('Cart is empty');

  const items = [];
  let subtotal = 0;

  for (const line of cart.items) {
    const offer = line.offer;
    if (!offer || offer.status !== 'active') {
      throw ApiError.badRequest(`Offer no longer available`);
    }
    if (offer.stock < line.quantity) {
      throw ApiError.badRequest(`Insufficient stock for offer ${offer._id}`);
    }
    const lineTotal = offer.pricePerUnit * line.quantity;
    subtotal += lineTotal;

    items.push({
      offer: offer._id,
      seller: offer.seller,
      product: offer.product,
      unit: offer.unit,
      quantity: line.quantity,
      pricePerUnit: offer.pricePerUnit,
      lineTotal,
    });
  }

  const shipping = 5000; // 50.00 ETB flat — later: computed per seller
  const total = subtotal + shipping;

  const order = await Order.create({
    orderId: generateOrderId(),
    user: req.user._id,
    items,
    shippingAddress,
    subtotal,
    shipping,
    total,
    paymentMethod,
    note,
    status: ORDER_STATUS.PENDING_PAYMENT,
  });

  res.status(201).json({ success: true, data: order });
});

/* ── GET /api/orders ── my orders as buyer */
exports.listMine = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ success: true, data: orders });
});

/* ── GET /api/sellers/me/orders ── orders containing my offers */
exports.listSellerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ 'items.seller': req.seller._id })
    .populate('user', 'name phone')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ success: true, data: orders });
});

/* ── PATCH /api/orders/:id/status ── advance pipeline */
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findOne({ orderId: req.params.id, 'items.seller': req.seller._id });
  if (!order) throw ApiError.notFound('Order not found');

  order.status = status;
  await order.save();
  res.json({ success: true, data: order });
});