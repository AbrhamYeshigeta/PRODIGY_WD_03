// src/routes/offerRoutes.js
const express = require('express');
const router  = express.Router();
const offerController = require('../controllers/offerController');
const { protect }     = require('../middleware/auth');
const { attachSeller } = require('../middleware/authorize');

router.patch('/:id',         protect, attachSeller, offerController.update);
router.patch('/:id/pause',   protect, attachSeller, offerController.togglePause);
router.delete('/:id',        protect, attachSeller, offerController.remove);

module.exports = router;