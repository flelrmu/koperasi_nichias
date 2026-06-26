const {
  ArusKas,
  KategoriKas,
  PeriodeKeuangan,
  User,
  Pengurus,
  SaldoBulanan,
  RekapShu,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const moment = require("moment");
const ArusKasService = require("../services/ArusKasService");

/**
 * NERACA_MAP: Fixed display order for Neraca.
 * `categories` is an array of nama_kategori to combine for each row.
 * `isTotal` flags the TOTAL ASSET calculation row.
 * `isCalculated` flags the PROFIT/LOSS calculated row.
 */
const NERACA_MAP = [
  { categories: ["CASH"], label: "CASH" },
  { categories: ["BANK"], label: "BANK" },
  {
    categories: [
      "PINJAMAN UANG",
      "ANGSURAN PINJAMAN UANG",
      "Pencairan Pinjaman",
      "Pembayaran Angsuran",
    ],
    label: "TAGIHAN PINJAMAN",
    isPiutang: true,
  },
  {
    categories: ["CREDIT BARANG", "ANGSURAN CREDIT BARANG"],
    label: "TAGIHAN CREDIT BARANG",
    isPiutang: true,
  },
  {
    categories: ["TAGIHAN RENTAL"],
    label: "TAGIHAN RENTAL",
    isPiutang: true,
  },
  {
    categories: ["PERSEDIAAN BARANG"],
    label: "PERSEDIAAN BARANG",
    isPiutang: true,
  },
  { categories: ["ALAT KANTOR"], label: "ALAT KANTOR", isPiutang: true },
  { categories: ["INVESTASI"], label: "INVESTASI", isPiutang: true },
  { categories: ["INCOME TAX"], label: "INCOME TAX", isPiutang: true },
  { isTotal: true, label: "TOTAL ASSET", type: "Asset" },
  {
    categories: ["DP - PENERIMAAN DIMUKA"],
    label: "DP - PENERIMAAN DIMUKA",
    isPasiva: true,
  },
  { categories: ["HUTANG USAHA"], label: "HUTANG USAHA", isPasiva: true },
  { categories: ["HUTANG BIAYA"], label: "HUTANG BIAYA", isPasiva: true },
  { categories: ["TAX LIABILITY"], label: "TAX LIABILITY", isPasiva: true },
  { categories: ["LOAN"], label: "LOAN", isPasiva: true },
  { isCalculated: true, label: "PROFIT/LOSS", isPasiva: true },
  {
    categories: [
      "SIMPANAN ANGGOTA",
      "Simpanan Pokok",
      "Simpanan Wajib",
      "Simpanan Sukarela",
      "Penarikan Simpanan",
    ],
    label: "SIMPANAN ANGGOTA",
    isPasiva: true,
  },
  {
    categories: ["LABA DITAHAN", "PEMBAGIAN SHU ANGGOTA", "PEMBAGIAN SHU PENGURUS"],
    label: "LABA DITAHAN",
    isPasiva: true,
  },
];

/**
 * Helper: Calculate neraca for a single month
 * Logic baru: Debit = Masuk, Kredit = Keluar
 */
async function calculateNeracaForMonth(bulan, tahun) {
  const startDate = moment(`${tahun}-${bulan}-01`, "YYYY-MM-DD")
    .startOf("month")
    .format("YYYY-MM-DD");
  const endDate = moment(`${tahun}-${bulan}-01`, "YYYY-MM-DD")
    .endOf("month")
    .format("YYYY-MM-DD");
  const startOfYear = moment(`${tahun}-01-01`, "YYYY-MM-DD").format(
    "YYYY-MM-DD",
  );

  const kategoriList = await KategoriKas.findAll();

  // Hitung penyesuaian finalisasi SHU secara dinamis
  const rekapList = await RekapShu.findAll({ where: { is_finalized: true } });
  
  let plKreditAdj = 0;
  let plAwalAdj = 0;
  
  let ldKreditAdj = 0;
  let ldAwalAdj = 0;
  let ldDebitAdj = 0;
  
  const queryBulan = parseInt(bulan);
  const queryTahun = parseInt(tahun);
  
  for (const rekap of rekapList) {
    const finalizeDate = moment(rekap.updatedAt);
    const fMonth = finalizeDate.month() + 1;
    const fYear = finalizeDate.year();
    const amt = parseFloat(rekap.total_profit || 0);
    const jatahSHU = parseFloat(rekap.jatah_anggota || 0) + parseFloat(rekap.jatah_pengurus || 0);
    const labaDitahan = parseFloat(rekap.laba_ditahan || 0);
    
    // Hitung bulan & tahun berikutnya untuk penyesuaian Laba Ditahan
    const nextMonth = fMonth === 12 ? 1 : fMonth + 1;
    const nextYear = fMonth === 12 ? fYear + 1 : fYear;

    // 1. Penyesuaian Profit/Loss (PL)
    if (queryTahun === fYear && queryBulan === fMonth) {
      // Kurangi Profit/Loss di bulan finalisasi hanya sebesar Jatah Anggota & Pengurus
      plKreditAdj -= jatahSHU;
      // Jangan kurangi Laba Ditahan di bulan finalisasi karena pengurangannya sudah di-handle oleh Profit/Loss
      ldDebitAdj -= jatahSHU;
    } else if (queryTahun === fYear && queryBulan > fMonth) {
      // Di bulan-bulan setelah finalisasi pada tahun yang sama, seluruh keuntungan ditutup dari Profit/Loss
      plAwalAdj += amt;
    }

    // 2. Penyesuaian Laba Ditahan (LD)
    if (queryTahun > nextYear || (queryTahun === nextYear && queryBulan >= nextMonth)) {
      // Tambahkan seluruh Laba Bersih ke saldo awal Laba Ditahan di bulan SETELAH finalisasi dan seterusnya
      // Selisih jatah SHU sudah didebit di ArusKas/Laba Ditahan pada bulan finalisasi
      ldAwalAdj -= amt;
    }
  }

  // Ambil semua SaldoBulanan untuk bulan & tahun ini dalam satu query untuk efisiensi
  const monthlyOpeningBalances = await SaldoBulanan.findAll({
    where: { bulan: parseInt(bulan), tahun: parseInt(tahun) },
  });

  const saldoMap = {};
  monthlyOpeningBalances.forEach((s) => {
    saldoMap[s.kategori_id] = parseFloat(s.saldo_awal);
  });

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
        saldo_akhir: assetAccumulator.akhir,
      });
      continue;
    }

    if (entry.isCalculated) {
      // 1. Hitung PROFIT/LOSS SEBELUM bulan ini (Saldo Awal)
      const prevPlTrx = await ArusKas.findAll({
        include: [
          {
            model: KategoriKas,
            as: "kategoriKas",
            where: { tipe_neraca: { [Op.in]: ["Income", "Expense"] } },
            attributes: ["tipe_neraca"],
          },
        ],
        where: {
          tanggal: {
            [Op.between]: [
              startOfYear,
              moment(startDate).subtract(1, "day").format("YYYY-MM-DD"),
            ],
          },
        },
        attributes: [
          [
            sequelize.fn(
              "SUM",
              sequelize.literal(
                "CASE WHEN `ArusKas`.`jenis` = 'Debit' THEN `nominal` ELSE 0 END",
              ),
            ),
            "totalDebit",
          ],
          [
            sequelize.fn(
              "SUM",
              sequelize.literal(
                "CASE WHEN `ArusKas`.`jenis` = 'Kredit' THEN `nominal` ELSE 0 END",
              ),
            ),
            "totalKredit",
          ],
        ],
        group: [sequelize.col("kategoriKas.tipe_neraca")],
        raw: true,
        nest: true,
      });

      let prevIncome = 0;
      let prevExpense = 0;
      prevPlTrx.forEach((t) => {
        const d = parseFloat(t.totalDebit || 0);
        const k = parseFloat(t.totalKredit || 0);
        const tipe = t.kategoriKas.tipe_neraca;
        if (tipe === "Income") prevIncome += d - k;
        else if (tipe === "Expense") prevExpense += k - d;
      });
      const profitAwal = prevIncome - prevExpense;

      // 2. Hitung PROFIT/LOSS BULAN INI SAJA (Mutasi)
      const currPlTrx = await ArusKas.findAll({
        include: [
          {
            model: KategoriKas,
            as: "kategoriKas",
            where: { tipe_neraca: { [Op.in]: ["Income", "Expense"] } },
            attributes: ["tipe_neraca"],
          },
        ],
        where: { tanggal: { [Op.between]: [startDate, endDate] } },
        attributes: [
          [
            sequelize.fn(
              "SUM",
              sequelize.literal(
                "CASE WHEN `ArusKas`.`jenis` = 'Debit' THEN `nominal` ELSE 0 END",
              ),
            ),
            "totalDebit",
          ],
          [
            sequelize.fn(
              "SUM",
              sequelize.literal(
                "CASE WHEN `ArusKas`.`jenis` = 'Kredit' THEN `nominal` ELSE 0 END",
              ),
            ),
            "totalKredit",
          ],
        ],
        group: [sequelize.col("kategoriKas.tipe_neraca")],
        raw: true,
        nest: true,
      });

      let currIncome = 0;
      let currExpense = 0;
      currPlTrx.forEach((t) => {
        const d = parseFloat(t.totalDebit || 0);
        const k = parseFloat(t.totalKredit || 0);
        const tipe = t.kategoriKas.tipe_neraca;
        if (tipe === "Income") currIncome += d - k;
        else if (tipe === "Expense") currExpense += k - d;
      });
      const profitBulanIni = currIncome - currExpense;

      const plAwal = (profitAwal * -1) + plAwalAdj;
      const plKredit = profitBulanIni + plKreditAdj;
      const plAkhir = plAwal - plKredit;

      results.push({
        nama_kategori: entry.label,
        isCalculated: true,
        isPasiva: true,
        tipe_neraca: "Equity",
        saldo_awal: plAwal,
        debit: 0,
        kredit: plKredit,
        saldo_akhir: plAkhir,
      });
      continue;
    }

    // Normal rows: combine multiple categories
    let combinedAwal = 0,
      combinedDebit = 0,
      combinedKredit = 0,
      combinedAkhir = 0;
    let foundAny = false;
    let firstTipeNeraca = null;

    for (const catName of entry.categories) {
      // LOGIKA KHUSUS UNTUK CASH & BANK (Berdasarkan metode_pembayaran di ArusKas)
      if (entry.label === "CASH" || entry.label === "BANK") {
        foundAny = true;
        const targetMetode = entry.label; // 'CASH' atau 'BANK'

        // 1. Ambil Saldo Awal (Menggunakan ArusKasService yang meng-handle propagasi)
        const cat = kategoriList.find((c) => c.nama_kategori === targetMetode);
        if (!cat) continue;

        const sAwal = await ArusKasService.getOpeningBalance(cat, bulan, tahun);

        // 3. Mutasi bulan ini
        const currTrx = await ArusKas.findAll({
          where: {
            metode_pembayaran: targetMetode,
            tanggal: { [Op.between]: [startDate, endDate] },
          },
          attributes: [
            [
              sequelize.fn(
                "SUM",
                sequelize.literal(
                  "CASE WHEN `ArusKas`.`jenis` = 'Debit' THEN `nominal` ELSE 0 END",
                ),
              ),
              "totalDebit",
            ],
            [
              sequelize.fn(
                "SUM",
                sequelize.literal(
                  "CASE WHEN `ArusKas`.`jenis` = 'Kredit' THEN `nominal` ELSE 0 END",
                ),
              ),
              "totalKredit",
            ],
          ],
        });
        const cDebit = parseFloat(currTrx[0]?.dataValues?.totalDebit || 0); // Keluar
        const cKredit = parseFloat(currTrx[0]?.dataValues?.totalKredit || 0); // Masuk

        // Rumus Neraca: Awal + Masuk - Keluar
        const sAkhir = sAwal + cDebit - cKredit;

        combinedAwal += sAwal;
        combinedDebit += cDebit; // Masuk ke kolom Debit Neraca
        combinedKredit += cKredit; // Keluar ke kolom Kredit Neraca
        combinedAkhir += sAkhir;
        firstTipeNeraca = "Asset";
        break;
      }

      const cat = kategoriList.find((c) => c.nama_kategori === catName);
      if (!cat) continue;
      foundAny = true;
      if (!firstTipeNeraca) firstTipeNeraca = cat.tipe_neraca;

      // 1. Ambil Saldo Awal (Menggunakan ArusKasService yang meng-handle propagasi)
      const saldoAwalBulan = await ArusKasService.getOpeningBalance(cat, bulan, tahun);

      // Current month transactions
      const currentTransactions = await ArusKas.findAll({
        where: {
          kategori_id: cat.kategori_id,
          tanggal: { [Op.between]: [startDate, endDate] },
        },
        attributes: [
          [
            sequelize.fn(
              "SUM",
              sequelize.literal(
                "CASE WHEN `ArusKas`.`jenis` = 'Debit' THEN `nominal` ELSE 0 END",
              ),
            ),
            "totalDebit",
          ],
          [
            sequelize.fn(
              "SUM",
              sequelize.literal(
                "CASE WHEN `ArusKas`.`jenis` = 'Kredit' THEN `nominal` ELSE 0 END",
              ),
            ),
            "totalKredit",
          ],
        ],
      });

      const cDebit = parseFloat(
        currentTransactions[0]?.dataValues?.totalDebit || 0,
      );
      const cKredit = parseFloat(
        currentTransactions[0]?.dataValues?.totalKredit || 0,
      );

      let currentNeracaDebit, currentNeracaKredit;
      if (entry.isPasiva) {
        // Pasiva: Uang Masuk (Debit Arus Kas) ke Kredit Neraca, Uang Keluar (Kredit Arus Kas) ke Debit Neraca
        currentNeracaKredit = cDebit; // Uang Masuk
        currentNeracaDebit = cKredit; // Uang Keluar
      } else {
        // Non-Cash Asset: Uang Keluar (Kredit Arus Kas) ke Debit Neraca, Uang Masuk (Debit Arus Kas) ke Kredit Neraca
        currentNeracaDebit = cKredit; // Uang Keluar
        currentNeracaKredit = cDebit; // Uang Masuk
      }

      const saldoAkhirBulan = entry.isPasiva
        ? saldoAwalBulan - currentNeracaKredit + currentNeracaDebit
        : saldoAwalBulan + currentNeracaDebit - currentNeracaKredit;

      combinedAwal += saldoAwalBulan;
      combinedDebit += currentNeracaDebit;
      combinedKredit += currentNeracaKredit;
      combinedAkhir += saldoAkhirBulan;
    }

    if (entry.label === "LABA DITAHAN") {
      combinedAwal += ldAwalAdj;
      combinedDebit += ldDebitAdj;
      combinedKredit += ldKreditAdj;
      combinedAkhir = combinedAwal - combinedKredit + combinedDebit;
    }

    // Final Mapping for the row
    const item = {
      nama_kategori: entry.label,
      tipe_neraca: firstTipeNeraca || "Asset",
      isTotalRow: entry.isTotal || false,
      isCalculated: entry.isCalculated || false,
      isPasiva: entry.isPasiva || false,
      // Saldo logic: Assets are positive, Pasiva are negative
      saldo_awal: combinedAwal,
      // Column logic for equality:
      // Both Assets and Pasiva show Uang Keluar/Debit in Debit column, Uang Masuk/Kredit in Kredit column
      debit: combinedDebit,
      kredit: combinedKredit,
      saldo_akhir: combinedAkhir,
    };

    // Accumulate for Total Asset (only for the calculated rows)
    if (firstTipeNeraca === "Asset" && foundAny && !entry.isTotal) {
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
 * Helper internal untuk mendapatkan data neraca
 */
exports.getNeracaData = async (bulan, tahun) => {
  return await calculateNeracaForMonth(bulan, tahun);
};

/**
 * GET /api/keuangan/neraca
 * Menghitung data Neraca secara real-time berdasarkan Arus Kas.
 */
exports.getNeraca = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    if (!bulan || !tahun) {
      return res
        .status(400)
        .json({ success: false, message: "Bulan dan Tahun harus diisi." });
    }

    const results = await calculateNeracaForMonth(bulan, tahun);

    // Cek Status Tutup Buku
    const closingStatus = await PeriodeKeuangan.findOne({
      where: { bulan, tahun, is_closed: true },
    });

    res.json({
      success: true,
      data: results,
      meta: {
        bulan,
        tahun,
        isClosed: !!closingStatus,
        closedAt: closingStatus ? closingStatus.closed_at : null,
      },
    });
  } catch (error) {
    console.error("Error getNeraca:", error);
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
      return res
        .status(400)
        .json({ success: false, message: "Tahun harus diisi." });
    }

    const monthlyData = [];

    for (let m = 1; m <= 12; m++) {
      const bulan = String(m).padStart(2, "0");
      const results = await calculateNeracaForMonth(bulan, tahun);

      // Check closing status for this month
      const closingStatus = await PeriodeKeuangan.findOne({
        where: { bulan: m, tahun, is_closed: true },
      });

      monthlyData.push({
        bulan: m,
        bulanLabel: moment()
          .month(m - 1)
          .format("MMMM"),
        data: results,
        isClosed: !!closingStatus,
        closedAt: closingStatus ? closingStatus.closed_at : null,
      });
    }

    res.json({ success: true, data: monthlyData, meta: { tahun } });
  } catch (error) {
    console.error("Error getNeracaTahunan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// End of Neraca Controller
// End of Neraca Controller
