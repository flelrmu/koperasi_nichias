const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');


// In most cases this should be protected by auth middleware
// router.get('/', auth, dashboardController.getDashboardStats);
router.get('/', dashboardController.getDashboardStats);

module.exports = router;
