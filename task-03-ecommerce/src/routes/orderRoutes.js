// src/routes/orderRoutes.js
const express = require('express');
const router  = express.Router();
const orderController = require('../controllers/orderController');
const { protect }     = require('../middleware/auth');

router.post('/',              protect, orderController.create);
router.get('/',               protect, orderController.listMine);

module.exports = router;