const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

// Semua route notifikasi memerlukan login
router.use(verifyToken);

// GET /api/notifications - ambil daftar notifikasi user
router.get('/', notificationController.getNotifications);

// PUT /api/notifications/read-all - tandai semua sebagai dibaca (harus sebelum /:id/read)
router.put('/read-all', notificationController.markAllAsRead);

// PUT /api/notifications/:id/read - tandai satu sebagai dibaca
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
