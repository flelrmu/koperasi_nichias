const express = require('express');
const router = express.Router();
const simpanPinjamController = require('../controllers/simpanPinjamController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(verifyToken);


router.get('/konfigurasi', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Bendahara', 'Anggota'), simpanPinjamController.getKonfigurasiSimpanan);

// Simpanan - Read (Bendahara can view)
router.get('/simpanan', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Bendahara'), simpanPinjamController.getAllSimpanan);
// Simpanan - Write (Bendahara cannot modify)
router.put('/simpanan/:id', authorizeRoles('Koordinator_Simpan_Pinjam'), simpanPinjamController.updateSimpanan);

// Transaksi Simpanan - Write only
router.post('/simpanan/transaksi', authorizeRoles('Koordinator_Simpan_Pinjam'), simpanPinjamController.createTransaksiSimpanan);
router.post('/simpanan/transaksi/bulk-wajib', authorizeRoles('Koordinator_Simpan_Pinjam'), simpanPinjamController.bulkCreateSimpananWajib);
router.post('/simpanan/tarik-semua/:anggotaId', authorizeRoles('Koordinator_Simpan_Pinjam'), simpanPinjamController.tarikSemuaSimpanan);

// Pinjaman - Read (Bendahara can view)
router.get('/pinjaman', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Bendahara'), simpanPinjamController.getAllPinjaman);
router.get('/pinjaman/:id', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Bendahara', 'Anggota'), simpanPinjamController.getPinjamanById);
// Pinjaman - Write (Bendahara cannot modify)
router.post('/pinjaman', authorizeRoles('Anggota'), simpanPinjamController.createPinjaman);
router.put('/pinjaman/:id', authorizeRoles('Koordinator_Simpan_Pinjam'), simpanPinjamController.updatePinjamanStatus);
router.post('/pinjaman/transaksi/bulk-angsuran', authorizeRoles('Koordinator_Simpan_Pinjam'), simpanPinjamController.bulkProcessAngsuran);
router.post('/pinjaman/:id/lunaskan', authorizeRoles('Koordinator_Simpan_Pinjam'), simpanPinjamController.lunaskanPinjaman);
router.delete('/pinjaman/:id', authorizeRoles('Koordinator_Simpan_Pinjam'), simpanPinjamController.deletePinjaman);

module.exports = router;
