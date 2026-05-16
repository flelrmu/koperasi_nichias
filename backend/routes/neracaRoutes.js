const express = require('express');
const router = express.Router();
const neracaController = require('../controllers/neracaController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Semua route di sini memerlukan login
router.use(authMiddleware);

// Ambil data neraca (Akses: Bendahara, Ketua, dll)
router.get('/', neracaController.getNeraca);

// Tutup Buku (Akses: Khusus Bendahara)
router.post('/tutup-buku', roleMiddleware(['Bendahara']), neracaController.tutupBuku);

module.exports = router;
