const { ArusKas, KategoriKas, User, Anggota, PeriodeKeuangan, sequelize } = require("../models");
const { Op } = require("sequelize");
const ArusKasService = require("../services/ArusKasService");
const moment = require("moment");

// --- Saldo Awal Access Code Store (In-Memory OTP) ---
// Structure: { userId: { code, expiresAt } }
const saldoAwalCodeStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 menit

exports.generateSaldoAwalCode = async (req, res) => {
  try {
    const userId = req.user.user_id;
    // Generate kode 6 digit alphanumeric (huruf kapital + angka)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const expiresAt = Date.now() + OTP_EXPIRY_MS;
    saldoAwalCodeStore.set(String(userId), { code, expiresAt });
    res.json({ success: true, code, expiresAt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifySaldoAwalCode = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { code } = req.body;
    const stored = saldoAwalCodeStore.get(String(userId));
    if (!stored) {
      return res.status(400).json({ success: false, message: 'Kode belum di-generate atau sudah kadaluarsa. Silakan minta kode baru.' });
    }
    if (Date.now() > stored.expiresAt) {
      saldoAwalCodeStore.delete(String(userId));
      return res.status(400).json({ success: false, message: 'Kode sudah kadaluarsa. Silakan minta kode baru.' });
    }
    if ((code || '').toUpperCase().trim() !== stored.code) {
      return res.status(400).json({ success: false, message: 'Kode verifikasi tidak cocok. Periksa kembali kode yang tertera.' });
    }
    // Hapus kode setelah berhasil diverifikasi (single-use)
    saldoAwalCodeStore.delete(String(userId));
    res.json({ success: true, message: 'Verifikasi berhasil.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




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





exports.tutupBuku = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { bulan, tahun } = req.body;
    const bendaharaId = req.user.user_id;

    
    const targetBulan = parseInt(bulan);
    const targetTahun = parseInt(tahun);

    
    const existing = await PeriodeKeuangan.findOne({
      where: { bulan: targetBulan, tahun: targetTahun }
    });

    if (existing && existing.is_closed) {
      throw new Error("Periode ini sudah ditutup sebelumnya.");
    }

    const strBulan = String(targetBulan).padStart(2, '0');
    const strTahun = String(targetTahun);
    const neracaController = require("./neracaController");
    const neracaData = await neracaController.getNeracaData(strBulan, strTahun);

    const assets = neracaData.filter(item => item.tipe_neraca === 'Asset' && !item.isTotalRow);
    const liabilities = neracaData.filter(item => item.tipe_neraca === 'Liability' && !item.isTotalRow);
    const equities = neracaData.filter(item => item.tipe_neraca === 'Equity' && !item.isTotalRow);

    const totalAssets = assets.reduce((acc, curr) => acc + parseFloat(curr.saldo_akhir || 0), 0);
    const totalLiabilities = liabilities.reduce((acc, curr) => acc + parseFloat(curr.saldo_akhir || 0), 0);
    const totalEquity = equities.reduce((acc, curr) => acc + parseFloat(curr.saldo_akhir || 0), 0);

    const diff = Math.abs(totalAssets + totalLiabilities + totalEquity);
    if (diff >= 1) {
      throw new Error(`Tidak dapat menutup buku karena status neraca tidak seimbang. Selisih: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(diff)}`);
    }

    // No longer generating SaldoBulanan snapshots. Closing is purely logical status locking.


    
    if (existing) {
      await existing.update({ is_closed: true, closed_at: new Date(), closed_by: bendaharaId }, { transaction });
    } else {
      await PeriodeKeuangan.create({
        bulan: targetBulan, tahun: targetTahun, is_closed: true, closed_at: new Date(), closed_by: bendaharaId
      }, { transaction });
    }

    
    await ArusKasService.recalculateSaldo({ transaction });

    await transaction.commit();

    
    const io = req.io || req.app.get("io");
    if (io) {
      io.emit("dashboardUpdate");
      io.emit("arus-kas-updated");
    }

    res.json({ success: true, message: `Berhasil tutup buku periode ${bulan}/${tahun}` });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};





exports.cancelTutupBuku = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { bulan, tahun } = req.body;

    const targetBulan = parseInt(bulan);
    const targetTahun = parseInt(tahun);

    
    const subsequentClosed = await PeriodeKeuangan.findOne({
      where: {
        is_closed: true,
        [Op.or]: [
          { tahun: { [Op.gt]: targetTahun } },
          {
            tahun: targetTahun,
            bulan: { [Op.gt]: targetBulan }
          }
        ]
      }
    });

    if (subsequentClosed) {
      throw new Error(`Tidak dapat membuka kembali periode ini karena periode setelahnya (${subsequentClosed.bulan}/${subsequentClosed.tahun}) sudah ditutup.`);
    }

    
    const existing = await PeriodeKeuangan.findOne({
      where: { bulan: targetBulan, tahun: targetTahun }
    });

    if (!existing || !existing.is_closed) {
      throw new Error("Periode ini belum ditutup.");
    }



    // No longer removing SaldoBulanan since they are not generated.


    
    await existing.update({
      is_closed: false,
      closed_at: null,
      closed_by: null
    }, { transaction });

    
    await ArusKasService.recalculateSaldo({ transaction });

    await transaction.commit();

    
    const io = req.io || req.app.get("io");
    if (io) {
      io.emit("dashboardUpdate");
      io.emit("arus-kas-updated");
    }

    res.json({ success: true, message: `Berhasil membuka kembali periode ${targetBulan}/${targetTahun}` });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};





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

    
    const [saldoCash, saldoBank] = await Promise.all([
      ArusKasService.getSaldoPerMetode("CASH", bulan, tahun),
      ArusKasService.getSaldoPerMetode("BANK", bulan, tahun),
    ]);
    const currentBalance = saldoCash + saldoBank;

    res.json({ success: true, data, currentBalance });
  } catch (error) {
    console.error("Error getAllArusKas:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};





exports.createArusKas = async (req, res) => {
  const { tanggal } = req.body;
  
  
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
        jenis, 
        metode_pembayaran: metode_pembayaran || "CASH",
        tanggal,
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





exports.updateArusKas = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { nama_kategori, nominal, keterangan, jenis, metode_pembayaran, tanggal } =
      req.body;

    
    const oldEntry = await ArusKas.findByPk(id);
    if (!oldEntry) throw new Error("Data tidak ditemukan.");

    
    const oldDate = moment(oldEntry.tanggal);
    const isOldClosed = await PeriodeKeuangan.findOne({
      where: { bulan: oldDate.month() + 1, tahun: oldDate.year(), is_closed: true }
    });
    if (isOldClosed) throw new Error("Periode transaksi lama sudah ditutup (Terkunci).");

    
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
        tanggal,
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





exports.deleteArusKas = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const entry = await ArusKas.findByPk(id);
    if (!entry) throw new Error("Data tidak ditemukan.");

    
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





exports.getSaldoKas = async (req, res) => {
  try {
    const { bulan, tahun } = req.query;
    
    
    const categories = await KategoriKas.findAll({
      where: { nama_kategori: ['CASH', 'BANK'] }
    });

    const result = {};
    for (const cat of categories) {
      const openingBalance = await ArusKasService.getOpeningBalance(cat, bulan, tahun);
      
      
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

      const mutation = parseFloat(currMutasi[0].totalDebit || 0) - parseFloat(currMutasi[0].totalKredit || 0);
      result[cat.nama_kategori] = openingBalance + mutation;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};





// editSaldoKas was removed because starting balance is now computed dynamically from KategoriKas and ArusKas.









exports.getAllKategori = async (req, res) => {
  try {
    
    const importantCategories = [
      { nama_kategori: "CASH", jenis: "Debit", tipe_neraca: "Asset" },
      { nama_kategori: "BANK", jenis: "Debit", tipe_neraca: "Asset" },
      {
        nama_kategori: "PENDAPATAN RENTAL",
        jenis: "Debit",
        tipe_neraca: "Income",
      }, 
      { nama_kategori: "BEBAN RENTAL", jenis: "Kredit", tipe_neraca: "Expense" }, 
      {
        nama_kategori: "PENDAPATAN BUNGA",
        jenis: "Debit",
        tipe_neraca: "Income",
      }, 
      {
        nama_kategori: "BEBAN OPERASIONAL",
        jenis: "Kredit",
        tipe_neraca: "Expense",
      }, 
      {
        nama_kategori: "BEBAN CREDIT BARANG",
        jenis: "Kredit",
        tipe_neraca: "Expense",
      }, 
      {
        nama_kategori: "BEBAN PINJAMAN",
        jenis: "Kredit",
        tipe_neraca: "Expense",
      },
      {
        nama_kategori: "TAGIHAN PINJAMAN",
        jenis: "Kredit",
        tipe_neraca: "Asset",
      },
      {
        nama_kategori: "TAGIHAN CREDIT BARANG",
        jenis: "Kredit",
        tipe_neraca: "Asset",
      },
      { nama_kategori: "TAGIHAN RENTAL", jenis: "Kredit", tipe_neraca: "Asset" },
      {
        nama_kategori: "PERSEDIAAN BARANG",
        jenis: "Kredit",
        tipe_neraca: "Asset",
      },
      { nama_kategori: "ALAT KANTOR", jenis: "Kredit", tipe_neraca: "Asset" },
      { nama_kategori: "INVESTASI", jenis: "Kredit", tipe_neraca: "Asset" },
      { nama_kategori: "PROFIT/LOSS", jenis: "Debit", tipe_neraca: "Equity" },
      { nama_kategori: "LABA DITAHAN", jenis: "Debit", tipe_neraca: "Equity" },
      {
        nama_kategori: "SIMPANAN ANGGOTA",
        jenis: "Debit",
        tipe_neraca: "Liability",
      },
      // Kategori otomatis dari proses angsuran pinjaman
      {
        nama_kategori: "ANGSURAN PINJAMAN UANG",
        jenis: "Debit",
        tipe_neraca: "Asset",
      },
      {
        nama_kategori: "ANGSURAN CREDIT BARANG",
        jenis: "Debit",
        tipe_neraca: "Asset",
      },
    ];

    for (const cat of importantCategories) {
      const [record, created] = await KategoriKas.findOrCreate({
        where: { nama_kategori: cat.nama_kategori },
        defaults: cat,
      });
      
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




exports.createKategori = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { nama_kategori, jenis, kode_akun, tipe_neraca, saldo_awal } =
      req.body;
    const existing = await KategoriKas.findOne({ where: { nama_kategori } }, { transaction });
    if (existing) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Nama kategori sudah ada." });
    }

    // Kredit = negative (mengurangi), Debit = positive (menambah)
    const finalSaldoAwal = jenis === "Kredit"
      ? Math.abs(parseFloat(saldo_awal || 0)) * -1
      : Math.abs(parseFloat(saldo_awal || 0));

    const newCat = await KategoriKas.create({
      nama_kategori,
      jenis,
      kode_akun,
      tipe_neraca: tipe_neraca || "Asset",
      saldo_awal: finalSaldoAwal,
    }, { transaction });

    await ArusKasService.recalculateSaldo({ transaction });
    await transaction.commit();

    if (req.io) {
      req.io.emit("arus-kas-updated");
      req.io.emit("dashboardUpdate");
    }

    res
      .status(201)
      .json({
        success: true,
        data: newCat,
        message: "Kategori berhasil ditambahkan.",
      });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};




exports.updateKategori = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { nama_kategori, jenis, kode_akun, tipe_neraca, saldo_awal } =
      req.body;

    const kategori = await KategoriKas.findByPk(id, { transaction });
    if (!kategori) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Kategori tidak ditemukan." });
    }

    const absSaldo = Math.abs(parseFloat(saldo_awal || 0));
    const targetJenis = jenis || kategori.jenis;
    // Kredit = negative (mengurangi), Debit = positive (menambah)
    const finalSaldoAwal = targetJenis === "Kredit" ? absSaldo * -1 : absSaldo;

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




exports.deleteKategori = async (req, res) => {
  try {
    const { id } = req.params;

    
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
