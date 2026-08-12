const db = require('../models');
const Peraturan = db.Peraturan;
const User = db.User;
const Konfigurasi = db.Konfigurasi;




const syncWithKonfigurasi = async (peraturan, io = null, transaction = null) => {
  const mapping = {
    'Simpanan Pokok': 'SIMPANAN_POKOK',
    'Simpanan Wajib': 'SIMPANAN_WAJIB',
    'Simpanan Sukarela': 'SIMPANAN_SUKARELA',
    'Suku Bunga': 'BUNGA_PINJAMAN_PERSEN',
    'Maksimal Pinjaman Uang': 'MAX_PINJAMAN_UANG',
    'Limit Angsuran Staff': 'LIMIT_ANGSURAN_STAFF',
    'Limit Angsuran Asst Manager': 'LIMIT_ANGSURAN_ASST_MGR',
    'Limit Angsuran Asisten Manager': 'LIMIT_ANGSURAN_ASST_MGR',
    'Limit Angsuran Manager': 'LIMIT_ANGSURAN_MGR',
    'Bunga 10 Bulan': 'BUNGA_10_BULAN',
    'Bunga 15 Bulan': 'BUNGA_15_BULAN',
    'Bunga 20 Bulan': 'BUNGA_20_BULAN',
    'Bank Koperasi': 'BANK_KOPERASI',
    'No Rekening Koperasi': 'NOREK_KOPERASI',
    'Atas Nama Koperasi': 'ATAS_NAMA_KOPERASI'
  };

  const configKey = mapping[peraturan.judul];
  if (configKey) {
    const isBankConfig = ['BANK_KOPERASI', 'NOREK_KOPERASI', 'ATAS_NAMA_KOPERASI'].includes(configKey);
    const valueToSync = isBankConfig 
      ? peraturan.ketentuan_utama 
      : (peraturan.nilai_numerik !== null ? peraturan.nilai_numerik.toString() : null);

    if (valueToSync !== null && valueToSync !== undefined) {
      console.log(`🔄 Syncing Peraturan "${peraturan.judul}" to Konfigurasi "${configKey}" with value ${valueToSync}`);
      await Konfigurasi.update(
        { nilai: valueToSync, updated_by: peraturan.updated_by },
        { where: { nama_config: configKey }, transaction }
      );
      
      
      if (io) {
        io.emit('konfigurasi:updated', { 
          nama_config: configKey, 
          nilai: valueToSync 
        });
      }
    }
  }
};





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

    
    await syncWithKonfigurasi(peraturan, req.io);

    
    const created = await Peraturan.findByPk(peraturan.peraturan_id, {
      include: [{ model: User, as: 'updater', attributes: ['email'] }],
    });

    
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

    
    updateData.updated_by = req.user.user_id;

    await peraturan.update(updateData);

    
    await syncWithKonfigurasi(peraturan, req.io);

    
    const updated = await Peraturan.findByPk(id, {
      include: [{ model: User, as: 'updater', attributes: ['email'] }],
    });

    
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

    
    const PROTECTED_TITLES = [
      'Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela',
      'Suku Bunga', 'Maksimal Pinjaman Uang', 'Pengunduran Diri',
      'Limit Angsuran Staff', 'Limit Angsuran Asisten Manager', 'Limit Angsuran Manager',
      'Bunga 10 Bulan', 'Bunga 15 Bulan', 'Bunga 20 Bulan'
    ];

    if (PROTECTED_TITLES.includes(peraturan.judul)) {
      return res.status(403).json({
        success: false,
        message: 'Peraturan sistem ini tidak dapat dihapus, hanya dapat diubah nilainya.',
      });
    }

    const judul = peraturan.judul;
    await peraturan.destroy();

    
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
  getPeraturanById,
  createPeraturan,
  updatePeraturan,
  deletePeraturan,
};
