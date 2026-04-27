const express = require('express');
const router = express.Router();
const simpanPinjamController = require('../controllers/simpanPinjamController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Hanya pengurus tertentu yang bisa mengakses modul simpan pinjam (misalnya Koordinator SP, Ketua, Sekretaris)
router.get('/simpanan', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Sekretaris', 'Bendahara'), simpanPinjamController.getAllSimpanan);
router.put('/simpanan/:id', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Bendahara'), simpanPinjamController.updateSimpanan);

router.get('/pinjaman', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Sekretaris', 'Bendahara'), simpanPinjamController.getAllPinjaman);
router.put('/pinjaman/:id', authorizeRoles('Koordinator_Simpan_Pinjam', 'Ketua', 'Bendahara'), simpanPinjamController.updatePinjamanStatus);

module.exports = router;
