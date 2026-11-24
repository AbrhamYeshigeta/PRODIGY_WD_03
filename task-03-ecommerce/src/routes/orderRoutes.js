// src/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// Buyer routes
router.post('/checkout', protect, orderController.createOrder);
router.get('/verify/:transactionRef', protect, orderController.verifyMine);
router.post('/webhook', orderController.handleWebhook);
router.get('/', protect, orderController.listMine);
router.get('/:id', protect, orderController.getMine);
router.post('/:id/fulfillments/:fulfillmentId/confirm-receipt', protect, orderController.confirmFulfillmentReceipt);
router.post('/:id/confirm-receipt', protect, orderController.confirmReceipt);

module.exports = router;