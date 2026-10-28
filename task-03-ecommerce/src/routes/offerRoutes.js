// src/routes/offerRoutes.js
const express = require('express');
const router  = express.Router();
const offerController = require('../controllers/offerController');
const { protect }     = require('../middleware/auth');
const { requireVerifiedSeller } = require('../middleware/authorize');

router.patch('/:id',         protect, requireVerifiedSeller, offerController.update);
router.patch('/:id/pause',   protect, requireVerifiedSeller, offerController.togglePause);
router.delete('/:id',        protect, requireVerifiedSeller, offerController.remove);

module.exports = router;