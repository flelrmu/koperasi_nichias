const { ArusKas, KategoriKas, NeracaSaldo, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class ArusKasService {
  /**
   * Helper: Check if a date belongs to a closed month.
   */
  async isMonthClosed(date, options = {}) {
    const m = moment(date);
    const bulan = m.month() + 1;
    const tahun = m.year();
    
    const closing = await NeracaSaldo.findOne({
      where: { bulan, tahun, status_tutup_buku: true },
      ...options
    });
    return !!closing;
  }

  /**
   * Helper: Get current balance for a specific payment method (CASH/BANK).
   */
  async getSaldoPerMetode(metode, options = {}) {
    // 1. Ambil saldo awal dari kategori terkait (CASH/BANK)
    const kategori = await KategoriKas.findOne({
      where: { nama_kategori: metode },
      ...options
    });
    const saldoAwal = kategori ? parseFloat(kategori.saldo_awal || 0) : 0;

    // 2. Ambil mutasi dari transaksi ArusKas
    const transactions = await ArusKas.findAll({
      where: { metode_pembayaran: metode },
      attributes: ['jenis', 'nominal'],
      ...options
    });

    let totalMutation = 0;
    transactions.forEach(t => {
      if (t.jenis === 'Kredit') totalMutation += parseFloat(t.nominal);
      else totalMutation -= parseFloat(t.nominal);
    });

    return saldoAwal + totalMutation;
  }

  /**
   * Helper: Get current combined balance (CASH + BANK).
   */
  async getSaldoGabungan(options = {}) {
    const [saldoCash, saldoBank] = await Promise.all([
      this.getSaldoPerMetode("CASH", options),
      this.getSaldoPerMetode("BANK", options),
    ]);
    return (saldoCash || 0) + (saldoBank || 0);
  }

  /**
   * Recalculates `saldo_akhir` for all transactions sequentially.
   */
  async recalculateSaldo(options = {}) {
    // 1. Ambil saldo awal gabungan (CASH + BANK)
    const [catCash, catBank] = await Promise.all([
      KategoriKas.findOne({ where: { nama_kategori: 'CASH' }, ...options }),
      KategoriKas.findOne({ where: { nama_kategori: 'BANK' }, ...options })
    ]);
    
    const initialCash = catCash ? parseFloat(catCash.saldo_awal || 0) : 0;
    const initialBank = catBank ? parseFloat(catBank.saldo_awal || 0) : 0;
    
    let currentSaldo = initialCash + initialBank;

    const trx = await ArusKas.findAll({
      order: [['kas_id', 'ASC']],
      ...options
    });

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
   */
  async recordTransaction(data, options = {}, io = null) {
    const { 
      user_id, 
      nama_kategori, 
      jenis: forceJenis, 
      nominal, 
      keterangan, 
      kode_transaksi,
      tanggal,
      metode_pembayaran 
    } = data;

    const finalTanggal = tanggal || moment().format('YYYY-MM-DD');

    // PROTEKSI TUTUP BUKU
    if (await this.isMonthClosed(finalTanggal, options)) {
      throw new Error(`Transaksi ditolak: Periode laporan untuk bulan ${moment(finalTanggal).format('MMMM YYYY')} sudah ditutup buku.`);
    }

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
    const finalMetode = metode_pembayaran || 'CASH';

    // 2. VALIDASI SALDO (Hanya untuk Debit / Uang Keluar di Spreadsheet ini)
    if (finalJenis === 'Debit') {
      const currentSaldoMetode = await this.getSaldoPerMetode(finalMetode, options);
      if (currentSaldoMetode < finalNominal) {
        throw new Error(`Saldo ${finalMetode} tidak mencukupi. Saldo saat ini: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(currentSaldoMetode)}`);
      }
    }

    // 3. Calculate Saldo Akhir (Total Gabungan)
    // Gunakan saldo riil gabungan saat ini sebagai dasar (Master + Mutasi)
    // Ini memastikan penyesuaian saldo awal langsung berefek ke transaksi baru
    // tanpa harus melakukan recalculate pada transaksi lama.
    const prevSaldo = await this.getSaldoGabungan(options);

    const newSaldo =
      finalJenis === "Kredit"
        ? prevSaldo + finalNominal
        : prevSaldo - finalNominal;

    // 3. Create Arus Kas entry
    const newEntry = await ArusKas.create({
      user_id: user_id || null,
      kategori_id: kategori.kategori_id,
      tanggal: finalTanggal,
      kode_transaksi: kode_transaksi || `TRX-${moment().format('YYMMDDHHmmss')}`,
      jenis: finalJenis,
      keterangan,
      nominal: finalNominal,
      saldo_akhir: newSaldo,
      metode_pembayaran: metode_pembayaran || 'CASH'
    }, options);

    // 4. Emit Real-Time Event
    if (io && !options.transaction) {
      io.emit('arus-kas-updated');
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
      keterangan,
      tanggal,
      metode_pembayaran 
    } = data;

    const existingRecord = await ArusKas.findByPk(kas_id, options);
    if (!existingRecord) {
      throw new Error('Data kas tidak ditemukan.');
    }

    // PROTEKSI TUTUP BUKU (Cek tanggal lama dan tanggal baru)
    if (await this.isMonthClosed(existingRecord.tanggal, options)) {
      throw new Error(`Transaksi tidak bisa diubah: Periode ${moment(existingRecord.tanggal).format('MMMM YYYY')} sudah ditutup buku.`);
    }
    if (tanggal && await this.isMonthClosed(tanggal, options)) {
      throw new Error(`Transaksi tidak bisa dipindahkan: Periode ${moment(tanggal).format('MMMM YYYY')} sudah ditutup buku.`);
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
      tanggal: tanggal || existingRecord.tanggal,
      jenis: finalJenis,
      nominal: finalNominal,
      keterangan: keterangan || existingRecord.keterangan,
      metode_pembayaran: metode_pembayaran || existingRecord.metode_pembayaran
    }, options);

    // 3. Recalculate all balances
    await this.recalculateSaldo(options);

    // 4. Emit Real-Time Event
    if (io && !options.transaction) {
      io.emit('arus-kas-updated');
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

    // PROTEKSI TUTUP BUKU
    if (await this.isMonthClosed(existingRecord.tanggal, options)) {
      throw new Error(`Transaksi tidak bisa dihapus: Periode ${moment(existingRecord.tanggal).format('MMMM YYYY')} sudah ditutup buku.`);
    }

    // 1. Delete the record
    await existingRecord.destroy(options);

    // 2. Recalculate all balances
    await this.recalculateSaldo(options);

    // 3. Emit Real-Time Event
    if (io && !options.transaction) {
      io.emit('arus-kas-updated');
      io.emit('dashboardUpdate');
    }

    return true;
  }
}

module.exports = new ArusKasService();
