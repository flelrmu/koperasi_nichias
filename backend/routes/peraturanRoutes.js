const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getAllPeraturan,
  getSukuBunga,
  getPeraturanById,
  createPeraturan,
  updatePeraturan,
  deletePeraturan,
} = require('../controllers/peraturanController');

// Public routes (accessible by all authenticated users + guest for list)
router.get('/', getAllPeraturan);
router.get('/suku-bunga', getSukuBunga);
router.get('/:id', getPeraturanById);

// Protected routes (hanya Sekretaris)
router.post('/', verifyToken, authorizeRoles('Sekretaris'), createPeraturan);
router.put('/:id', verifyToken, authorizeRoles('Sekretaris'), updatePeraturan);
router.delete('/:id', verifyToken, authorizeRoles('Sekretaris'), deletePeraturan);

module.exports = router;
