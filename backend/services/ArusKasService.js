const { ArusKas, KategoriKas, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class ArusKasService {
  /**
   * Recalculates `saldo_akhir` for all transactions sequentially.
   * Useful when a transaction is inserted, updated, or deleted out of chronological order.
   * @param {Object} options - Sequelize options (like transaction)
   */
  async recalculateSaldo(options = {}) {
    const trx = await ArusKas.findAll({
      order: [['kas_id', 'ASC']],
      ...options
    });

    let currentSaldo = 0;
    for (let r of trx) {
      const nom = parseFloat(r.nominal);
      if (r.jenis === 'Kredit') {
        currentSaldo += nom;
      } else {
        currentSaldo -= nom;
      }
      
      if (parseFloat(r.saldo_akhir) !== currentSaldo) {
        await ArusKas.update(
          { saldo_akhir: currentSaldo },
          { where: { kas_id: r.kas_id }, ...options }
        );
      }
    }
  }

  /**
   * Record a new transaction in Arus Kas.
   * @param {Object} data - Transaction data
   * @param {number} data.user_id - (Optional) ID of the member involved
   * @param {string} data.nama_kategori - Name of the category (will be searched in KategoriKas)
   * @param {string} data.jenis - 'Debit' (Out) or 'Kredit' (In). If not provided, will use category default.
   * @param {number} data.nominal - Transaction amount
   * @param {string} data.keterangan - Description
   * @param {string} data.kode_transaksi - (Optional) Transaction code
   * @param {Object} options - Sequelize options (like transaction)
   * @param {Object} io - Socket.io instance to emit events
   */
  async recordTransaction(data, options = {}, io = null) {
    const { 
      user_id, 
      nama_kategori, 
      jenis: forceJenis, 
      nominal, 
      keterangan, 
      kode_transaksi 
    } = data;

    // 1. Find Category
    const kategori = await KategoriKas.findOne({ 
      where: { nama_kategori },
      ...options
    });

    if (!kategori) {
      throw new Error(`Kategori kas '${nama_kategori}' tidak ditemukan.`);
    }

    const finalJenis = forceJenis || kategori.jenis;
    const finalNominal = parseFloat(nominal);

    // 2. Calculate Saldo Akhir
    // We get the latest record by kas_id
    const latestRecord = await ArusKas.findOne({
      order: [['kas_id', 'DESC']],
      ...options
    });

    const prevSaldo = latestRecord ? parseFloat(latestRecord.saldo_akhir) : 0;
    
    // Formula: Saldo = Prev + Kredit (In) - Debit (Out)
    const newSaldo = finalJenis === 'Kredit' 
      ? prevSaldo + finalNominal 
      : prevSaldo - finalNominal;

    // 3. Create Arus Kas entry
    const newEntry = await ArusKas.create({
      user_id: user_id || null,
      kategori_id: kategori.kategori_id,
      tanggal: moment().format('YYYY-MM-DD'),
      kode_transaksi: kode_transaksi || `TRX-${moment().format('YYMMDDHHmmss')}`,
      jenis: finalJenis,
      keterangan,
      nominal: finalNominal,
      saldo_akhir: newSaldo
    }, options);

    // 4. Emit Real-Time Event (Only if not in a transaction)
    if (io && !options.transaction) {
      io.emit('arus-kas-updated', {
        message: 'Arus kas baru tercatat.',
        entry: newEntry
      });
      io.emit('dashboardUpdate');
    }

    return newEntry;
  }

  /**
   * Update an existing transaction and recalculate balances.
   */
  async updateTransaction(kas_id, data, options = {}, io = null) {
    const { 
      nama_kategori, 
      jenis: forceJenis, 
      nominal, 
      keterangan 
    } = data;

    const existingRecord = await ArusKas.findByPk(kas_id, options);
    if (!existingRecord) {
      throw new Error('Data kas tidak ditemukan.');
    }

    // 1. Find Category if provided
    let kategori_id = existingRecord.kategori_id;
    let finalJenis = existingRecord.jenis;
    
    if (nama_kategori) {
      const kategori = await KategoriKas.findOne({ 
        where: { nama_kategori },
        ...options
      });
      if (!kategori) throw new Error(`Kategori kas '${nama_kategori}' tidak ditemukan.`);
      kategori_id = kategori.kategori_id;
      finalJenis = forceJenis || kategori.jenis;
    } else if (forceJenis) {
      finalJenis = forceJenis;
    }

    const finalNominal = nominal !== undefined ? parseFloat(nominal) : parseFloat(existingRecord.nominal);

    // 2. Update the record
    await existingRecord.update({
      kategori_id,
      jenis: finalJenis,
      nominal: finalNominal,
      keterangan: keterangan || existingRecord.keterangan
    }, options);

    // 3. Recalculate all balances
    await this.recalculateSaldo(options);

    // 4. Emit Real-Time Event (Only if not in a transaction)
    if (io && !options.transaction) {
      io.emit('arus-kas-updated', {
        message: 'Arus kas berhasil diperbarui.',
        entry: existingRecord
      });
      io.emit('dashboardUpdate');
    }

    return existingRecord;
  }

  /**
   * Delete an existing transaction and recalculate balances.
   */
  async deleteTransaction(kas_id, options = {}, io = null) {
    const existingRecord = await ArusKas.findByPk(kas_id, options);
    if (!existingRecord) {
      throw new Error('Data kas tidak ditemukan.');
    }

    // 1. Delete the record
    await existingRecord.destroy(options);

    // 2. Recalculate all balances
    await this.recalculateSaldo(options);

    // 3. Emit Real-Time Event (Only if not in a transaction)
    if (io && !options.transaction) {
      io.emit('arus-kas-updated', {
        message: 'Arus kas berhasil dihapus.'
      });
      io.emit('dashboardUpdate');
    }

    return true;
  }
}

module.exports = new ArusKasService();
