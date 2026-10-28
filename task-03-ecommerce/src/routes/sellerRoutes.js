const express = require('express');
const router = express.Router();

const sellerController = require('../controllers/sellerControlller.js');
const offerController = require('../controllers/offerController.js');
const orderController = require('../controllers/orderController.js');
const { protect } = require('../middleware/auth.js');
const { attachSeller, requireVerifiedSeller } = require('../middleware/authorize.js');
const upload = require('../middleware/upload.js');

router.post('/apply', protect, upload.documents, sellerController.apply);
router.get('/me', protect, attachSeller, sellerController.me);
router.get('/me/stats', protect, requireVerifiedSeller, sellerController.stats);
router.patch('/me', protect, attachSeller, sellerController.updateMe);
router.get('/me/offers', protect, requireVerifiedSeller, offerController.listMine);
router.post('/me/offers', protect, requireVerifiedSeller, upload.offerPhotos, offerController.create);
router.get('/me/orders', protect, requireVerifiedSeller, orderController.listSellerOrders);
router.get('/:id', sellerController.publicProfile);

module.exports = router;