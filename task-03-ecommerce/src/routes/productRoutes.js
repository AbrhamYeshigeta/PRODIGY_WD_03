// src/routes/productRoutes.js
const express = require('express');
const router  = express.Router();
const productController = require('../controllers/productController');
const offerController   = require('../controllers/offerController');

router.get('/',                productController.list);
router.get('/:slug',           productController.getOne);
router.get('/:slug/offers',    offerController.listByProduct);

module.exports = router;