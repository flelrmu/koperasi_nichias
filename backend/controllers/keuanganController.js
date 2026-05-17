const { ArusKas, KategoriKas, User, Anggota, PeriodeKeuangan, SaldoBulanan, sequelize } = require("../models");
const { Op } = require("sequelize");
const ArusKasService = require("../services/ArusKasService");
const moment = require("moment");

// ==================== ARUS KAS ====================

/**
 * GET /api/keuangan/periode-status
 * Ambil status kunci periode (is_closed).
 */
exports.getPeriodeStatus = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    const periode = await PeriodeKeuangan.findOne({
      where: { bulan: parseInt(bulan), tahun: parseInt(tahun) }
    });
    res.json({ success: true, is_closed: periode ? periode.is_closed : false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/keuangan/tutup-buku
 * Mengunci periode akuntansi dan menyimpan saldo awal bulan depan.
 */
exports.tutupBuku = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { bulan, tahun } = req.body;
    const bendaharaId = req.user.user_id;

    // 1. Cek apakah sudah ditutup
    const existing = await PeriodeKeuangan.findOne({
      where: { bulan, tahun }
    });

    if (existing && existing.is_closed) {
      throw new Error("Periode ini sudah ditutup sebelumnya.");
    }

    // 2. Ambil Semua Kategori
    const categories = await KategoriKas.findAll();
    
    // 3. Hitung Saldo Akhir Tiap Kategori di Bulan Ini
    // Rumus: Saldo Awal Bulan Ini + Mutasi Bulan Ini
    const nextBulan = bulan == 12 ? 1 : parseInt(bulan) + 1;
    const nextTahun = bulan == 12 ? parseInt(tahun) + 1 : parseInt(tahun);

    for (const cat of categories) {
      // Ambil Saldo Awal Bulan Ini (jika ada)
      const currentSaldoAwalRes = await SaldoBulanan.findOne({
        where: { kategori_id: cat.kategori_id, bulan, tahun }
      });
      
      // Jika tidak ada di SaldoBulanan, gunakan saldo_awal global sebagai fallback (untuk bulan pertama sistem)
      const openingBalance = currentSaldoAwalRes ? parseFloat(currentSaldoAwalRes.saldo_awal) : parseFloat(cat.saldo_awal || 0);

      // Hitung Mutasi Bulan Ini
      const startDate = moment(`${tahun}-${bulan}-01`, "YYYY-MM-DD").startOf("month").toDate();
      const endDate = moment(`${tahun}-${bulan}-01`, "YYYY-MM-DD").endOf("month").toDate();

      const mutasi = await ArusKas.findAll({
        where: {
          kategori_id: cat.kategori_id,
          tanggal: { [Op.between]: [startDate, endDate] }
        }
      });

      let totalMutasi = 0;
      mutasi.forEach(m => {
        const nominal = parseFloat(m.nominal);
        // Logika Arus Kas: Kredit Menambah, Debit Mengurangi
        if (m.jenis === 'Kredit') totalMutasi += nominal;
        else totalMutasi -= nominal;
      });

      const closingBalance = openingBalance + totalMutasi;

      // 4. Simpan sebagai Saldo Awal Bulan Depan
      await SaldoBulanan.upsert({
        kategori_id: cat.kategori_id,
        bulan: nextBulan,
        tahun: nextTahun,
        saldo_awal: closingBalance
      }, { transaction });
    }

    // 5. Tandai Periode Ini Sebagai Tutup
    if (existing) {
      await existing.update({ is_closed: true, closed_at: new Date(), closed_by: bendaharaId }, { transaction });
    } else {
      await PeriodeKeuangan.create({
        bulan, tahun, is_closed: true, closed_at: new Date(), closed_by: bendaharaId
      }, { transaction });
    }

    await transaction.commit();
    res.json({ success: true, message: `Berhasil tutup buku periode ${bulan}/${tahun}` });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};

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
  const { tanggal } = req.body;
  
  // Validasi Periode Terkunci
  const date = tanggal ? moment(tanggal) : moment();
  const isClosed = await PeriodeKeuangan.findOne({
    where: { bulan: date.month() + 1, tahun: date.year(), is_closed: true }
  });
  if (isClosed) return res.status(403).json({ success: false, message: "Periode ini sudah ditutup (Terkunci)." });

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
    const { nama_kategori, nominal, keterangan, jenis, metode_pembayaran, tanggal } =
      req.body;

    // 1. Cek Record Lama
    const oldEntry = await ArusKas.findByPk(id);
    if (!oldEntry) throw new Error("Data tidak ditemukan.");

    // 2. Validasi Periode Terkunci (Bulan Lama)
    const oldDate = moment(oldEntry.tanggal);
    const isOldClosed = await PeriodeKeuangan.findOne({
      where: { bulan: oldDate.month() + 1, tahun: oldDate.year(), is_closed: true }
    });
    if (isOldClosed) throw new Error("Periode transaksi lama sudah ditutup (Terkunci).");

    // 3. Validasi Periode Terkunci (Bulan Baru - jika tanggal diubah)
    if (tanggal) {
      const newDate = moment(tanggal);
      const isNewClosed = await PeriodeKeuangan.findOne({
        where: { bulan: newDate.month() + 1, tahun: newDate.year(), is_closed: true }
      });
      if (isNewClosed) throw new Error("Periode tujuan baru sudah ditutup (Terkunci).");
    }

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

    const entry = await ArusKas.findByPk(id);
    if (!entry) throw new Error("Data tidak ditemukan.");

    // Validasi Periode Terkunci
    const date = moment(entry.tanggal);
    const isClosed = await PeriodeKeuangan.findOne({
      where: { bulan: date.month() + 1, tahun: date.year(), is_closed: true }
    });
    if (isClosed) throw new Error("Periode ini sudah ditutup (Terkunci).");

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
    const { bulan, tahun } = req.query;
    
    // Ambil Semua Kategori Kas (CASH & BANK)
    const categories = await KategoriKas.findAll({
      where: { nama_kategori: ['CASH', 'BANK'] }
    });

    const result = {};
    for (const cat of categories) {
      let openingBalance = 0;
      
      // 1. Cari apakah sudah ada saldo yang "DIKUNCI" via Tutup Buku
      const monthly = await SaldoBulanan.findOne({
        where: { 
          kategori_id: cat.kategori_id, 
          bulan: parseInt(bulan), 
          tahun: parseInt(tahun) 
        }
      });

      if (monthly) {
        openingBalance = parseFloat(monthly.saldo_awal);
      } else {
        // 2. Jika BELUM TUTUP BUKU, hitung secara dinamis (Selalu Nyambung)
        // Rumus: Saldo Awal Global + Mutasi dari awal waktu s/d akhir bulan SEBELUMNYA
        const targetDate = moment(`${tahun}-${bulan}-01`, "YYYY-MM-DD").startOf("month").toDate();
        
        const prevMutasi = await ArusKas.findAll({
          where: {
            metode_pembayaran: cat.nama_kategori,
            tanggal: { [Op.lt]: targetDate }
          },
          attributes: [
            [sequelize.fn('SUM', sequelize.literal("CASE WHEN jenis = 'Debit' THEN nominal ELSE 0 END")), 'totalDebit'],
            [sequelize.fn('SUM', sequelize.literal("CASE WHEN jenis = 'Kredit' THEN nominal ELSE 0 END")), 'totalKredit']
          ],
          raw: true
        });

        const initialGlobal = parseFloat(cat.saldo_awal || 0);
        const pDebit = parseFloat(prevMutasi[0].totalDebit || 0);
        const pKredit = parseFloat(prevMutasi[0].totalKredit || 0);
        
        openingBalance = initialGlobal + pKredit - pDebit;
      }
      
      // 3. Ambil Mutasi bulan berjalan (untuk dashboard live)
      const startDate = moment(`${tahun}-${bulan}-01`, "YYYY-MM-DD").startOf("month").toDate();
      const endDate = moment(`${tahun}-${bulan}-01`, "YYYY-MM-DD").endOf("month").toDate();
      
      const currMutasi = await ArusKas.findAll({
        where: {
          metode_pembayaran: cat.nama_kategori,
          tanggal: { [Op.between]: [startDate, endDate] }
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN jenis = 'Debit' THEN nominal ELSE 0 END")), 'totalDebit'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN jenis = 'Kredit' THEN nominal ELSE 0 END")), 'totalKredit']
        ],
        raw: true
      });

      const mutation = parseFloat(currMutasi[0].totalKredit || 0) - parseFloat(currMutasi[0].totalDebit || 0);
      result[cat.nama_kategori] = openingBalance + mutation;
    }

    res.json({ success: true, data: result });
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
      throw new Error("Saldo baru harus berupa angka.");
    }

    // Validasi Periode Terkunci
    const isClosed = await PeriodeKeuangan.findOne({
      where: { bulan: parseInt(bulan), tahun: parseInt(tahun), is_closed: true }
    });
    if (isClosed) throw new Error("Periode ini sudah ditutup. Tidak bisa menyesuaikan saldo awal.");

    // Cari Kategori
    const category = await KategoriKas.findOne({ where: { nama_kategori: targetMetode } });
    if (!category) throw new Error("Kategori kas tidak ditemukan.");

    // Simpan ke SaldoBulanan untuk bulan tersebut
    await SaldoBulanan.upsert({
      kategori_id: category.kategori_id,
      bulan: parseInt(bulan),
      tahun: parseInt(tahun),
      saldo_awal: saldoBaru
    }, { transaction });

    await transaction.commit();
    
    if (req.io) {
      req.io.emit("dashboardUpdate");
    }

    res.json({ success: true, message: "Saldo awal periode berhasil disesuaikan." });
  } catch (error) {
    if (transaction) await transaction.rollback();
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
