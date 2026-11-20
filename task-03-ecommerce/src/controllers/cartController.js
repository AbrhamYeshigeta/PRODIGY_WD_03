// src/controllers/cartController.js
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { OFFER_UNITS } = require('../config/constants');

const quantityConfig = (offer) => OFFER_UNITS[offer.unit];

function maxOrderQuantity(offer) {
  const config = quantityConfig(offer);
  if (!config?.kgFactor) return offer.stock;
  return Math.floor((offer.stock * config.kgFactor + 1e-8) / 0.5) * 0.5;
}

function isValidQuantity(quantity, offer) {
  const config = quantityConfig(offer);
  if (!config || !Number.isFinite(quantity) || quantity <= 0) return false;
  if (!config.kgFactor) return Number.isInteger(quantity);
  return quantity >= 0.5 && Math.abs(quantity * 2 - Math.round(quantity * 2)) < 1e-8;
}

function lineTotalCents(quantity, offer) {
  const config = quantityConfig(offer);
  const centsPerQuantity = config?.kgFactor ? offer.pricePerKg : offer.pricePerUnit;
  return Math.round(centsPerQuantity * quantity);
}

/* ── GET /api/cart ── */
exports.getCart = async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            offer: {
              include: {
                product: true,
                seller: { select: { businessName: true } }
              }
            }
          }
        }
      }
    });

    // 2. If no cart exists yet, return an empty cart structure
    if (!cart) {
      return res.status(200).json({ success: true, data: { items: [], total: 0 } });
    }

    // 3. Calculate total price
    const total = cart.items.reduce((sum, item) => sum + lineTotalCents(item.quantity, item.offer), 0);

    res.status(200).json({ success: true, data: { ...cart, total } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── POST /api/cart/add ── */
exports.addToCart = async (req, res) => {
  try {
    const { offerId, quantity } = req.body;
    const qty = Number(quantity);
    if (typeof offerId !== 'string' || !offerId.trim()) {
      return res.status(400).json({ success: false, message: 'Choose a product offer.' });
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { seller: { select: { verificationStatus: true } } },
    });
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (!isValidQuantity(qty, offer)) {
      const unit = quantityConfig(offer)?.kgFactor ? '0.5 kg' : 'whole-number';
      return res.status(400).json({ success: false, message: `Choose a valid ${unit} quantity greater than zero.` });
    }
    if (offer.status !== 'active' || offer.seller.verificationStatus !== 'verified') {
      return res.status(400).json({ success: false, message: 'This offer is no longer available.' });
    }

    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { userId: req.user.id },
        update: {},
        create: { userId: req.user.id },
      });
      const existingItem = await tx.cartItem.findUnique({
        where: { cartId_offerId: { cartId: cart.id, offerId } },
      });
      const nextQuantity = (existingItem?.quantity || 0) + qty;
      if (nextQuantity > maxOrderQuantity(offer)) {
        throw ApiError.badRequest('Not enough stock available.');
      }

      await tx.cartItem.upsert({
        where: { cartId_offerId: { cartId: cart.id, offerId } },
        update: { quantity: nextQuantity },
        create: { cartId: cart.id, offerId, quantity: qty },
      });
    });

    res.status(200).json({ success: true, message: 'Added to cart' });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error('Could not add offer to cart', err);
    res.status(500).json({ success: false, message: 'Could not add this offer to the cart.' });
  }
};

/* ── PATCH /api/cart/update/:itemId ── */
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const qty = Number(quantity);

    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { offer: true },
    });
    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found.' });
    if (!isValidQuantity(qty, item.offer)) {
      const unit = quantityConfig(item.offer)?.kgFactor ? '0.5 kg' : 'whole-number';
      return res.status(400).json({ success: false, message: `Choose a valid ${unit} quantity greater than zero.` });
    }
    if (item.offer.status !== 'active' || item.offer.stock <= 0) {
      return res.status(400).json({ success: false, message: 'This offer is no longer available.' });
    }
    if (qty > maxOrderQuantity(item.offer)) {
      return res.status(400).json({ success: false, message: 'Not enough stock available.' });
    }

    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: qty } });

    res.status(200).json({ success: true, message: 'Quantity updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ── DELETE /api/cart/remove/:itemId ── */
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Verify the item belongs to the user's cart before deleting
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    await prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id }
    });

    res.status(200).json({ success: true, message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};