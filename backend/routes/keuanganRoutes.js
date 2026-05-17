const express = require('express');
const router = express.Router();
const keuanganController = require('../controllers/keuanganController');
const neracaController = require('../controllers/neracaController');
const shuController = require('../controllers/shuController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Arus Kas
router.get('/arus-kas', authorizeRoles('Bendahara', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Koordinator_Simpan_Pinjam'), keuanganController.getAllArusKas);
router.post('/arus-kas', authorizeRoles('Bendahara'), keuanganController.createArusKas);
router.put('/arus-kas/:id', authorizeRoles('Bendahara'), keuanganController.updateArusKas);
router.delete('/arus-kas/:id', authorizeRoles('Bendahara'), keuanganController.deleteArusKas);
router.get('/saldo-kas', authorizeRoles('Bendahara', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Koordinator_Simpan_Pinjam'), keuanganController.getSaldoKas);
router.put('/saldo-kas', authorizeRoles('Bendahara'), keuanganController.editSaldoKas);

// Kategori Kas
router.get('/kategori', authorizeRoles('Bendahara', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Koordinator_Simpan_Pinjam'), keuanganController.getAllKategori);
router.post('/kategori', authorizeRoles('Bendahara'), keuanganController.createKategori);
router.put('/kategori/:id', authorizeRoles('Bendahara'), keuanganController.updateKategori);
router.delete('/kategori/:id', authorizeRoles('Bendahara'), keuanganController.deleteKategori);

// Neraca
router.get('/neraca', authorizeRoles('Bendahara', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Koordinator_Simpan_Pinjam'), neracaController.getNeraca);
router.get('/neraca/tahunan', authorizeRoles('Bendahara', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Koordinator_Simpan_Pinjam'), neracaController.getNeracaTahunan);

// SHU
router.get('/shu/preview', authorizeRoles('Bendahara'), shuController.getPreview);
router.post('/shu/proses', authorizeRoles('Bendahara'), shuController.prosesSHU);
router.put('/shu/finalize', authorizeRoles('Bendahara'), shuController.finalizeSHU);
router.put('/shu/cancel-finalize', authorizeRoles('Bendahara'), shuController.cancelFinalizeSHU);
router.delete('/shu/:tahun', authorizeRoles('Bendahara'), shuController.cancelSHU);

// Periode & Tutup Buku
router.get('/periode-status', authorizeRoles('Bendahara', 'Ketua', 'Wakil_Ketua', 'Sekretaris', 'Koordinator_Simpan_Pinjam'), keuanganController.getPeriodeStatus);
router.post('/tutup-buku', authorizeRoles('Bendahara'), keuanganController.tutupBuku);

module.exports = router;
