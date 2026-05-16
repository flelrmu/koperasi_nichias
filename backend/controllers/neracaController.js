const { ArusKas, KategoriKas, NeracaSaldo, User, Pengurus, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

/**
 * NERACA_MAP: Fixed display order for Neraca.
 * `categories` is an array of nama_kategori to combine for each row.
 * `isTotal` flags the TOTAL ASSET calculation row.
 * `isCalculated` flags the PROFIT/LOSS calculated row.
 */
const NERACA_MAP = [
  { categories: ['CASH'], label: 'CASH' },
  { categories: ['BANK'], label: 'BANK' },
  { 
    categories: ['PINJAMAN UANG', 'ANGSURAN PINJAMAN UANG', 'Pencairan Pinjaman', 'Pembayaran Angsuran'], 
    label: 'TAGIHAN PINJAMAN',
    isPiutang: true 
  },
  { 
    categories: ['CREDIT BARANG', 'ANGSURAN CREDIT BARANG'], 
    label: 'TAGIHAN CREDIT BARANG',
    isPiutang: true 
  },
  { 
    categories: ['TAGIHAN RENTAL'], 
    label: 'TAGIHAN RENTAL',
    isPiutang: true 
  },
  { categories: ['PERSEDIAAN BARANG'], label: 'PERSEDIAAN BARANG', isPiutang: true },
  { categories: ['ALAT KANTOR'], label: 'ALAT KANTOR', isPiutang: true },
  { categories: ['INVESTASI'], label: 'INVESTASI', isPiutang: true },
  { categories: ['INCOME TAX'], label: 'INCOME TAX', isPiutang: true },
  { isTotal: true, label: 'TOTAL ASSET', type: 'Asset' },
  { categories: ['DP - PENERIMAAN DIMUKA'], label: 'DP - PENERIMAAN DIMUKA', isPasiva: true },
  { categories: ['HUTANG USAHA'], label: 'HUTANG USAHA', isPasiva: true },
  { categories: ['HUTANG BIAYA'], label: 'HUTANG BIAYA', isPasiva: true },
  { categories: ['TAX LIABILITY'], label: 'TAX LIABILITY', isPasiva: true },
  { categories: ['LOAN'], label: 'LOAN', isPasiva: true },
  { isCalculated: true, label: 'PROFIT/LOSS', isPasiva: true },
  { categories: ['SIMPANAN ANGGOTA', 'Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela', 'Penarikan Simpanan'], label: 'SIMPANAN ANGGOTA', isPasiva: true },
  { categories: ['LABA DITAHAN'], label: 'LABA DITAHAN', isPasiva: true }
];

/**
 * Helper: Calculate neraca for a single month
 * Logic baru: Debit = Masuk, Kredit = Keluar
 */
async function calculateNeracaForMonth(bulan, tahun) {
  const startDate = moment(`${tahun}-${bulan}-01`, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
  const endDate = moment(`${tahun}-${bulan}-01`, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD');
  const startOfYear = moment(`${tahun}-01-01`, 'YYYY-MM-DD').format('YYYY-MM-DD');

  const kategoriList = await KategoriKas.findAll();
  
  const results = [];
  let assetAccumulator = { awal: 0, debit: 0, kredit: 0, akhir: 0 };

  for (const entry of NERACA_MAP) {
    if (entry.isTotal) {
      results.push({
        nama_kategori: entry.label,
        isTotalRow: true,
        tipe_neraca: entry.type,
        saldo_awal: assetAccumulator.awal,
        debit: assetAccumulator.debit,
        kredit: assetAccumulator.kredit,
        saldo_akhir: assetAccumulator.akhir
      });
      continue;
    }

    if (entry.isCalculated) {
      // 1. Hitung PROFIT/LOSS SEBELUM bulan ini (Saldo Awal)
      const prevPlTrx = await ArusKas.findAll({
        include: [{
          model: KategoriKas, as: 'kategoriKas',
          where: { tipe_neraca: { [Op.in]: ['Income', 'Expense'] } },
          attributes: ['tipe_neraca']
        }],
        where: { tanggal: { [Op.between]: [startOfYear, moment(startDate).subtract(1, 'day').format('YYYY-MM-DD')] } },
        attributes: [
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Debit' THEN `nominal` ELSE 0 END")), 'totalDebit'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Kredit' THEN `nominal` ELSE 0 END")), 'totalKredit']
        ],
        group: [sequelize.col('kategoriKas.tipe_neraca')],
        raw: true, nest: true
      });

      let prevIncome = 0;
      let prevExpense = 0;
      prevPlTrx.forEach(t => {
        const d = parseFloat(t.totalDebit || 0);
        const k = parseFloat(t.totalKredit || 0);
        const tipe = t.kategoriKas.tipe_neraca;
        if (tipe === 'Income') prevIncome += (k - d);
        else if (tipe === 'Expense') prevExpense += (d - k);
      });
      const profitAwal = prevIncome - prevExpense;

      // 2. Hitung PROFIT/LOSS BULAN INI SAJA (Mutasi)
      const currPlTrx = await ArusKas.findAll({
        include: [{
          model: KategoriKas, as: 'kategoriKas',
          where: { tipe_neraca: { [Op.in]: ['Income', 'Expense'] } },
          attributes: ['tipe_neraca']
        }],
        where: { tanggal: { [Op.between]: [startDate, endDate] } },
        attributes: [
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Debit' THEN `nominal` ELSE 0 END")), 'totalDebit'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Kredit' THEN `nominal` ELSE 0 END")), 'totalKredit']
        ],
        group: [sequelize.col('kategoriKas.tipe_neraca')],
        raw: true, nest: true
      });

      let currIncome = 0;
      let currExpense = 0;
      currPlTrx.forEach(t => {
        const d = parseFloat(t.totalDebit || 0);
        const k = parseFloat(t.totalKredit || 0);
        const tipe = t.kategoriKas.tipe_neraca;
        if (tipe === 'Income') currIncome += (k - d);
        else if (tipe === 'Expense') currExpense += (d - k);
      });
      const profitBulanIni = currIncome - currExpense;

      const totalProfitKumulatif = profitAwal + profitBulanIni;

      results.push({
        nama_kategori: entry.label,
        isCalculated: true,
        isPasiva: true,
        tipe_neraca: 'Equity',
        saldo_awal: profitAwal * -1, // Saldo awal akumulasi bulan sebelumnya
        // Mutasi bulan ini (dimasukkan ke kolom yang sesuai)
        debit: profitBulanIni < 0 ? Math.abs(profitBulanIni) : 0,
        kredit: profitBulanIni > 0 ? Math.abs(profitBulanIni) : 0,
        saldo_akhir: totalProfitKumulatif * -1
      });
      continue;
    }

    // Normal rows: combine multiple categories
    let combinedAwal = 0, combinedDebit = 0, combinedKredit = 0, combinedAkhir = 0;
    let foundAny = false;
    let firstTipeNeraca = 'Asset';

    for (const catName of entry.categories) {
      // LOGIKA KHUSUS UNTUK CASH & BANK (Berdasarkan metode_pembayaran di ArusKas)
      if (entry.label === 'CASH' || entry.label === 'BANK') {
        foundAny = true;
        const targetMetode = entry.label; // 'CASH' atau 'BANK'

        // 1. Ambil Saldo Awal Master (khusus kategori CASH atau BANK jika masih ada, atau dari saldo_awal kategori itu sendiri)
        const cat = kategoriList.find(c => c.nama_kategori === targetMetode);
        const initialSaldo = cat ? parseFloat(cat.saldo_awal) : 0;

        // 2. Saldo Awal (Mutasi sebelum bulan ini)
        const prevTrx = await ArusKas.findAll({
          where: { metode_pembayaran: targetMetode, tanggal: { [Op.lt]: startDate } },
          attributes: [
            [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Debit' THEN `nominal` ELSE 0 END")), 'totalDebit'],
            [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Kredit' THEN `nominal` ELSE 0 END")), 'totalKredit']
          ]
        });
        const pDebit = parseFloat(prevTrx[0]?.dataValues?.totalDebit || 0); // Keluar
        const pKredit = parseFloat(prevTrx[0]?.dataValues?.totalKredit || 0); // Masuk
        
        // Rumus Neraca: Awal + Masuk - Keluar
        const sAwal = initialSaldo + pKredit - pDebit;

        // 3. Mutasi bulan ini
        const currTrx = await ArusKas.findAll({
          where: { metode_pembayaran: targetMetode, tanggal: { [Op.between]: [startDate, endDate] } },
          attributes: [
            [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Debit' THEN `nominal` ELSE 0 END")), 'totalDebit'],
            [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Kredit' THEN `nominal` ELSE 0 END")), 'totalKredit']
          ]
        });
        const cDebit = parseFloat(currTrx[0]?.dataValues?.totalDebit || 0); // Keluar
        const cKredit = parseFloat(currTrx[0]?.dataValues?.totalKredit || 0); // Masuk
        
        // Rumus Neraca: Awal + Masuk - Keluar
        const sAkhir = sAwal + cKredit - cDebit;

        combinedAwal += sAwal;
        combinedDebit += cKredit; // Masuk ke kolom Debit Neraca
        combinedKredit += cDebit; // Masuk ke kolom Kredit Neraca
        combinedAkhir += sAkhir;
        break;
      }

      const cat = kategoriList.find(c => c.nama_kategori === catName);
      if (!cat) continue;
      foundAny = true;
      firstTipeNeraca = cat.tipe_neraca;

      // Saldo Awal (all transactions BEFORE this month)
      const prevTransactions = await ArusKas.findAll({
        where: { kategori_id: cat.kategori_id, tanggal: { [Op.lt]: startDate } },
        attributes: [
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Debit' THEN `nominal` ELSE 0 END")), 'totalDebit'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Kredit' THEN `nominal` ELSE 0 END")), 'totalKredit']
        ]
      });

      // LOGIKA RUMUS SALDO (Universal Neraca: Awal + Debit - Kredit)
      let currentNeracaDebit = 0; // Kolom Masuk
      let currentNeracaKredit = 0; // Kolom Keluar

      const pDebit = parseFloat(prevTransactions[0]?.dataValues?.totalDebit || 0); // Keluar (Arus Kas)
      const pKredit = parseFloat(prevTransactions[0]?.dataValues?.totalKredit || 0); // Masuk (Arus Kas)

      let saldoAwalBulan = 0;
      if (entry.isPiutang) {
        // Piutang: Debit Neraca (Nambah Tagihan) = Debit Arus Kas (Keluar dari Kas)
        saldoAwalBulan = parseFloat(cat.saldo_awal) + pDebit - pKredit;
      } else if (entry.isPasiva) {
        // Pasiva: Saldo Awal (Negatif) - Kredit Kas (Uang Masuk) + Debit Kas (Uang Keluar)
        // Contoh: -100 (Awal) - 50 (Simpanan Masuk) + 10 (Penarikan) = -140 (Saldo Akhir)
        saldoAwalBulan = parseFloat(cat.saldo_awal) - pKredit + pDebit;
      } else {
        // Aset Normal (Kas/Bank): Saldo Awal (Positif) + Kredit Kas (Masuk) - Debit Kas (Keluar)
        saldoAwalBulan = parseFloat(cat.saldo_awal) + pKredit - pDebit;
      }

      // Current month transactions
      const currentTransactions = await ArusKas.findAll({
        where: { kategori_id: cat.kategori_id, tanggal: { [Op.between]: [startDate, endDate] } },
        attributes: [
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Debit' THEN `nominal` ELSE 0 END")), 'totalDebit'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Kredit' THEN `nominal` ELSE 0 END")), 'totalKredit']
        ]
      });

      const cDebit = parseFloat(currentTransactions[0]?.dataValues?.totalDebit || 0);
      const cKredit = parseFloat(currentTransactions[0]?.dataValues?.totalKredit || 0);

      if (entry.isPiutang) {
        currentNeracaDebit = cDebit;
        currentNeracaKredit = cKredit;
      } else if (entry.isPasiva) {
        // Pasiva: Debit Neraca (Keluar/Kurang) = Debit Arus Kas, Kredit Neraca (Masuk/Tambah) = Kredit Arus Kas
        currentNeracaDebit = cDebit; 
        currentNeracaKredit = cKredit;
      } else {
        currentNeracaDebit = cKredit; // Masuk (Arus Kas) ke Debit Neraca
        currentNeracaKredit = cDebit; // Keluar (Arus Kas) ke Kredit Neraca
      }

      const saldoAkhirBulan = entry.isPasiva 
        ? saldoAwalBulan - currentNeracaKredit + currentNeracaDebit
        : saldoAwalBulan + currentNeracaDebit - currentNeracaKredit;

      combinedAwal += saldoAwalBulan;
      combinedDebit += currentNeracaDebit;
      combinedKredit += currentNeracaKredit;
      combinedAkhir += saldoAkhirBulan;
    }

    // Final Mapping for the row
    const item = {
      nama_kategori: entry.label,
      tipe_neraca: firstTipeNeraca,
      isTotalRow: entry.isTotal || false,
      isCalculated: entry.isCalculated || false,
      isPasiva: entry.isPasiva || false,
      // Saldo logic: Assets are positive, Pasiva are negative
      saldo_awal: combinedAwal,
      // Column logic for equality: 
      // Assets: Debit = In (+), Kredit = Out (-)
      // Pasiva: Debit = Out (-), Kredit = In (+)
      debit: entry.isPasiva ? combinedKredit : combinedDebit, 
      kredit: entry.isPasiva ? combinedDebit : combinedKredit,
      saldo_akhir: combinedAkhir
    };

    // Accumulate for Total Asset (only for the calculated rows)
    if (firstTipeNeraca === 'Asset' && foundAny && !entry.isTotal) {
      assetAccumulator.awal += item.saldo_awal;
      assetAccumulator.debit += item.debit;
      assetAccumulator.kredit += item.kredit;
      assetAccumulator.akhir += item.saldo_akhir;
    }

    results.push(item);
  }

  return results;
}

/**
 * GET /api/keuangan/neraca
 * Menghitung data Neraca secara real-time berdasarkan Arus Kas.
 */
exports.getNeraca = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    if (!bulan || !tahun) {
      return res.status(400).json({ success: false, message: 'Bulan dan Tahun harus diisi.' });
    }

    const results = await calculateNeracaForMonth(bulan, tahun);

    // Cek Status Tutup Buku
    const closingStatus = await NeracaSaldo.findOne({
      where: { bulan, tahun, status_tutup_buku: true }
    });

    res.json({
      success: true,
      data: results,
      meta: { bulan, tahun, isClosed: !!closingStatus, closedAt: closingStatus ? closingStatus.tgl_tutup_buku : null }
    });
  } catch (error) {
    console.error('Error getNeraca:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/keuangan/neraca/tahunan?tahun=2026
 * Menghitung neraca untuk seluruh 12 bulan dalam satu tahun.
 */
exports.getNeracaTahunan = async (req, res) => {
  try {
    const { tahun } = req.query;
    if (!tahun) {
      return res.status(400).json({ success: false, message: 'Tahun harus diisi.' });
    }

    const monthlyData = [];
    
    for (let m = 1; m <= 12; m++) {
      const bulan = String(m).padStart(2, '0');
      const results = await calculateNeracaForMonth(bulan, tahun);
      
      // Check closing status for this month
      const closingStatus = await NeracaSaldo.findOne({
        where: { bulan: m, tahun, status_tutup_buku: true }
      });

      monthlyData.push({
        bulan: m,
        bulanLabel: moment().month(m - 1).format('MMMM'),
        data: results,
        isClosed: !!closingStatus,
        closedAt: closingStatus ? closingStatus.tgl_tutup_buku : null
      });
    }

    res.json({ success: true, data: monthlyData, meta: { tahun } });
  } catch (error) {
    console.error('Error getNeracaTahunan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/keuangan/neraca/tutup-buku
 * Melakukan penutupan buku untuk bulan tertentu.
 */
exports.tutupBuku = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { bulan, tahun } = req.body;
    const bendahara_id = req.user.user_id;

    // 1. Pastikan belum tutup buku
    const existing = await NeracaSaldo.findOne({ where: { bulan, tahun, status_tutup_buku: true } });
    if (existing) {
      throw new Error(`Buku untuk bulan ${bulan} tahun ${tahun} sudah ditutup.`);
    }

    // 2. Hitung data neraca
    const { dataNeraca } = req.body;

    for (const item of dataNeraca) {
      await NeracaSaldo.create({
        kategori_id: item.kategori_id,
        bulan,
        tahun,
        saldo_awal: item.saldo_awal,
        total_debit: item.debit,
        total_kredit: item.kredit,
        saldo_akhir: item.saldo_akhir,
        status_tutup_buku: true,
        tgl_tutup_buku: new Date(),
        bendahara_id
      }, { transaction });
    }

    await transaction.commit();
    
    if (req.io) {
      req.io.emit('neraca-closed', { bulan, tahun });
    }

    res.json({ success: true, message: `Berhasil tutup buku bulan ${bulan} tahun ${tahun}.` });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};
