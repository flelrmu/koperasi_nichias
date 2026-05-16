const { ArusKas, KategoriKas, User, Anggota, sequelize } = require("../models");
const { Op } = require("sequelize");
const ArusKasService = require("../services/ArusKasService");
const moment = require("moment");

// ==================== ARUS KAS ====================

/**
 * GET /api/keuangan/arus-kas
 * Ambil daftar arus kas dengan filter bulan dan tahun.
 */
exports.getAllArusKas = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;

    const where = {};
    if (bulan && tahun) {
      const startDate = moment(`${tahun}-${bulan}-01`, "YYYY-MM-DD")
        .startOf("month")
        .format("YYYY-MM-DD");
      const endDate = moment(`${tahun}-${bulan}-01`, "YYYY-MM-DD")
        .endOf("month")
        .format("YYYY-MM-DD");
      where.tanggal = { [Op.between]: [startDate, endDate] };
    } else if (tahun) {
      const startDate = moment(`${tahun}-01-01`, "YYYY-MM-DD")
        .startOf("year")
        .format("YYYY-MM-DD");
      const endDate = moment(`${tahun}-12-31`, "YYYY-MM-DD")
        .endOf("year")
        .format("YYYY-MM-DD");
      where.tanggal = { [Op.between]: [startDate, endDate] };
    }

    const data = await ArusKas.findAll({
      where,
      include: [
        {
          model: KategoriKas,
          as: "kategoriKas",
          attributes: ["nama_kategori", "jenis"],
        },
        {
          model: User,
          as: "user",
          attributes: ["user_id", "email"],
          include: [
            {
              model: Anggota,
              as: "anggota",
              attributes: ["nama_lengkap", "no_anggota"],
            },
          ],
        },
      ],
      order: [
        ["tanggal", "DESC"],
        ["kas_id", "DESC"],
      ],
    });

    // Hitung saldo gabungan real-time (Saldo Awal + Mutasi)
    const [saldoCash, saldoBank] = await Promise.all([
      ArusKasService.getSaldoPerMetode("CASH"),
      ArusKasService.getSaldoPerMetode("BANK"),
    ]);
    const currentBalance = saldoCash + saldoBank;

    res.json({ success: true, data, currentBalance });
  } catch (error) {
    console.error("Error getAllArusKas:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/keuangan/arus-kas
 * Bendahara input manual arus kas (misal: pengeluaran operasional).
 */
exports.createArusKas = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      user_id,
      nama_kategori,
      nominal,
      keterangan,
      jenis,
      metode_pembayaran,
    } = req.body;

    const newEntry = await ArusKasService.recordTransaction(
      {
        user_id,
        nama_kategori,
        nominal,
        keterangan,
        jenis, // Optional: override default category type
        metode_pembayaran: metode_pembayaran || "CASH",
      },
      { transaction },
      req.io,
    );

    await transaction.commit();
    if (req.io) {
      req.io.emit("arus-kas-updated");
      req.io.emit("dashboardUpdate");
    }
    res
      .status(201)
      .json({
        success: true,
        data: newEntry,
        message: "Transaksi arus kas berhasil dicatat.",
      });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error createArusKas:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/keuangan/arus-kas/:id
 * Edit manual arus kas.
 */
exports.updateArusKas = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { nama_kategori, nominal, keterangan, jenis, metode_pembayaran } =
      req.body;

    const updatedEntry = await ArusKasService.updateTransaction(
      id,
      {
        nama_kategori,
        nominal,
        keterangan,
        jenis,
        metode_pembayaran,
      },
      { transaction },
      req.io,
    );

    await transaction.commit();
    if (req.io) {
      req.io.emit("arus-kas-updated");
      req.io.emit("dashboardUpdate");
    }
    res.json({
      success: true,
      data: updatedEntry,
      message: "Transaksi berhasil diperbarui.",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error updateArusKas:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/keuangan/arus-kas/:id
 * Hapus manual arus kas.
 */
exports.deleteArusKas = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    await ArusKasService.deleteTransaction(id, { transaction }, req.io);

    await transaction.commit();
    if (req.io) {
      req.io.emit("arus-kas-updated");
      req.io.emit("dashboardUpdate");
    }
    res.json({ success: true, message: "Transaksi berhasil dihapus." });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error deleteArusKas:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/keuangan/saldo-kas
 * Ambil saldo real-time per metode (CASH & BANK).
 */
exports.getSaldoKas = async (req, res) => {
  try {
    const [saldoCash, saldoBank] = await Promise.all([
      ArusKasService.getSaldoPerMetode("CASH"),
      ArusKasService.getSaldoPerMetode("BANK"),
    ]);
    res.json({ success: true, data: { CASH: saldoCash, BANK: saldoBank } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/keuangan/saldo-kas
 * Bendahara edit saldo kas secara langsung (adjustment).
 */
exports.editSaldoKas = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { saldo_baru, metode_pembayaran, bulan, tahun } = req.body;
    const saldoBaru = parseFloat(saldo_baru);
    const targetMetode = metode_pembayaran || "CASH";

    if (isNaN(saldoBaru)) {
      return res.status(400).json({
        success: false,
        message: "Saldo baru harus berupa angka.",
      });
    }

    // 1. Ambil kategori terkait (CASH/BANK)
    const kategori = await KategoriKas.findOne({
      where: { nama_kategori: targetMetode },
      transaction,
    });
    if (!kategori) {
      throw new Error(`Kategori ${targetMetode} tidak ditemukan.`);
    }

    // 2. Hitung mutasi SEBELUM bulan yang dipilih
    const b = bulan || moment().format("MM");
    const t = tahun || moment().format("YYYY");
    const startDate = moment(`${t}-${b}-01`, "YYYY-MM-DD").format("YYYY-MM-DD");

    const prevTrx = await ArusKas.findAll({
      where: {
        metode_pembayaran: targetMetode,
        tanggal: { [Op.lt]: startDate },
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
      transaction,
    });

    const pDebit = parseFloat(prevTrx[0]?.dataValues?.totalDebit || 0); // Keluar
    const pKredit = parseFloat(prevTrx[0]?.dataValues?.totalKredit || 0); // Masuk

    // Rumus Neraca: Saldo_Awal_Bulan = Master + pKredit - pDebit
    // Maka: Master = Saldo_Awal_Bulan_UserInput - pKredit + pDebit
    const newMasterSaldoAwal = saldoBaru - pKredit + pDebit;

    // 3. Update master saldo awal di kategori
    await kategori.update({ saldo_awal: newMasterSaldoAwal }, { transaction });

    // PENTING: User minta "tidak ada hubungannya dengan arus kas"
    // Jadi kita TIDAK memanggil recalculateSaldo agar history saldo_akhir tidak berubah.
    // Dashboard dan Neraca (yang dihitung live) akan tetap terupdate secara otomatis.

    await transaction.commit();
    if (req.io) {
      req.io.emit("arus-kas-updated");
      req.io.emit("dashboardUpdate");
    }

    res.json({
      success: true,
      message: `Saldo Awal ${targetMetode} untuk periode ${b}/${t} berhasil disesuaikan.`,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error editSaldoKas:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== KATEGORI KAS ====================

/**
 * GET /api/keuangan/kategori
 */
exports.getAllKategori = async (req, res) => {
  try {
    // Auto-init important categories if they don't exist
    const importantCategories = [
      { nama_kategori: "CASH", jenis: "Kredit", tipe_neraca: "Asset" },
      { nama_kategori: "BANK", jenis: "Kredit", tipe_neraca: "Asset" },
      {
        nama_kategori: "PENDAPATAN RENTAL",
        jenis: "Kredit",
        tipe_neraca: "Income",
      }, // Kredit = Masuk
      { nama_kategori: "BEBAN RENTAL", jenis: "Debit", tipe_neraca: "Expense" }, // Debit = Keluar
      {
        nama_kategori: "PENDAPATAN BUNGA",
        jenis: "Kredit",
        tipe_neraca: "Income",
      }, // Kredit = Masuk
      {
        nama_kategori: "BEBAN OPERASIONAL",
        jenis: "Debit",
        tipe_neraca: "Expense",
      }, // Debit = Keluar
      {
        nama_kategori: "BEBAN CREDIT BARANG",
        jenis: "Debit",
        tipe_neraca: "Expense",
      }, // Debit = Keluar
      {
        nama_kategori: "BEBAN PINJAMAN",
        jenis: "Debit",
        tipe_neraca: "Expense",
      },
      {
        nama_kategori: "TAGIHAN PINJAMAN",
        jenis: "Debit",
        tipe_neraca: "Asset",
      },
      {
        nama_kategori: "TAGIHAN CREDIT BARANG",
        jenis: "Debit",
        tipe_neraca: "Asset",
      },
      { nama_kategori: "TAGIHAN RENTAL", jenis: "Debit", tipe_neraca: "Asset" },
      {
        nama_kategori: "PERSEDIAAN BARANG",
        jenis: "Debit",
        tipe_neraca: "Asset",
      },
      { nama_kategori: "ALAT KANTOR", jenis: "Debit", tipe_neraca: "Asset" },
      { nama_kategori: "INVESTASI", jenis: "Debit", tipe_neraca: "Asset" },
      { nama_kategori: "PROFIT/LOSS", jenis: "Kredit", tipe_neraca: "Equity" },
      { nama_kategori: "LABA DITAHAN", jenis: "Kredit", tipe_neraca: "Equity" },
      {
        nama_kategori: "SIMPANAN ANGGOTA",
        jenis: "Kredit",
        tipe_neraca: "Liability",
      },
    ];

    for (const cat of importantCategories) {
      const [record, created] = await KategoriKas.findOrCreate({
        where: { nama_kategori: cat.nama_kategori },
        defaults: cat,
      });
      // Ensure correct tipe_neraca and jenis if it exists but is wrong
      if (
        !created &&
        (record.tipe_neraca !== cat.tipe_neraca || record.jenis !== cat.jenis)
      ) {
        await record.update({ tipe_neraca: cat.tipe_neraca, jenis: cat.jenis });
      }
    }

    const data = await KategoriKas.findAll({
      order: [["nama_kategori", "ASC"]],
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error in getAllKategori:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/keuangan/kategori
 */
exports.createKategori = async (req, res) => {
  try {
    const { nama_kategori, jenis, kode_akun, tipe_neraca, saldo_awal } =
      req.body;
    const existing = await KategoriKas.findOne({ where: { nama_kategori } });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Nama kategori sudah ada." });
    }

    const isPasiva = ["Liability", "Equity"].includes(tipe_neraca);
    const finalSaldoAwal = isPasiva
      ? Math.abs(parseFloat(saldo_awal || 0)) * -1
      : Math.abs(parseFloat(saldo_awal || 0));

    const newCat = await KategoriKas.create({
      nama_kategori,
      jenis,
      kode_akun,
      tipe_neraca: tipe_neraca || "Asset",
      saldo_awal: finalSaldoAwal,
    });
    res
      .status(201)
      .json({
        success: true,
        data: newCat,
        message: "Kategori berhasil ditambahkan.",
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/keuangan/kategori/:id
 */
exports.updateKategori = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { nama_kategori, jenis, kode_akun, tipe_neraca, saldo_awal } =
      req.body;

    const kategori = await KategoriKas.findByPk(id);
    if (!kategori)
      return res
        .status(404)
        .json({ success: false, message: "Kategori tidak ditemukan." });

    const absSaldo = Math.abs(parseFloat(saldo_awal || 0));
    // Tanda (+/-) ditentukan sepenuhnya oleh pilihan Debit/Kredit (Kredit = +, Debit = -)
    const finalSaldoAwal = jenis === "Kredit" ? absSaldo : absSaldo * -1;

    await kategori.update(
      {
        nama_kategori,
        jenis,
        kode_akun,
        tipe_neraca,
        saldo_awal: finalSaldoAwal,
      },
      { transaction },
    );

    // PENTING: Hitung ulang seluruh saldo_akhir di Arus Kas agar sinkron dengan saldo awal baru
    await ArusKasService.recalculateSaldo({ transaction });

    await transaction.commit();

    if (req.io) {
      req.io.emit("arus-kas-updated");
      req.io.emit("dashboardUpdate");
    }

    res.json({
      success: true,
      data: kategori,
      message: "Kategori dan Saldo Awal berhasil diperbarui.",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Error updateKategori:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Gagal memperbarui kategori: " + error.message,
      });
  }
};

/**
 * DELETE /api/keuangan/kategori/:id
 */
exports.deleteKategori = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category is used in ArusKas
    const isUsed = await ArusKas.findOne({ where: { kategori_id: id } });
    if (isUsed) {
      return res.status(400).json({
        success: false,
        message:
          "Kategori tidak dapat dihapus karena sudah digunakan dalam transaksi arus kas.",
      });
    }

    const kategori = await KategoriKas.findByPk(id);
    if (!kategori)
      return res
        .status(404)
        .json({ success: false, message: "Kategori tidak ditemukan." });

    await kategori.destroy();
    res.json({ success: true, message: "Kategori berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
