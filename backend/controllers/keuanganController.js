const { ArusKas, KategoriKas, User, Anggota, sequelize } = require('../models');
const { Op } = require('sequelize');
const ArusKasService = require('../services/ArusKasService');
const moment = require('moment');

// ==================== ARUS KAS ====================

/**
 * GET /api/keuangan/arus-kas
 * Ambil daftar arus kas dengan filter bulan dan tahun.
 */
exports.getAllArusKas = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    
    const where = {};
    if (bulan && tahun) {
      const startDate = moment(`${tahun}-${bulan}-01`, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
      const endDate = moment(`${tahun}-${bulan}-01`, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD');
      where.tanggal = { [Op.between]: [startDate, endDate] };
    } else if (tahun) {
      const startDate = moment(`${tahun}-01-01`, 'YYYY-MM-DD').startOf('year').format('YYYY-MM-DD');
      const endDate = moment(`${tahun}-12-31`, 'YYYY-MM-DD').endOf('year').format('YYYY-MM-DD');
      where.tanggal = { [Op.between]: [startDate, endDate] };
    }

    const data = await ArusKas.findAll({
      where,
      include: [
        { 
          model: KategoriKas, 
          as: 'kategoriKas',
          attributes: ['nama_kategori', 'jenis']
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'email'],
          include: [{ model: Anggota, as: 'anggota', attributes: ['nama_lengkap', 'no_anggota'] }]
        }
      ],
      order: [['tanggal', 'DESC'], ['kas_id', 'DESC']]
    });

    const latestTransaction = await ArusKas.findOne({ order: [['kas_id', 'DESC']] });
    const currentBalance = latestTransaction ? parseFloat(latestTransaction.saldo_akhir) : 0;

    res.json({ success: true, data, currentBalance });
  } catch (error) {
    console.error('Error getAllArusKas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/keuangan/arus-kas
 * Bendahara input manual arus kas (misal: pengeluaran operasional).
 */
exports.createArusKas = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { user_id, nama_kategori, nominal, keterangan, jenis } = req.body;

    const newEntry = await ArusKasService.recordTransaction({
      user_id,
      nama_kategori,
      nominal,
      keterangan,
      jenis // Optional: override default category type
    }, { transaction }, req.io);

    await transaction.commit();
    if (req.io) {
      req.io.emit('arus-kas-updated');
      req.io.emit('dashboardUpdate');
    }
    res.status(201).json({ success: true, data: newEntry, message: 'Transaksi arus kas berhasil dicatat.' });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error createArusKas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/keuangan/arus-kas/:id
 * Edit manual arus kas.
 */
exports.updateArusKas = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { nama_kategori, nominal, keterangan, jenis } = req.body;

    const updatedEntry = await ArusKasService.updateTransaction(id, {
      nama_kategori,
      nominal,
      keterangan,
      jenis
    }, { transaction }, req.io);

    await transaction.commit();
    if (req.io) {
      req.io.emit('arus-kas-updated');
      req.io.emit('dashboardUpdate');
    }
    res.json({ success: true, data: updatedEntry, message: 'Transaksi berhasil diperbarui.' });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error updateArusKas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/keuangan/arus-kas/:id
 * Hapus manual arus kas.
 */
exports.deleteArusKas = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    await ArusKasService.deleteTransaction(id, { transaction }, req.io);

    await transaction.commit();
    if (req.io) {
      req.io.emit('arus-kas-updated');
      req.io.emit('dashboardUpdate');
    }
    res.json({ success: true, message: 'Transaksi berhasil dihapus.' });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error deleteArusKas:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== KATEGORI KAS ====================

/**
 * GET /api/keuangan/kategori
 */
exports.getAllKategori = async (req, res) => {
  try {
    const data = await KategoriKas.findAll({
      order: [['nama_kategori', 'ASC']]
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/keuangan/kategori
 */
exports.createKategori = async (req, res) => {
  try {
    const { nama_kategori, jenis } = req.body;
    const existing = await KategoriKas.findOne({ where: { nama_kategori } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Nama kategori sudah ada.' });
    }

    const newCat = await KategoriKas.create({ nama_kategori, jenis });
    res.status(201).json({ success: true, data: newCat, message: 'Kategori berhasil ditambahkan.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/keuangan/kategori/:id
 */
exports.updateKategori = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kategori, jenis } = req.body;
    
    const kategori = await KategoriKas.findByPk(id);
    if (!kategori) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });

    await kategori.update({ nama_kategori, jenis });
    res.json({ success: true, data: kategori, message: 'Kategori berhasil diupdate.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/keuangan/kategori/:id
 */
exports.deleteKategori = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category is used in ArusKas
    const isUsed = await ArusKas.findOne({ where: { kategori_id: id } });
    if (isUsed) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kategori tidak dapat dihapus karena sudah digunakan dalam transaksi arus kas.' 
      });
    }

    const kategori = await KategoriKas.findByPk(id);
    if (!kategori) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });

    await kategori.destroy();
    res.json({ success: true, message: 'Kategori berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
