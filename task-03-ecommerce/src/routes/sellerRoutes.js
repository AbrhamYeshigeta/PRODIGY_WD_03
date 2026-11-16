// src/routes/sellerRoutes.js
const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const offerController = require('../controllers/offerController');
const { protect } = require('../middleware/auth');
const { attachSeller, requireVerifiedSeller } = require('../middleware/authorize');
const upload = require('../middleware/upload');

/* ── Public Routes ── */
// Keep /me ahead of the public profile route so "me" is never treated as a seller ID.
router.get('/me', protect, attachSeller, sellerController.me);

// Get a seller's public profile & offers
router.get('/:id', sellerController.publicProfile);

/* ── Protected Routes (Requires Login) ── */
router.use(protect); // Everything below this requires a valid JWT cookie

// Apply to become a seller
router.post('/apply', upload.documents, sellerController.apply);

// My Seller Profile
router.patch('/me', attachSeller, sellerController.updateMe);

// My Dashboard Stats
router.get('/me/stats', attachSeller, sellerController.stats);

// My Incoming Orders
router.get('/me/orders', requireVerifiedSeller, sellerController.getSellerOrders);
router.patch('/me/orders/:id/status', requireVerifiedSeller, sellerController.updateOrderStatus);

// My Offers
router.get('/me/offers', attachSeller, offerController.listMine);
router.post('/me/offers', attachSeller, upload.offerPhotos, offerController.create);

module.exports = router;