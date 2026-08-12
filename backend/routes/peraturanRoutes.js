const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  getAllPeraturan,
  getPeraturanById,
  createPeraturan,
  updatePeraturan,
  deletePeraturan,
} = require('../controllers/peraturanController');


router.get('/', getAllPeraturan);
router.get('/:id', getPeraturanById);


router.post('/', verifyToken, authorizeRoles('Sekretaris'), createPeraturan);
router.put('/:id', verifyToken, authorizeRoles('Sekretaris'), updatePeraturan);
router.delete('/:id', verifyToken, authorizeRoles('Sekretaris'), deletePeraturan);

module.exports = router;
