const express = require('express');
const router = express.Router();
const simpanPinjamController = require('../controllers/simpanPinjamController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Konfigurasi simpanan (all management roles can read)
router.get('/konfigurasi', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Sekretaris', 'Bendahara'), simpanPinjamController.getKonfigurasiSimpanan);

// Simpanan
router.get('/simpanan', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Sekretaris', 'Bendahara'), simpanPinjamController.getAllSimpanan);
router.put('/simpanan/:id', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Bendahara'), simpanPinjamController.updateSimpanan);

// Transaksi Simpanan (CRUD by Koordinator)
router.post('/simpanan/transaksi', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Bendahara'), simpanPinjamController.createTransaksiSimpanan);
router.post('/simpanan/transaksi/bulk-wajib', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Bendahara'), simpanPinjamController.bulkCreateSimpananWajib);
router.put('/simpanan/transaksi/:id', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Bendahara'), simpanPinjamController.updateTransaksiSimpanan);
router.get('/transaksi/:anggotaId', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Sekretaris', 'Bendahara'), simpanPinjamController.getTransaksiByAnggota);

// Pinjaman
router.get('/pinjaman', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Sekretaris', 'Bendahara'), simpanPinjamController.getAllPinjaman);
router.post('/pinjaman', authorizeRoles('Anggota'), simpanPinjamController.createPinjaman);
router.put('/pinjaman/:id', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Bendahara'), simpanPinjamController.updatePinjamanStatus);

module.exports = router;
