const express = require('express');
const router = express.Router();
const keuanganController = require('../controllers/keuanganController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Arus Kas
router.get('/arus-kas', authorizeRoles('Bendahara', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Koordinator_Simpan_Pinjam'), keuanganController.getAllArusKas);
router.post('/arus-kas', authorizeRoles('Bendahara'), keuanganController.createArusKas);
router.put('/arus-kas/:id', authorizeRoles('Bendahara'), keuanganController.updateArusKas);
router.delete('/arus-kas/:id', authorizeRoles('Bendahara'), keuanganController.deleteArusKas);

// Kategori Kas
router.get('/kategori', authorizeRoles('Bendahara', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Koordinator_Simpan_Pinjam'), keuanganController.getAllKategori);
router.post('/kategori', authorizeRoles('Bendahara'), keuanganController.createKategori);
router.put('/kategori/:id', authorizeRoles('Bendahara'), keuanganController.updateKategori);
router.delete('/kategori/:id', authorizeRoles('Bendahara'), keuanganController.deleteKategori);

module.exports = router;
