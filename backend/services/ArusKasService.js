const { ArusKas, KategoriKas, PeriodeKeuangan, SaldoBulanan, sequelize } = require('../models');
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
    
    const closing = await PeriodeKeuangan.findOne({
      where: { bulan, tahun, is_closed: true },
      ...options
    });
    return !!closing;
  }

  /**
   * Helper: Calculate the starting balance of a category for a target month & year.
   * Handles propagation of intermediate SaldoBulanan adjustments/closed books.
   */
  async getOpeningBalance(kategori, targetBulan, targetTahun, options = {}) {
    const targetBulanInt = parseInt(targetBulan);
    const targetTahunInt = parseInt(targetTahun);
    
    // 1. Cek apakah ada SaldoBulanan untuk bulan & tahun target secara langsung
    const directSaldo = await SaldoBulanan.findOne({
      where: {
        kategori_id: kategori.kategori_id,
        bulan: targetBulanInt,
        tahun: targetTahunInt
      },
      ...options
    });
    if (directSaldo) {
      return parseFloat(directSaldo.saldo_awal);
    }

    // 2. Cari SaldoBulanan terdekat sebelum bulan & tahun target
    const closestSaldo = await SaldoBulanan.findOne({
      where: {
        kategori_id: kategori.kategori_id,
        [Op.or]: [
          { tahun: { [Op.lt]: targetTahunInt } },
          {
            tahun: targetTahunInt,
            bulan: { [Op.lt]: targetBulanInt }
          }
        ]
      },
      order: [
        ['tahun', 'DESC'],
        ['bulan', 'DESC']
      ],
      ...options
    });

    const targetStartDate = moment(`${targetTahunInt}-${String(targetBulanInt).padStart(2, '0')}-01`, "YYYY-MM-DD").startOf("month").toDate();

    let anchorSaldo = parseFloat(kategori.saldo_awal || 0);
    let queryStartDate = null;

    if (closestSaldo) {
      anchorSaldo = parseFloat(closestSaldo.saldo_awal);
      queryStartDate = moment(`${closestSaldo.tahun}-${String(closestSaldo.bulan).padStart(2, '0')}-01`, "YYYY-MM-DD").startOf("month").toDate();
    }

    // 3. Hitung mutasi dari queryStartDate (atau awal waktu jika null) s/d targetStartDate (exclusive)
    const isCashOrBank = ["CASH", "BANK"].includes(kategori.nama_kategori);
    
    const whereClause = {};
    if (isCashOrBank) {
      whereClause.metode_pembayaran = kategori.nama_kategori;
    } else {
      whereClause.kategori_id = kategori.kategori_id;
    }

    if (queryStartDate) {
      whereClause.tanggal = {
        [Op.between]: [queryStartDate, moment(targetStartDate).subtract(1, 'milliseconds').toDate()]
      };
    } else {
      whereClause.tanggal = {
        [Op.lt]: targetStartDate
      };
    }

    const mutasi = await ArusKas.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN jenis = 'Debit' THEN nominal ELSE 0 END")), 'totalDebit'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN jenis = 'Kredit' THEN nominal ELSE 0 END")), 'totalKredit']
      ],
      raw: true,
      ...options
    });

    const totalDebit = parseFloat(mutasi[0]?.totalDebit || 0);
    const totalKredit = parseFloat(mutasi[0]?.totalKredit || 0);

    if (isCashOrBank) {
      // CASH/BANK: Awal + Debit - Kredit
      return anchorSaldo + totalDebit - totalKredit;
    } else if (kategori.tipe_neraca === "Asset") {
      // Non-Cash Asset: Awal + Kredit - Debit
      return anchorSaldo + totalKredit - totalDebit;
    } else {
      // Pasiva: Awal - Debit + Kredit
      return anchorSaldo - totalDebit + totalKredit;
    }
  }

  /**
   * Helper: Get current balance for a specific payment method (CASH/BANK).
   */
  async getSaldoPerMetode(metode, bulan = null, tahun = null, options = {}) {
    let opt = options;
    let b = bulan;
    let t = tahun;
    if (typeof bulan === 'object' && bulan !== null) {
      opt = bulan;
      b = null;
      t = null;
    }

    const kategori = await KategoriKas.findOne({
      where: { nama_kategori: metode },
      ...opt
    });
    if (!kategori) return 0;

    const targetBulan = b || (moment().month() + 1);
    const targetTahun = t || moment().year();

    // 1. Get opening balance of the target month
    const openingBalance = await this.getOpeningBalance(kategori, targetBulan, targetTahun, opt);

    // 2. Get mutations of the target month
    const strBulan = String(targetBulan).padStart(2, '0');
    const startDate = moment(`${targetTahun}-${strBulan}-01`, "YYYY-MM-DD").startOf("month").toDate();
    const endDate = moment(`${targetTahun}-${strBulan}-01`, "YYYY-MM-DD").endOf("month").toDate();

    const currMutasi = await ArusKas.findAll({
      where: {
        metode_pembayaran: metode,
        tanggal: { [Op.between]: [startDate, endDate] }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN jenis = 'Debit' THEN nominal ELSE 0 END")), 'totalDebit'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN jenis = 'Kredit' THEN nominal ELSE 0 END")), 'totalKredit']
      ],
      raw: true,
      ...opt
    });

    const totalDebit = parseFloat(currMutasi[0]?.totalDebit || 0);
    const totalKredit = parseFloat(currMutasi[0]?.totalKredit || 0);

    return openingBalance + totalDebit - totalKredit;
  }

  /**
   * Helper: Get current combined balance (CASH + BANK).
   */
  async getSaldoGabungan(bulan = null, tahun = null, options = {}) {
    let opt = options;
    let b = bulan;
    let t = tahun;
    if (typeof bulan === 'object' && bulan !== null) {
      opt = bulan;
      b = null;
      t = null;
    }
    const [saldoCash, saldoBank] = await Promise.all([
      this.getSaldoPerMetode("CASH", b, t, opt),
      this.getSaldoPerMetode("BANK", b, t, opt),
    ]);
    return (saldoCash || 0) + (saldoBank || 0);
  }

  /**
   * Recalculates `saldo_akhir` for all transactions sequentially, taking into account monthly starting balances.
   */
  async recalculateSaldo(options = {}) {
    const [catCash, catBank] = await Promise.all([
      KategoriKas.findOne({ where: { nama_kategori: 'CASH' }, ...options }),
      KategoriKas.findOne({ where: { nama_kategori: 'BANK' }, ...options })
    ]);

    if (!catCash || !catBank) {
      throw new Error("Kategori CASH atau BANK tidak ditemukan.");
    }

    const trx = await ArusKas.findAll({
      order: [
        ['tanggal', 'ASC'],
        ['kas_id', 'ASC']
      ],
      ...options
    });

    // Group transactions by month & year
    const monthlyGroups = {};
    for (const r of trx) {
      const m = moment(r.tanggal);
      const year = m.year();
      const month = m.month() + 1;
      const key = `${year}-${month}`;
      if (!monthlyGroups[key]) {
        monthlyGroups[key] = {
          year,
          month,
          items: []
        };
      }
      monthlyGroups[key].items.push(r);
    }

    // Process each group
    for (const key of Object.keys(monthlyGroups)) {
      const { year, month, items } = monthlyGroups[key];
      
      // Get opening balance for this month
      const [openingCash, openingBank] = await Promise.all([
        this.getOpeningBalance(catCash, month, year, options),
        this.getOpeningBalance(catBank, month, year, options)
      ]);

      let currentSaldo = openingCash + openingBank;

      for (const r of items) {
        const nom = parseFloat(r.nominal);
        if (r.jenis === 'Debit') {
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

    // 2. VALIDASI SALDO (Hanya untuk Kredit / Uang Keluar)
    if (finalJenis === 'Kredit') {
      const currentSaldoMetode = await this.getSaldoPerMetode(finalMetode, options);
      if (currentSaldoMetode < finalNominal) {
        throw new Error(`Saldo ${finalMetode} tidak mencukupi. Saldo saat ini: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(currentSaldoMetode)}`);
      }
    }

    // 3. Create Arus Kas entry
    const newEntry = await ArusKas.create({
      user_id: user_id || null,
      kategori_id: kategori.kategori_id,
      tanggal: finalTanggal,
      kode_transaksi: kode_transaksi || `TRX-${moment().format('YYMMDDHHmmss')}`,
      jenis: finalJenis,
      keterangan,
      nominal: finalNominal,
      saldo_akhir: 0, // placeholder, will be recalculated
      metode_pembayaran: metode_pembayaran || 'CASH'
    }, options);

    // Recalculate all balances
    await this.recalculateSaldo(options);

    // Reload the entry to ensure correct saldo_akhir is returned
    await newEntry.reload(options);

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

    // PROTEKSI TRANSAKSI OTOMATIS SISTEM
    if (existingRecord.kode_transaksi && !existingRecord.kode_transaksi.startsWith('TRX-')) {
      throw new Error('Transaksi otomatis sistem tidak boleh diubah langsung dari modul Keuangan.');
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

    // PROTEKSI TRANSAKSI OTOMATIS SISTEM
    if (existingRecord.kode_transaksi && !existingRecord.kode_transaksi.startsWith('TRX-')) {
      throw new Error('Transaksi otomatis sistem tidak boleh dihapus langsung dari modul Keuangan.');
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
