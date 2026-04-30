const db = require('../models');
const Peraturan = db.Peraturan;
const User = db.User;
const Konfigurasi = db.Konfigurasi;

/**
 * Helper to sync Peraturan with Konfigurasi table
 */
const syncWithKonfigurasi = async (peraturan, io = null, transaction = null) => {
  const mapping = {
    'Simpanan Pokok': 'SIMPANAN_POKOK',
    'Simpanan Wajib': 'SIMPANAN_WAJIB',
    'Simpanan Sukarela': 'SIMPANAN_SUKARELA',
    'Suku Bunga': 'BUNGA_PINJAMAN_PERSEN'
  };

  const configKey = mapping[peraturan.judul];
  if (configKey && peraturan.nilai_numerik !== null) {
    console.log(`🔄 Syncing Peraturan "${peraturan.judul}" to Konfigurasi "${configKey}" with value ${peraturan.nilai_numerik}`);
    await Konfigurasi.update(
      { nilai: peraturan.nilai_numerik.toString(), updated_by: peraturan.updated_by },
      { where: { nama_config: configKey }, transaction }
    );
    
    // Emit config update for real-time frontend refresh
    if (io) {
      io.emit('konfigurasi:updated', { 
        nama_config: configKey, 
        nilai: peraturan.nilai_numerik 
      });
    }
  }
};

/**
 * GET /api/peraturan
 * Mengambil semua peraturan koperasi.
 */
const getAllPeraturan = async (req, res) => {
  try {
    const peraturan = await Peraturan.findAll({
      include: [{ model: User, as: 'updater', attributes: ['email'] }],
      order: [['kategori', 'ASC'], ['peraturan_id', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: peraturan,
    });
  } catch (error) {
    console.error('❌ Error fetching peraturan:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar peraturan.',
      error: error.message,
    });
  }
};

/**
 * GET /api/peraturan/suku-bunga
 * Mengambil nilai suku bunga aktif dari peraturan "Suku Bunga".
 */
const getSukuBunga = async (req, res) => {
  try {
    const sukuBunga = await Peraturan.findOne({
      where: { judul: 'Suku Bunga' },
      attributes: ['peraturan_id', 'judul', 'ketentuan_utama', 'nilai_numerik', 'updated_at'],
    });

    if (!sukuBunga) {
      return res.status(404).json({
        success: false,
        message: 'Peraturan suku bunga tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      data: sukuBunga,
    });
  } catch (error) {
    console.error('❌ Error fetching suku bunga:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data suku bunga.',
      error: error.message,
    });
  }
};

/**
 * GET /api/peraturan/:id
 * Mengambil detail satu peraturan.
 */
const getPeraturanById = async (req, res) => {
  const { id } = req.params;
  try {
    const peraturan = await Peraturan.findByPk(id, {
      include: [{ model: User, as: 'updater', attributes: ['email'] }],
    });

    if (!peraturan) {
      return res.status(404).json({
        success: false,
        message: 'Peraturan tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      data: peraturan,
    });
  } catch (error) {
    console.error('❌ Error fetching peraturan detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail peraturan.',
      error: error.message,
    });
  }
};

/**
 * POST /api/peraturan
 * Membuat peraturan baru (hanya Sekretaris).
 */
const createPeraturan = async (req, res) => {
  const {
    judul,
    deskripsi,
    kategori,
    ketentuan_utama,
    nilai_numerik,
    tujuan,
    syarat_ketentuan,
    prosedur,
    icon_name,
    icon_color,
    icon_bg_color,
  } = req.body;

  try {
    const peraturan = await Peraturan.create({
      judul,
      deskripsi,
      kategori,
      ketentuan_utama,
      nilai_numerik: nilai_numerik || null,
      tujuan,
      syarat_ketentuan: syarat_ketentuan || [],
      prosedur: prosedur || [],
      icon_name: icon_name || 'FileText',
      icon_color: icon_color || 'text-blue-600',
      icon_bg_color: icon_bg_color || 'bg-blue-50',
      updated_by: req.user.user_id,
    });

    // Sync with Konfigurasi
    await syncWithKonfigurasi(peraturan, req.io);

    // Fetch with updater association
    const created = await Peraturan.findByPk(peraturan.peraturan_id, {
      include: [{ model: User, as: 'updater', attributes: ['email'] }],
    });

    // Emit WebSocket event
    req.io.emit('peraturan:created', { data: created });
    console.log(`📤 Emitting peraturan:created: ${judul}`);

    return res.status(201).json({
      success: true,
      message: 'Peraturan berhasil ditambahkan.',
      data: created,
    });
  } catch (error) {
    console.error('❌ Error creating peraturan:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan peraturan.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/peraturan/:id
 * Mengupdate peraturan (hanya Sekretaris).
 */
const updatePeraturan = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const peraturan = await Peraturan.findByPk(id);
    if (!peraturan) {
      return res.status(404).json({
        success: false,
        message: 'Peraturan tidak ditemukan.',
      });
    }

    // Set updated_by to current user
    updateData.updated_by = req.user.user_id;

    await peraturan.update(updateData);

    // Sync with Konfigurasi if nilai_numerik was updated
    await syncWithKonfigurasi(peraturan, req.io);

    // Fetch updated with updater
    const updated = await Peraturan.findByPk(id, {
      include: [{ model: User, as: 'updater', attributes: ['email'] }],
    });

    // Emit WebSocket event
    req.io.emit('peraturan:updated', { id: parseInt(id), data: updated });
    console.log(`📤 Emitting peraturan:updated: ${updated.judul}`);

    return res.status(200).json({
      success: true,
      message: 'Peraturan berhasil diperbarui.',
      data: updated,
    });
  } catch (error) {
    console.error('❌ Error updating peraturan:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui peraturan.',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/peraturan/:id
 * Menghapus peraturan (hanya Sekretaris).
 */
const deletePeraturan = async (req, res) => {
  const { id } = req.params;

  try {
    const peraturan = await Peraturan.findByPk(id);
    if (!peraturan) {
      return res.status(404).json({
        success: false,
        message: 'Peraturan tidak ditemukan.',
      });
    }

    const judul = peraturan.judul;
    await peraturan.destroy();

    // Emit WebSocket event
    req.io.emit('peraturan:deleted', { id: parseInt(id) });
    console.log(`📤 Emitting peraturan:deleted: ${judul}`);

    return res.status(200).json({
      success: true,
      message: `Peraturan "${judul}" berhasil dihapus.`,
    });
  } catch (error) {
    console.error('❌ Error deleting peraturan:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus peraturan.',
      error: error.message,
    });
  }
};

module.exports = {
  getAllPeraturan,
  getSukuBunga,
  getPeraturanById,
  createPeraturan,
  updatePeraturan,
  deletePeraturan,
};
