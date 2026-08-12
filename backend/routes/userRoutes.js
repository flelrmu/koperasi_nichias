const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');


router.get('/contact/sekretaris', userController.getSecretaryContact);


router.use(verifyToken);



router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/profile/password', userController.changePassword);
router.post('/profile/photo', upload.single('photo'), userController.uploadProfilePhoto);


router.get('/anggota', authorizeRoles('Sekretaris', 'Ketua', 'Wakil_Ketua', 'Bendahara', 'Koordinator_Simpan_Pinjam'), userController.getAnggotaList);
router.get('/pengurus', authorizeRoles('Sekretaris', 'Ketua', 'Wakil_Ketua', 'Bendahara', 'Koordinator_Simpan_Pinjam'), userController.getPengurusList);


router.put('/approve/:id', authorizeRoles('Sekretaris', 'Ketua'), userController.approveMember);


router.post('/anggota/request-keluar', authorizeRoles('Anggota'), userController.requestKeluar);
router.post('/anggota/cancel-keluar', authorizeRoles('Anggota'), userController.cancelKeluar);
router.post('/anggota/approve-keluar', authorizeRoles('Sekretaris', 'Ketua'), userController.approveKeluar);


router.get('/:type/:id', authorizeRoles('Sekretaris', 'Ketua', 'Bendahara', 'Wakil_Ketua'), userController.getUserDetail);
router.put('/:type/:id', authorizeRoles('Sekretaris', 'Ketua', 'Bendahara'), userController.updateUser);
router.delete('/:type/:id', authorizeRoles('Sekretaris', 'Ketua'), userController.deleteUser);

module.exports = router;
