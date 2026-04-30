const { Simpanan, Pinjaman, Anggota, User, TransaksiSimpanan, Konfigurasi, Notifikasi } = require('../models');

// ==================== SIMPANAN ====================

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
      order: [[{ model: Anggota, as: 'anggota' }, 'no_anggota', 'ASC']]
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

// ==================== TRANSAKSI SIMPANAN (NEW) ====================

/**
 * POST /simpan-pinjam/simpanan/transaksi
 * Koordinator input simpanan baru (Pokok/Wajib/Sukarela)
 */
exports.createTransaksiSimpanan = async (req, res) => {
  const transaction = await require('../models').sequelize.transaction();
  
  try {
    const { anggota_id, jenis_simpanan, jenis_transaksi, nominal, keterangan } = req.body;

    // Validate anggota exists
    const anggota = await Anggota.findByPk(anggota_id, {
      include: [{ model: User, as: 'user' }],
      transaction
    });
    if (!anggota) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Anggota tidak ditemukan' });
    }

    // Get config for nominal validation
    const configMap = {};
    const configs = await Konfigurasi.findAll({ transaction });
    configs.forEach(c => { configMap[c.nama_config] = c.nilai; });

    let finalNominal = parseFloat(nominal);

    // Enforce config-driven nominal for Pokok and Wajib
    if (jenis_simpanan === 'Pokok' && jenis_transaksi === 'Setor') {
      finalNominal = parseFloat(configMap['SIMPANAN_POKOK'] || nominal);
    } else if (jenis_simpanan === 'Wajib' && jenis_transaksi === 'Setor') {
      finalNominal = parseFloat(configMap['SIMPANAN_WAJIB'] || nominal);
    }
    // Sukarela: if config = 0, free input; otherwise use config value
    // (We don't enforce sukarela here, user can input any amount)

    // Find or create simpanan record
    let simpanan = await Simpanan.findOne({ where: { anggota_id }, transaction });
    if (!simpanan) {
      simpanan = await Simpanan.create({
        anggota_id,
        saldo_pokok: 0,
        saldo_wajib: 0,
        saldo_sukarela: 0,
        last_updated: new Date()
      }, { transaction });
    }

    // Create transaksi record
    const bulanTahun = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    
    // VALIDATION: Only Sukarela can be withdrawn
    if (jenis_transaksi === 'Tarik' && jenis_simpanan !== 'Sukarela') {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: `Penarikan hanya diperbolehkan untuk Simpanan Sukarela. Simpanan ${jenis_simpanan} tidak dapat ditarik.` 
      });
    }

    const autoKeterangan = keterangan || `Simpanan ${jenis_simpanan} ${jenis_transaksi === 'Setor' ? 'Bulanan' : 'Penarikan'} - ${bulanTahun}`;

    const newTransaksi = await TransaksiSimpanan.create({
      anggota_id,
      jenis_simpanan,
      jenis_transaksi,
      nominal: finalNominal,
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: autoKeterangan
    }, { transaction });

    // Update saldo simpanan
    const saldoField = jenis_simpanan === 'Pokok' ? 'saldo_pokok' 
                     : jenis_simpanan === 'Wajib' ? 'saldo_wajib' 
                     : 'saldo_sukarela';
    
    const currentSaldo = parseFloat(simpanan[saldoField] || 0);
    const newSaldo = jenis_transaksi === 'Setor' 
      ? currentSaldo + finalNominal 
      : currentSaldo - finalNominal;

    if (newSaldo < 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Saldo tidak mencukupi untuk penarikan.' });
    }

    await simpanan.update({ 
      [saldoField]: newSaldo, 
      last_updated: new Date() 
    }, { transaction });

    // Create notification for the member
    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    
    const notifTitle = jenis_transaksi === 'Setor' 
      ? `Simpanan ${jenis_simpanan} Tercatat ✅`
      : `Penarikan Simpanan ${jenis_simpanan} 📤`;
    
    const notifMessage = jenis_transaksi === 'Setor'
      ? `Simpanan ${jenis_simpanan} sebesar ${formatRupiah(finalNominal)} telah dicatat. Saldo ${jenis_simpanan.toLowerCase()} Anda sekarang: ${formatRupiah(newSaldo)}. Keterangan: "${autoKeterangan}"`
      : `Penarikan simpanan ${jenis_simpanan.toLowerCase()} sebesar ${formatRupiah(finalNominal)} telah diproses. Saldo tersisa: ${formatRupiah(newSaldo)}. Keterangan: "${autoKeterangan}"`;

    await Notifikasi.create({
      user_id: anggota.user_id,
      judul: notifTitle,
      pesan: notifMessage,
      tipe: 'simpanan',
      link: '/simpan-pinjam',
      is_read: false
    }, { transaction });

    await transaction.commit();

    // Fetch updated simpanan for socket emission
    const updatedSimpanan = await Simpanan.findOne({
      where: { anggota_id },
      include: [
        {
          model: Anggota,
          as: 'anggota',
          include: [{ model: User, as: 'user', attributes: ['email'] }]
        }
      ]
    });

    // Emit socket events
    if (req.io) {
      req.io.emit('simpanan:updated', updatedSimpanan);
      req.io.emit('transaksi:created', { 
        transaksi: newTransaksi,
        anggota_id,
        user_id: anggota.user_id
      });
      req.io.emit('notifikasi:simpanan', {
        user_id: anggota.user_id,
        notifikasi: { judul: notifTitle, pesan: notifMessage, tipe: 'simpanan' }
      });
      req.io.emit('dashboardUpdate');
    }

    res.status(201).json({ 
      success: true, 
      data: { transaksi: newTransaksi, simpanan: updatedSimpanan },
      message: `${jenis_transaksi === 'Setor' ? 'Setoran' : 'Penarikan'} simpanan ${jenis_simpanan.toLowerCase()} berhasil dicatat.`
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error creating transaksi simpanan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /simpan-pinjam/simpanan/transaksi/:id
 * Koordinator edit transaksi simpanan yang sudah ada
 */
exports.updateTransaksiSimpanan = async (req, res) => {
  const transaction = await require('../models').sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { nominal, keterangan, jenis_simpanan, jenis_transaksi } = req.body;

    const transaksi = await TransaksiSimpanan.findByPk(id, { transaction });
    if (!transaksi) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }

    const oldNominal = parseFloat(transaksi.nominal);
    const oldJenisSimpanan = transaksi.jenis_simpanan;
    const oldJenisTransaksi = transaksi.jenis_transaksi;
    const newNominal = parseFloat(nominal);
    const newJenisSimpanan = jenis_simpanan || oldJenisSimpanan;
    const newJenisTransaksi = jenis_transaksi || oldJenisTransaksi;

    // Find the simpanan record
    const simpanan = await Simpanan.findOne({ 
      where: { anggota_id: transaksi.anggota_id }, 
      transaction 
    });
    if (!simpanan) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Data simpanan tidak ditemukan' });
    }

    // Reverse old transaction effect
    const oldSaldoField = oldJenisSimpanan === 'Pokok' ? 'saldo_pokok' 
                        : oldJenisSimpanan === 'Wajib' ? 'saldo_wajib' 
                        : 'saldo_sukarela';
    
    let oldSaldo = parseFloat(simpanan[oldSaldoField] || 0);
    if (oldJenisTransaksi === 'Setor') {
      oldSaldo -= oldNominal; // Reverse: subtract what was added
    } else {
      oldSaldo += oldNominal; // Reverse: add back what was taken
    }
    await simpanan.update({ [oldSaldoField]: Math.max(0, oldSaldo) }, { transaction });

    // Apply new transaction effect
    const newSaldoField = newJenisSimpanan === 'Pokok' ? 'saldo_pokok' 
                        : newJenisSimpanan === 'Wajib' ? 'saldo_wajib' 
                        : 'saldo_sukarela';
    
    // Re-read if the field changed
    let currentSaldo = newSaldoField === oldSaldoField 
      ? Math.max(0, oldSaldo)
      : parseFloat(simpanan[newSaldoField] || 0);
    
    if (newJenisTransaksi === 'Setor') {
      currentSaldo += newNominal;
    } else {
      currentSaldo -= newNominal;
    }

    if (currentSaldo < 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Saldo tidak mencukupi setelah perubahan.' });
    }

    await simpanan.update({ 
      [newSaldoField]: currentSaldo,
      last_updated: new Date() 
    }, { transaction });

    // Update the transaksi record
    await transaksi.update({
      nominal: newNominal,
      keterangan: keterangan || transaksi.keterangan,
      jenis_simpanan: newJenisSimpanan,
      jenis_transaksi: newJenisTransaksi
    }, { transaction });

    await transaction.commit();

    // Fetch updated data
    const updatedSimpanan = await Simpanan.findOne({
      where: { anggota_id: transaksi.anggota_id },
      include: [
        {
          model: Anggota,
          as: 'anggota',
          include: [{ model: User, as: 'user', attributes: ['email'] }]
        }
      ]
    });

    if (req.io) {
      req.io.emit('simpanan:updated', updatedSimpanan);
      req.io.emit('transaksi:updated', {
        transaksi: transaksi,
        anggota_id: transaksi.anggota_id
      });
      req.io.emit('dashboardUpdate');
    }

    res.json({ 
      success: true, 
      data: { transaksi, simpanan: updatedSimpanan },
      message: 'Transaksi simpanan berhasil diperbarui.' 
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error updating transaksi simpanan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /simpan-pinjam/simpanan/transaksi/bulk-wajib
 * Create mandatory savings for multiple or all members
 */
exports.bulkCreateSimpananWajib = async (req, res) => {
  const transaction = await require('../models').sequelize.transaction();
  
  try {
    const { selected_anggota_ids } = req.body; // Array of IDs, or null/empty for all
    
    // 1. Get mandatory savings nominal from config
    const configWajib = await Konfigurasi.findOne({ 
      where: { nama_config: 'SIMPANAN_WAJIB' },
      transaction 
    });
    const nominalWajib = configWajib ? parseFloat(configWajib.nilai) : 0;

    if (nominalWajib <= 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Nominal simpanan wajib belum dikonfigurasi.' });
    }

    // 2. Determine which members to process
    let whereClause = { status_keanggotaan: 'Aktif' };
    if (selected_anggota_ids && Array.isArray(selected_anggota_ids) && selected_anggota_ids.length > 0) {
      whereClause.anggota_id = selected_anggota_ids;
    }

    const anggotaList = await Anggota.findAll({ 
      where: whereClause,
      include: [{ model: User, as: 'user' }],
      transaction 
    });

    if (anggotaList.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Tidak ada anggota aktif yang ditemukan.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const bulanTahun = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const notificationsToEmit = [];

    // 3. Process each member
    for (const anggota of anggotaList) {
      // Find or create simpanan record
      let simpanan = await Simpanan.findOne({ where: { anggota_id: anggota.anggota_id }, transaction });
      if (!simpanan) {
        simpanan = await Simpanan.create({
          anggota_id: anggota.anggota_id,
          saldo_pokok: 0,
          saldo_wajib: 0,
          saldo_sukarela: 0,
          last_updated: new Date()
        }, { transaction });
      }

      // Update balance
      const newSaldoWajib = parseFloat(simpanan.saldo_wajib) + nominalWajib;
      await simpanan.update({
        saldo_wajib: newSaldoWajib,
        last_updated: new Date()
      }, { transaction });

      const autoKeterangan = `Simpanan Wajib Bulanan - ${bulanTahun}`;

      // Create transaction record
      await TransaksiSimpanan.create({
        anggota_id: anggota.anggota_id,
        jenis_simpanan: 'Wajib',
        jenis_transaksi: 'Setor',
        nominal: nominalWajib,
        tanggal: today,
        keterangan: autoKeterangan
      }, { transaction });

      // Create notification for member
      const judulNotif = 'Simpanan Wajib Diterima 💰';
      const pesanNotif = `Simpanan Wajib sebesar ${formatRupiah(nominalWajib)} telah dicatat. Saldo wajib Anda sekarang: ${formatRupiah(newSaldoWajib)}. Keterangan: "${autoKeterangan}"`;

      await Notifikasi.create({
        user_id: anggota.user_id,
        judul: judulNotif,
        pesan: pesanNotif,
        tipe: 'simpanan',
        link: '/simpan-pinjam',
        is_read: false,
      }, { transaction });

      notificationsToEmit.push({
        user_id: anggota.user_id,
        judul: judulNotif,
        pesan: pesanNotif
      });
    }

    await transaction.commit();

    // 4. Emit socket updates
    if (req.io) {
      req.io.emit('dashboardUpdate');
      req.io.emit('simpanan:bulkUpdated'); 
      
      notificationsToEmit.forEach(n => {
        req.io.emit('notifikasi:simpanan', {
          user_id: n.user_id,
          notifikasi: { judul: n.judul, pesan: n.pesan, tipe: 'simpanan' }
        });
      });
    }

    res.status(201).json({ 
      success: true, 
      message: `${anggotaList.length} setoran wajib berhasil diproses.`,
      count: anggotaList.length
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Error bulk create simpanan wajib:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * GET /simpan-pinjam/konfigurasi
 * Get savings-related configuration
 */
exports.getKonfigurasiSimpanan = async (req, res) => {
  try {
    const configs = await Konfigurasi.findAll({
      where: {
        nama_config: ['SIMPANAN_POKOK', 'SIMPANAN_WAJIB', 'SIMPANAN_SUKARELA']
      }
    });
    
    const configMap = {};
    configs.forEach(c => {
      configMap[c.nama_config] = parseFloat(c.nilai);
    });

    res.json({ success: true, data: configMap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /simpan-pinjam/transaksi/:anggotaId
 * Get transaction history for a specific member
 */
exports.getTransaksiByAnggota = async (req, res) => {
  try {
    const { anggotaId } = req.params;
    const transaksi = await TransaksiSimpanan.findAll({
      where: { anggota_id: anggotaId },
      order: [['tanggal', 'DESC'], ['transaksi_id', 'DESC']],
      include: [
        {
          model: Anggota,
          as: 'anggota',
          attributes: ['anggota_id', 'nama_lengkap', 'no_anggota']
        }
      ]
    });

    res.json({ success: true, data: transaksi });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== PINJAMAN ====================

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

exports.createPinjaman = async (req, res) => {
  try {
    const { jenis_pinjaman, nama_barang, jumlah_pinjaman, keperluan, tenor, terbilang } = req.body;
    const { user_id } = req.user;

    const anggota = await Anggota.findOne({ where: { user_id } });
    if (!anggota) return res.status(404).json({ success: false, message: 'Anggota tidak ditemukan' });

    const newPinjaman = await Pinjaman.create({
      anggota_id: anggota.anggota_id,
      jenis_pinjaman,
      nama_barang: jenis_pinjaman === 'Barang' ? nama_barang : null,
      jumlah_pinjaman,
      terbilang,
      keperluan,
      tenor,
      status: 'Pending',
      tanggal_pengajuan: new Date().toISOString().split('T')[0]
    });

    const populated = await Pinjaman.findByPk(newPinjaman.pinjaman_id, {
      include: [
        {
          model: Anggota,
          as: 'anggota',
          include: [{ model: User, as: 'user', attributes: ['email'] }]
        }
      ]
    });

    if (req.io) {
      req.io.emit('pinjaman:created', populated);
    }

    res.status(201).json({ success: true, data: populated, message: 'Pengajuan pinjaman berhasil dikirim' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
