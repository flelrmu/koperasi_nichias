const { Simpanan, Pinjaman, Anggota, User } = require('../models');

// Simpanan
exports.getAllSimpanan = async (req, res) => {
  try {
    const simpananData = await Simpanan.findAll({
      include: [
        {
          model: Anggota,
          as: 'anggota',
          include: [{ model: User, as: 'user', attributes: ['email'] }]
        }
      ],
      order: [['last_updated', 'DESC']]
    });
    res.json({ success: true, data: simpananData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSimpanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { saldo_pokok, saldo_wajib, saldo_sukarela } = req.body;
    
    // We update by anggota_id since simpanan doesn't have an endpoint on frontend by simpanan_id, wait, the frontend has `item.id` mapped to simpanan_id? Wait, in mock data it's `id`. In DB it's `simpanan_id`.
    // Let's use simpanan_id.
    const simpanan = await Simpanan.findByPk(id);
    if (!simpanan) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    await simpanan.update({
      saldo_pokok,
      saldo_wajib,
      saldo_sukarela,
      last_updated: new Date()
    });

    const updated = await Simpanan.findByPk(id, {
      include: [
        {
          model: Anggota,
          as: 'anggota',
          include: [{ model: User, as: 'user', attributes: ['email'] }]
        }
      ]
    });

    if (req.io) {
      req.io.emit('simpanan:updated', updated);
    }

    res.json({ success: true, data: updated, message: 'Simpanan berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Pinjaman
exports.getAllPinjaman = async (req, res) => {
  try {
    const pinjamanData = await Pinjaman.findAll({
      include: [
        {
          model: Anggota,
          as: 'anggota',
          include: [{ model: User, as: 'user', attributes: ['email'] }]
        }
      ],
      order: [['tanggal_pengajuan', 'DESC']]
    });
    res.json({ success: true, data: pinjamanData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePinjamanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pinjaman_disetujui, tenor } = req.body;
    
    const pinjaman = await Pinjaman.findByPk(id);
    if (!pinjaman) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    const updateData = {
      status,
      acc_koordinator_id: req.user.id,
      tgl_acc_koordinator: new Date()
    };
    
    if (pinjaman_disetujui !== undefined) updateData.pinjaman_disetujui = pinjaman_disetujui;
    if (tenor !== undefined) updateData.tenor = tenor;

    if (status === 'Approved') {
        updateData.sisa_tagihan = pinjaman_disetujui || pinjaman.jumlah_pinjaman;
    }

    await pinjaman.update(updateData);

    const updated = await Pinjaman.findByPk(id, {
      include: [
        {
          model: Anggota,
          as: 'anggota',
          include: [{ model: User, as: 'user', attributes: ['email'] }]
        }
      ]
    });

    if (req.io) {
      req.io.emit('pinjaman:updated', updated);
    }

    res.json({ success: true, data: updated, message: 'Status pinjaman berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
