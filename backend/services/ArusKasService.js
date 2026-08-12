const { ArusKas, KategoriKas, PeriodeKeuangan, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class ArusKasService {
  


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

  



  async getOpeningBalance(kategori, targetBulan, targetTahun, options = {}) {
    const targetBulanInt = parseInt(targetBulan);
    const targetTahunInt = parseInt(targetTahun);
    
    const targetStartDate = moment(`${targetTahunInt}-${String(targetBulanInt).padStart(2, '0')}-01`, "YYYY-MM-DD").startOf("month").toDate();

    const anchorSaldo = parseFloat(kategori.saldo_awal || 0);

    const isCashOrBank = ["CASH", "BANK"].includes(kategori.nama_kategori);
    
    const whereClause = {
      tanggal: {
        [Op.lt]: targetStartDate
      }
    };
    if (isCashOrBank) {
      whereClause.metode_pembayaran = kategori.nama_kategori;
    } else {
      whereClause.kategori_id = kategori.kategori_id;
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
      return anchorSaldo + totalDebit - totalKredit;
    } else if (kategori.tipe_neraca === "Asset") {
      return anchorSaldo + totalKredit - totalDebit;
    } else {
      return anchorSaldo - totalDebit + totalKredit;
    }
  }

  


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

    
    const openingBalance = await this.getOpeningBalance(kategori, targetBulan, targetTahun, opt);

    
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

    
    for (const key of Object.keys(monthlyGroups)) {
      const { year, month, items } = monthlyGroups[key];
      
      
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

    
    if (await this.isMonthClosed(finalTanggal, options)) {
      throw new Error(`Transaksi ditolak: Periode laporan untuk bulan ${moment(finalTanggal).format('MMMM YYYY')} sudah ditutup buku.`);
    }

    
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

    
    if (finalJenis === 'Kredit') {
      const currentSaldoMetode = await this.getSaldoPerMetode(finalMetode, options);
      if (currentSaldoMetode < finalNominal) {
        throw new Error(`Saldo ${finalMetode} tidak mencukupi. Saldo saat ini: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(currentSaldoMetode)}`);
      }
    }

    
    const newEntry = await ArusKas.create({
      user_id: user_id || null,
      kategori_id: kategori.kategori_id,
      tanggal: finalTanggal,
      kode_transaksi: kode_transaksi || `TRX-${moment().format('YYMMDDHHmmss')}`,
      jenis: finalJenis,
      keterangan,
      nominal: finalNominal,
      saldo_akhir: 0, 
      metode_pembayaran: metode_pembayaran || 'CASH'
    }, options);

    
    await this.recalculateSaldo(options);

    
    await newEntry.reload(options);

    
    if (io && !options.transaction) {
      io.emit('arus-kas-updated');
      io.emit('dashboardUpdate');
    }

    return newEntry;
  }

  


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

    
    if (existingRecord.kode_transaksi && !existingRecord.kode_transaksi.startsWith('TRX-')) {
      throw new Error('Transaksi otomatis sistem tidak boleh diubah langsung dari modul Keuangan.');
    }

    
    if (await this.isMonthClosed(existingRecord.tanggal, options)) {
      throw new Error(`Transaksi tidak bisa diubah: Periode ${moment(existingRecord.tanggal).format('MMMM YYYY')} sudah ditutup buku.`);
    }
    if (tanggal && await this.isMonthClosed(tanggal, options)) {
      throw new Error(`Transaksi tidak bisa dipindahkan: Periode ${moment(tanggal).format('MMMM YYYY')} sudah ditutup buku.`);
    }

    
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

    
    await existingRecord.update({
      kategori_id,
      tanggal: tanggal || existingRecord.tanggal,
      jenis: finalJenis,
      nominal: finalNominal,
      keterangan: keterangan || existingRecord.keterangan,
      metode_pembayaran: metode_pembayaran || existingRecord.metode_pembayaran
    }, options);

    
    await this.recalculateSaldo(options);

    
    if (io && !options.transaction) {
      io.emit('arus-kas-updated');
      io.emit('dashboardUpdate');
    }

    return existingRecord;
  }

  


  async deleteTransaction(kas_id, options = {}, io = null) {
    const existingRecord = await ArusKas.findByPk(kas_id, options);
    if (!existingRecord) {
      throw new Error('Data kas tidak ditemukan.');
    }

    
    if (existingRecord.kode_transaksi && !existingRecord.kode_transaksi.startsWith('TRX-')) {
      throw new Error('Transaksi otomatis sistem tidak boleh dihapus langsung dari modul Keuangan.');
    }

    
    if (await this.isMonthClosed(existingRecord.tanggal, options)) {
      throw new Error(`Transaksi tidak bisa dihapus: Periode ${moment(existingRecord.tanggal).format('MMMM YYYY')} sudah ditutup buku.`);
    }

    
    await existingRecord.destroy(options);

    
    await this.recalculateSaldo(options);

    
    if (io && !options.transaction) {
      io.emit('arus-kas-updated');
      io.emit('dashboardUpdate');
    }

    return true;
  }
}

module.exports = new ArusKasService();
