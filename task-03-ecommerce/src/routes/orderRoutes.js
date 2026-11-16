// src/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// Buyer routes
router.post('/checkout', protect, orderController.createOrder);
router.get('/', protect, orderController.listMine);

module.exports = router;