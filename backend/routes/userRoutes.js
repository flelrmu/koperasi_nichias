const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Public route (accessible by guests)
router.get('/contact/sekretaris', userController.getSecretaryContact);

// Semua route di bawah ini memerlukan login (verifyToken)
router.use(verifyToken);


// Route khusus Manajemen Profil Pribadi (berlaku untuk semua role yang login)
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/profile/password', userController.changePassword);
router.post('/profile/photo', upload.single('photo'), userController.uploadProfilePhoto);

// Hanya pengurus (Sekretaris, Ketua, Bendahara, dll) yang bisa melihat daftar user
router.get('/anggota', authorizeRoles('Sekretaris', 'Ketua', 'Wakil_Ketua', 'Bendahara', 'Koordinator_Simpan_Pinjam'), userController.getAnggotaList);
router.get('/pengurus', authorizeRoles('Sekretaris', 'Ketua', 'Wakil_Ketua', 'Bendahara', 'Koordinator_Simpan_Pinjam'), userController.getPengurusList);

// Route khusus Approval Pendaftaran (Sekretaris & Ketua) — harus sebelum /:type/:id
router.put('/approve/:id', authorizeRoles('Sekretaris', 'Ketua'), userController.approveMember);

// Route khusus Pengunduran Diri (Keluar Koperasi)
router.post('/anggota/request-keluar', authorizeRoles('Anggota'), userController.requestKeluar);
router.post('/anggota/cancel-keluar', authorizeRoles('Anggota'), userController.cancelKeluar);
router.post('/anggota/approve-keluar', authorizeRoles('Sekretaris', 'Ketua'), userController.approveKeluar);

// Route untuk Update & Delete (Khusus Sekretaris/Role Pimpinan)
router.get('/:type/:id', authorizeRoles('Sekretaris', 'Ketua', 'Bendahara', 'Wakil_Ketua'), userController.getUserDetail);
router.put('/:type/:id', authorizeRoles('Sekretaris', 'Ketua', 'Bendahara'), userController.updateUser);
router.delete('/:type/:id', authorizeRoles('Sekretaris', 'Ketua'), userController.deleteUser);

module.exports = router;
