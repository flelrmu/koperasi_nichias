const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Semua route di sini memerlukan login (verifyToken)
router.use(verifyToken);

// Route khusus Manajemen Profil Pribadi (berlaku untuk semua role yang login)
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/profile/password', userController.changePassword);

// Hanya pengurus (Sekretaris, Ketua, Bendahara, dll) yang bisa melihat daftar user
router.get('/anggota', authorizeRoles('Sekretaris', 'Ketua', 'Wakil_Ketua', 'Bendahara', 'Koordinator_Simpan_Pinjam'), userController.getAnggotaList);
router.get('/pengurus', authorizeRoles('Sekretaris', 'Ketua', 'Wakil_Ketua', 'Bendahara', 'Koordinator_Simpan_Pinjam'), userController.getPengurusList);

// Route khusus Approval Pendaftaran (Sekretaris & Ketua) — harus sebelum /:type/:id
router.put('/approve/:id', authorizeRoles('Sekretaris', 'Ketua'), userController.approveMember);

// Route untuk Update & Delete (Khusus Sekretaris/Role Pimpinan)
router.get('/:type/:id', authorizeRoles('Sekretaris', 'Ketua', 'Bendahara', 'Wakil_Ketua'), userController.getUserDetail);
router.put('/:type/:id', authorizeRoles('Sekretaris', 'Ketua', 'Bendahara'), userController.updateUser);
router.delete('/:type/:id', authorizeRoles('Sekretaris', 'Ketua'), userController.deleteUser);

module.exports = router;
