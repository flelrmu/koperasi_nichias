const express = require('express');
const router = express.Router();
const simpanPinjamController = require('../controllers/simpanPinjamController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Konfigurasi simpanan (all roles including Anggota can read for simulation/info)
router.get('/konfigurasi', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Bendahara', 'Anggota'), simpanPinjamController.getKonfigurasiSimpanan);

// Simpanan
router.get('/simpanan', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Bendahara'), simpanPinjamController.getAllSimpanan);
router.put('/simpanan/:id', authorizeRoles('Koordinator_Simpan_Pinjam', 'Bendahara'), simpanPinjamController.updateSimpanan);

// Transaksi Simpanan (CRUD by Koordinator)
router.post('/simpanan/transaksi', authorizeRoles('Koordinator_Simpan_Pinjam', 'Bendahara'), simpanPinjamController.createTransaksiSimpanan);
router.post('/simpanan/transaksi/bulk-wajib', authorizeRoles('Koordinator_Simpan_Pinjam', 'Bendahara'), simpanPinjamController.bulkCreateSimpananWajib);
router.post('/simpanan/tarik-semua/:anggotaId', authorizeRoles('Koordinator_Simpan_Pinjam', 'Bendahara'), simpanPinjamController.tarikSemuaSimpanan);

// Pinjaman
router.get('/pinjaman', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Bendahara'), simpanPinjamController.getAllPinjaman);
router.get('/pinjaman/:id', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Bendahara', 'Anggota'), simpanPinjamController.getPinjamanById);
router.post('/pinjaman', authorizeRoles('Anggota'), simpanPinjamController.createPinjaman);
router.put('/pinjaman/:id', authorizeRoles('Koordinator_Simpan_Pinjam', 'Bendahara'), simpanPinjamController.updatePinjamanStatus);
router.post('/pinjaman/transaksi/bulk-angsuran', authorizeRoles('Koordinator_Simpan_Pinjam', 'Bendahara'), simpanPinjamController.bulkProcessAngsuran);
router.post('/pinjaman/:id/lunaskan', authorizeRoles('Koordinator_Simpan_Pinjam', 'Bendahara'), simpanPinjamController.lunaskanPinjaman);
router.delete('/pinjaman/:id', authorizeRoles('Koordinator_Simpan_Pinjam', 'Bendahara'), simpanPinjamController.deletePinjaman);

module.exports = router;
