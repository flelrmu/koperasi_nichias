const db = require('../models');
const { Simpanan, Pinjaman, Anggota, User, TransaksiSimpanan, Konfigurasi, Notifikasi, Pengurus } = db;
const { Op } = db.Sequelize;
const angkaKeTerbilang = require('../utils/terbilang');
const ArusKasService = require('../services/ArusKasService');

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
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { saldo_pokok, saldo_wajib, saldo_sukarela } = req.body;
    
    const simpanan = await Simpanan.findByPk(id, {
      include: [{ model: Anggota, as: 'anggota' }],
      transaction
    });
    
    if (!simpanan) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    const oldPokok = parseFloat(simpanan.saldo_pokok) || 0;
    const oldWajib = parseFloat(simpanan.saldo_wajib) || 0;
    const oldSukarela = parseFloat(simpanan.saldo_sukarela) || 0;
    
    const newPokok = parseFloat(saldo_pokok) || 0;
    const newWajib = parseFloat(saldo_wajib) || 0;
    const newSukarela = parseFloat(saldo_sukarela) || 0;

    const diffPokok = newPokok - oldPokok;
    const diffWajib = newWajib - oldWajib;
    const diffSukarela = newSukarela - oldSukarela;

    const userId = simpanan.anggota.user_id;

    // Helper function to record difference
    const recordDiff = async (diff, categoryName) => {
      if (diff !== 0) {
        await ArusKasService.recordTransaction({
          user_id: userId,
          nama_kategori: `Simpanan ${categoryName}`,
          jenis: diff > 0 ? 'Kredit' : 'Debit',
          nominal: Math.abs(diff),
          keterangan: `Penyesuaian Manual (Manajemen Saldo) - Simpanan ${categoryName}`,
          kode_transaksi: `ADJ-${categoryName.substring(0,3).toUpperCase()}-${simpanan.anggota_id}-${Date.now()}`
        }, { transaction }); // Removed req.io to prevent early emission
      }
    };

    // Record any differences to Arus Kas
    await recordDiff(diffPokok, 'Pokok');
    await recordDiff(diffWajib, 'Wajib');
    await recordDiff(diffSukarela, 'Sukarela');

    await simpanan.update({
      saldo_pokok: newPokok,
      saldo_wajib: newWajib,
      saldo_sukarela: newSukarela,
      last_updated: new Date()
    }, { transaction });

    await transaction.commit();

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
      req.io.emit('dashboardUpdate');
      req.io.emit('arus-kas-updated');
    }

    res.json({ success: true, data: updated, message: 'Simpanan berhasil diupdate dan disinkronkan dengan Arus Kas' });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== TRANSAKSI SIMPANAN (NEW) ====================

/**
 * POST /simpan-pinjam/simpanan/transaksi
 * Koordinator input simpanan baru (Pokok/Wajib/Sukarela)
 */
exports.createTransaksiSimpanan = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
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
    // Sukarela: check minimum deposit if configured
    if (jenis_simpanan === 'Sukarela' && jenis_transaksi === 'Setor') {
      const minSukarela = parseFloat(configMap['SIMPANAN_SUKARELA'] || 0);
      if (finalNominal < minSukarela) {
        await transaction.rollback();
        return res.status(400).json({ 
          success: false, 
          message: `Nominal simpanan sukarela minimal adalah ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(minSukarela)}.` 
        });
      }
    }

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

    // --- INTEGRASI ARUS KAS ---
    await ArusKasService.recordTransaction({
      user_id: anggota.user_id,
      nama_kategori: `Simpanan ${jenis_simpanan}`,
      jenis: jenis_transaksi === 'Setor' ? 'Kredit' : 'Debit',
      nominal: finalNominal,
      keterangan: autoKeterangan,
      kode_transaksi: `TXS-${newTransaksi.transaksi_id}`
    }, { transaction }, req.io);

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
      req.io.emit('arus-kas-updated');
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
  const transaction = await db.sequelize.transaction();
  
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
      req.io.emit('arus-kas-updated');
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

      // --- INTEGRASI ARUS KAS ---
      await ArusKasService.recordTransaction({
        user_id: anggota.user_id,
        nama_kategori: 'Simpanan Wajib',
        jenis: 'Kredit',
        nominal: nominalWajib,
        keterangan: autoKeterangan,
        kode_transaksi: `BLK-WJB-${anggota.anggota_id}-${today}`
      }, { transaction }, req.io);

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
      req.io.emit('arus-kas-updated');
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
 * POST /simpan-pinjam/simpanan/tarik-semua/:anggotaId
 * Koordinator tarik semua simpanan anggota (set to 0)
 */
exports.tarikSemuaSimpanan = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { anggotaId } = req.params;
    const { keterangan } = req.body;

    const anggota = await Anggota.findByPk(anggotaId, {
      include: [{ model: User, as: 'user' }],
      transaction
    });
    if (!anggota) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Anggota tidak ditemukan' });
    }

    const simpanan = await Simpanan.findOne({ where: { anggota_id: anggotaId }, transaction });
    if (!simpanan) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Data simpanan tidak ditemukan' });
    }

    const totalTarik = parseFloat(simpanan.saldo_pokok || 0) + 
                       parseFloat(simpanan.saldo_wajib || 0) + 
                       parseFloat(simpanan.saldo_sukarela || 0);

    if (totalTarik <= 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Saldo anggota sudah 0 atau kosong.' });
    }

    // Update simpanan to 0
    await simpanan.update({
      saldo_pokok: 0,
      saldo_wajib: 0,
      saldo_sukarela: 0,
      last_updated: new Date()
    }, { transaction });

    // Create a transaction record for "Semua Simpanan"
    const bulanTahun = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const newTransaksi = await TransaksiSimpanan.create({
      anggota_id: anggotaId,
      jenis_simpanan: 'Semua',
      jenis_transaksi: 'Tarik',
      nominal: totalTarik,
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: keterangan || `Penarikan Seluruh Simpanan - ${bulanTahun}`
    }, { transaction });

    // --- INTEGRASI ARUS KAS ---
    await ArusKasService.recordTransaction({
      user_id: anggota.user_id,
      nama_kategori: 'Penarikan Simpanan',
      jenis: 'Debit',
      nominal: totalTarik,
      keterangan: keterangan || `Penarikan Seluruh Simpanan - ${bulanTahun}`,
      kode_transaksi: `WDR-${newTransaksi.transaksi_id}`
    }, { transaction }); // Removed req.io here to prevent early emission, will emit manually after commit

    // Create notification for member
    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const notifTitle = `Penarikan Seluruh Simpanan 📤`;
    const notifMessage = `Seluruh simpanan Anda sebesar ${formatRupiah(totalTarik)} telah ditarik oleh pengurus. Saldo simpanan Anda sekarang: Rp 0. Keterangan: "${keterangan || 'Penarikan Seluruh Simpanan'}"`;

    await Notifikasi.create({
      user_id: anggota.user_id,
      judul: notifTitle,
      pesan: notifMessage,
      tipe: 'simpanan',
      link: '/simpan-pinjam',
      is_read: false
    }, { transaction });

    await transaction.commit();

    // Fetch updated data for socket emission
    const updatedSimpanan = await Simpanan.findOne({
      where: { anggota_id: anggotaId },
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
      req.io.emit('transaksi:created', { 
        transaksi: newTransaksi,
        anggota_id: anggotaId,
        user_id: anggota.user_id
      });
      req.io.emit('notifikasi:simpanan', {
        user_id: anggota.user_id,
        notifikasi: { judul: notifTitle, pesan: notifMessage, tipe: 'simpanan' }
      });
      req.io.emit('dashboardUpdate');
      req.io.emit('arus-kas-updated');
    }

    res.json({ 
      success: true, 
      data: updatedSimpanan,
      message: 'Berhasil menarik seluruh simpanan anggota.' 
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Error tarik semua simpanan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * GET /simpan-pinjam/konfigurasi
 * Get savings-related configuration
 */
exports.getKonfigurasiSimpanan = async (req, res) => {
  try {
    const configs = await Konfigurasi.findAll();
    
    res.json({ success: true, data: configs });
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

exports.getPinjamanById = async (req, res) => {
  try {
    const { id } = req.params;
    const pinjaman = await Pinjaman.findByPk(id, {
      include: [
        {
          model: Anggota,
          as: 'anggota',
          include: [{ model: User, as: 'user', attributes: ['email'] }]
        },
        {
          model: User,
          as: 'koordinator',
          attributes: ['user_id', 'email'],
          include: [{ model: Pengurus, as: 'pengurus', attributes: ['nama_lengkap'] }]
        }
      ]
    });
    
    if (!pinjaman) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    
    res.json({ success: true, data: pinjaman });
  } catch (error) {
    console.error('Error getPinjamanById:', error);
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
      tgl_acc_koordinator: new Date(),
      catatan_pengurus: req.body.catatan_pengurus
    };
    
    if (pinjaman_disetujui !== undefined) updateData.pinjaman_disetujui = pinjaman_disetujui;
    if (tenor !== undefined) updateData.tenor = tenor;

    if (status === 'Approved') {
        // Fetch all configs for validation
        const configs = await Konfigurasi.findAll();
        const configMap = {};
        configs.forEach(c => { configMap[c.nama_config] = c.nilai; });

        const approvedAmount = parseFloat(pinjaman_disetujui || pinjaman.jumlah_pinjaman);
        const approvedTenor = parseInt(tenor || pinjaman.tenor);
        
        // 1. Get Bunga from Config (divide by 100 if stored as percentage, e.g. 10 -> 0.1)
        let bungaPersen = 0;
        if (approvedTenor === 10) bungaPersen = parseFloat(configMap['BUNGA_10_BULAN'] || 10) / 100;
        else if (approvedTenor === 15) bungaPersen = parseFloat(configMap['BUNGA_15_BULAN'] || 15) / 100;
        else if (approvedTenor === 20) bungaPersen = parseFloat(configMap['BUNGA_20_BULAN'] || 20) / 100;

        const totalBunga = approvedAmount * bungaPersen;
        const totalAngsuran = approvedAmount + totalBunga;
        const angsuranPerBulan = totalAngsuran / approvedTenor;

        // 2. Validate Limit based on Jabatan
        const anggota = await Anggota.findByPk(pinjaman.anggota_id);
        const jabatan = anggota?.jabatan || 'Staff';
        
        const limitMap = {
          'Staff': parseFloat(configMap['LIMIT_ANGSURAN_STAFF'] || 2000000),
          'Assistant_Manager': parseFloat(configMap['LIMIT_ANGSURAN_ASST_MGR'] || 3000000),
          'Manager': parseFloat(configMap['LIMIT_ANGSURAN_MGR'] || 5000000)
        };
        
        const baseLimit = limitMap[jabatan] || 2000000;
        
        // Calculate current total installments for this member (from other approved loans)
        const otherApprovedLoans = await Pinjaman.findAll({
          where: {
            anggota_id: pinjaman.anggota_id,
            status: 'Approved',
            pinjaman_id: { [Op.ne]: id }
          }
        });
        
        const currentTotalAngsuran = otherApprovedLoans.reduce((acc, curr) => acc + parseFloat(curr.angsuran_per_bulan || 0), 0);
        const remainingLimit = baseLimit - currentTotalAngsuran;

        if (angsuranPerBulan > remainingLimit) {
          return res.status(400).json({ 
            success: false, 
            message: `Angsuran (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angsuranPerBulan)}/bln) melebihi sisa limit jabatan ${jabatan.replace('_', ' ')} (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(remainingLimit)}/bln).` 
          });
        }

        updateData.pinjaman_disetujui = approvedAmount;
        updateData.total_bunga = totalBunga;
        updateData.total_angsuran = totalBunga + approvedAmount;
        updateData.angsuran_per_bulan = angsuranPerBulan;
        updateData.sisa_tagihan = totalAngsuran;
        updateData.terbilang = angkaKeTerbilang(totalAngsuran);

        // Generate invoice number if not already present
        if (!pinjaman.nomor_invoice) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          updateData.nomor_invoice = `INV/PNJ/${year}/${month}/${id}/${random}`;
        }

        // --- INTEGRASI ARUS KAS (Pencairan Pinjaman) ---
        // Only record if status changed to Approved (Disbursed)
        if (pinjaman.status !== 'Approved') {
          await ArusKasService.recordTransaction({
            user_id: anggota.user_id,
            nama_kategori: 'Pencairan Pinjaman',
            jenis: 'Debit',
            nominal: updateData.pinjaman_disetujui,
            keterangan: `Pencairan Pinjaman ${pinjaman.jenis_pinjaman} - ${updateData.nomor_invoice}`,
            kode_transaksi: updateData.nomor_invoice
          }); // Removed req.io to prevent early/double emission
        }
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

    // Create notification for Member
    const statusMap = {
      'Approved': 'DISETUJUI',
      'Rejected': 'DITOLAK',
      'Lunas': 'LUNAS'
    };
    const targetStatusText = statusMap[status] || status;
    
    const notifMember = await Notifikasi.create({
      user_id: updated.anggota.user_id,
      judul: 'Pembaruan Status Pinjaman',
      pesan: `Pengajuan pinjaman Anda sebesar Rp ${new Intl.NumberFormat('id-ID').format(updated.jumlah_pinjaman)} telah ${targetStatusText}.${(status === 'Rejected' || status === 'Approved') ? ' Keterangan: ' + (updateData.catatan_pengurus || '-') : ''}`,
      jenis: 'Pinjaman',
      link: `/simpan-pinjam?detail_loan=${updated.pinjaman_id}`,
      is_read: false
    });

    if (req.io) {
      req.io.emit('pinjaman:updated', updated);
      req.io.emit('notifikasi:pinjaman', { user_id: updated.anggota.user_id, notifikasi: notifMember });
      req.io.emit('dashboardUpdate');
      req.io.emit('arus-kas-updated');
    }

    res.json({ success: true, data: updated, message: 'Status pinjaman berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPinjaman = async (req, res) => {
  try {
    const { jenis_pinjaman, jumlah_pinjaman, keperluan, tenor, terbilang } = req.body;
    const { user_id } = req.user;

    const anggota = await Anggota.findOne({ where: { user_id } });
    if (!anggota) return res.status(404).json({ success: false, message: 'Anggota tidak ditemukan' });

    // 1. Fetch Config for validation
    const configs = await Konfigurasi.findAll();
    const configMap = {};
    configs.forEach(c => { configMap[c.nama_config] = c.nilai; });

    const loanAmount = parseFloat(jumlah_pinjaman);

    // 2. Validate Cash Loan Limit & Tenor
    if (jenis_pinjaman === 'Uang') {
      const maxPinjamanUang = parseFloat(configMap['MAX_PINJAMAN_UANG'] || 15000000);
      if (loanAmount > maxPinjamanUang) {
        return res.status(400).json({ 
          success: false, 
          message: `Maksimal pinjaman uang adalah Rp ${new Intl.NumberFormat('id-ID').format(maxPinjamanUang)}` 
        });
      }
      if (parseInt(tenor) !== 10) {
        return res.status(400).json({ success: false, message: 'Pinjaman uang hanya bisa dicicil selama 10 bulan.' });
      }
    }

    // 3. Validate Goods Tenor
    if (jenis_pinjaman === 'Barang') {
      const allowedTenors = [10, 15, 20];
      if (!allowedTenors.includes(parseInt(tenor))) {
        return res.status(400).json({ success: false, message: 'Tenor kredit barang hanya diperbolehkan 10, 15, atau 20 bulan.' });
      }
    }

    const autoTerbilang = angkaKeTerbilang(jumlah_pinjaman);

    const newPinjaman = await Pinjaman.create({
      anggota_id: anggota.anggota_id,
      jenis_pinjaman,
      jumlah_pinjaman,
      terbilang: autoTerbilang,
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

    // Create notification for Koordinator
    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const koordinatorUsers = await User.findAll({ where: { role: 'Koordinator_Simpan_Pinjam' } });
    
    for (const koor of koordinatorUsers) {
      const notifKoor = await Notifikasi.create({
        user_id: koor.user_id,
        judul: 'Pengajuan Pinjaman Baru 📝',
        pesan: `${anggota.nama_lengkap} mengajukan pinjaman ${jenis_pinjaman.toLowerCase()} sebesar ${formatRupiah(jumlah_pinjaman)}.`,
        tipe: 'pinjaman',
        link: '/admin/simpan-pinjam?review_loan=' + newPinjaman.pinjaman_id,
        is_read: false
      });
      
      if (req.io) {
        req.io.emit('notifikasi:pinjaman', { 
          user_id: koor.user_id,
          notifikasi: notifKoor
        });
      }
    }

    if (req.io) {
      req.io.emit('pinjaman:created', populated);
      req.io.emit('dashboardUpdate');
      req.io.emit('arus-kas-updated');
    }

    res.status(201).json({ success: true, data: populated, message: 'Pengajuan pinjaman berhasil dikirim' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePinjaman = async (req, res) => {
  try {
    const { id } = req.params;
    const pinjaman = await Pinjaman.findByPk(id);
    
    if (!pinjaman) {
      return res.status(404).json({ success: false, message: 'Data pinjaman tidak ditemukan' });
    }

    // Only allow deletion if status is Pending, or if requested by admin, maybe allow any status
    // For now we'll allow deleting any to keep it simple, but typically you might restrict it.
    await pinjaman.destroy();

    if (req.io) {
      // Just emit a general update so clients can refetch or remove from array
      req.io.emit('pinjaman:updated', { pinjaman_id: id, deleted: true });
    }

    res.status(200).json({ success: true, message: 'Pinjaman berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /simpan-pinjam/pinjaman/transaksi/bulk-angsuran
 * Koordinator proses angsuran kolektif untuk pinjaman berstatus Approved
 */
exports.bulkProcessAngsuran = async (req, res) => {
  const transaction = await require('../models').sequelize.transaction();
  
  try {
    const { selected_pinjaman_ids } = req.body;
    const { Anggota, User, Pinjaman, Angsuran, Notifikasi } = require('../models');

    // 1. Determine which loans to process
    let whereClause = { status: 'Approved' };
    if (selected_pinjaman_ids && Array.isArray(selected_pinjaman_ids) && selected_pinjaman_ids.length > 0) {
      whereClause.pinjaman_id = selected_pinjaman_ids;
    }

    const loanList = await Pinjaman.findAll({ 
      where: whereClause,
      include: [{ 
        model: Anggota, 
        as: 'anggota',
        include: [{ model: User, as: 'user' }]
      }],
      transaction 
    });

    if (loanList.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Tidak ada pinjaman disetujui yang ditemukan untuk diproses.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const notificationsToEmit = [];

    // 2. Process each loan
    for (const loan of loanList) {
      const installmentAmount = parseFloat(loan.angsuran_per_bulan);
      const currentSisa = parseFloat(loan.sisa_tagihan);
      
      if (currentSisa <= 0) continue;

      const finalInstallment = Math.min(installmentAmount, currentSisa);
      const newSisa = currentSisa - finalInstallment;
      
      // Get current installment count
      const existingCount = await Angsuran.count({ where: { pinjaman_id: loan.pinjaman_id }, transaction });
      
      // Create Angsuran record
      await Angsuran.create({
        pinjaman_id: loan.pinjaman_id,
        angsuran_ke: existingCount + 1,
        jumlah_bayar: finalInstallment,
        tanggal_bayar: today,
        status_bayar: 'Lunas'
      }, { transaction });

      // Update Pinjaman
      const updatedStatus = newSisa <= 0 ? 'Lunas' : 'Approved';
      await loan.update({
        sisa_tagihan: newSisa,
        status: updatedStatus
      }, { transaction });

      // Create notification
      const judulNotif = 'Angsuran Pinjaman Berhasil ✅';
      const pesanNotif = `Angsuran ke-${existingCount + 1} sebesar ${formatRupiah(finalInstallment)} telah diproses secara kolektif. Sisa tagihan Anda: ${formatRupiah(newSisa)}.`;
      
      await Notifikasi.create({
        user_id: loan.anggota.user_id,
        judul: judulNotif,
        pesan: pesanNotif,
        tipe: 'pinjaman',
        link: '/simpan-pinjam',
        is_read: false,
      }, { transaction });

      // --- INTEGRASI ARUS KAS ---
      await ArusKasService.recordTransaction({
        user_id: loan.anggota.user_id,
        nama_kategori: 'Pembayaran Angsuran',
        jenis: 'Kredit',
        nominal: finalInstallment,
        keterangan: pesanNotif,
        kode_transaksi: `ANG-${loan.pinjaman_id}-${existingCount + 1}`
      }, { transaction }, req.io);

      notificationsToEmit.push({
        user_id: loan.anggota.user_id,
        judul: judulNotif,
        pesan: pesanNotif
      });
    }

    await transaction.commit();

    // 3. Emit socket updates
    if (req.io) {
      req.io.emit('dashboardUpdate');
      req.io.emit('arus-kas-updated');
      req.io.emit('pinjaman:bulkUpdated');
      
      notificationsToEmit.forEach(n => {
        req.io.emit('notifikasi:pinjaman', {
          user_id: n.user_id,
          notifikasi: { judul: n.judul, pesan: n.pesan, tipe: 'pinjaman' }
        });
      });
    }

    res.status(200).json({ 
      success: true, 
      message: `${loanList.length} angsuran pinjaman berhasil diproses secara kolektif.`,
      count: loanList.length
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Error bulk process angsuran:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /simpan-pinjam/pinjaman/:id/lunaskan
 * Koordinator melunasi pinjaman anggota secara langsung (pelunasan penuh)
 */
exports.lunaskanPinjaman = async (req, res) => {
  const transaction = await require('../models').sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { Angsuran } = require('../models');

    const pinjaman = await Pinjaman.findByPk(id, {
      include: [{
        model: Anggota,
        as: 'anggota',
        include: [{ model: User, as: 'user', attributes: ['email', 'user_id'] }]
      }],
      transaction
    });

    if (!pinjaman) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Data pinjaman tidak ditemukan.' });
    }

    if (pinjaman.status !== 'Approved') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Hanya pinjaman berstatus Approved yang dapat dilunasi.' });
    }

    const sisaTagihan = parseFloat(pinjaman.sisa_tagihan);
    if (sisaTagihan <= 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Pinjaman ini sudah tidak memiliki sisa tagihan.' });
    }

    // Get current installment count
    const existingCount = await Angsuran.count({ where: { pinjaman_id: pinjaman.pinjaman_id }, transaction });

    // Create final installment record covering all remaining balance
    await Angsuran.create({
      pinjaman_id: pinjaman.pinjaman_id,
      angsuran_ke: existingCount + 1,
      jumlah_bayar: sisaTagihan,
      tanggal_bayar: new Date().toISOString().split('T')[0],
      status_bayar: 'Lunas'
    }, { transaction });

    // Update loan status to Lunas
    await pinjaman.update({
      sisa_tagihan: 0,
      status: 'Lunas'
    }, { transaction });

    // Create notification for member
    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    
    const notifMember = await Notifikasi.create({
      user_id: pinjaman.anggota.user_id,
      judul: 'Pinjaman Telah Lunas 🎉',
      pesan: `Pinjaman Anda sebesar ${formatRupiah(pinjaman.pinjaman_disetujui || pinjaman.jumlah_pinjaman)} telah dinyatakan LUNAS. Sisa tagihan ${formatRupiah(sisaTagihan)} telah dilunasi.`,
      tipe: 'pinjaman',
      link: `/simpan-pinjam?detail_loan=${pinjaman.pinjaman_id}`,
      is_read: false
    }, { transaction });

    // --- INTEGRASI ARUS KAS ---
    await ArusKasService.recordTransaction({
      user_id: pinjaman.anggota.user_id,
      nama_kategori: 'Pembayaran Angsuran',
      jenis: 'Kredit',
      nominal: sisaTagihan,
      keterangan: `Pelunasan Pinjaman - ${pinjaman.nomor_invoice}`,
      kode_transaksi: `LNS-${pinjaman.pinjaman_id}`
    }, { transaction }, req.io);

    await transaction.commit();

    // Re-fetch with full associations for socket emit
    const updated = await Pinjaman.findByPk(id, {
      include: [{
        model: Anggota,
        as: 'anggota',
        include: [{ model: User, as: 'user', attributes: ['email'] }]
      }]
    });

    // Emit socket events
    if (req.io) {
      req.io.emit('pinjaman:updated', updated);
      req.io.emit('notifikasi:pinjaman', {
        user_id: pinjaman.anggota.user_id,
        notifikasi: notifMember
      });
      req.io.emit('dashboardUpdate');
      req.io.emit('arus-kas-updated');
    }

    res.status(200).json({
      success: true,
      data: updated,
      message: `Pinjaman ${pinjaman.anggota.nama_lengkap} berhasil dilunasi.`
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Error lunaskan pinjaman:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
