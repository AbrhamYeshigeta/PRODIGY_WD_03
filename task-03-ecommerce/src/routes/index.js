// src/routes/index.js
const express = require('express');
const router  = express.Router();

router.use('/auth',     require('./authRoutes'));
router.use('/sellers',  require('./sellerRoutes'));
router.use('/offers',   require('./offerRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/orders',   require('./orderRoutes'));
router.use('/cart',     require('./cartRoutes'));
/* router.use('/admin',  require('./adminRoutes')); */

module.exports = router;