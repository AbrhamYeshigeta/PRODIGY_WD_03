// src/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/', protect, cartController.getCart);
router.post('/add', protect, cartController.addToCart);
router.delete('/remove/:itemId', protect, cartController.removeFromCart);
router.patch('/update/:itemId', protect, cartController.updateCartItem);
module.exports = router;