const SHUService = require("../services/SHUService");

/**
 * GET /api/keuangan/shu/preview
 */
exports.getPreview = async (req, res) => {
  try {
    const { tahun } = req.query;
    if (!tahun) throw new Error("Tahun harus diisi.");

    const data = await SHUService.generatePreview(parseInt(tahun));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/keuangan/shu/proses
 */
exports.prosesSHU = async (req, res) => {
  try {
    const { tahun, jatah_anggota, jatah_pengurus, laba_ditahan } = req.body;
    const userId = req.user.user_id;

    if (!tahun) throw new Error("Tahun harus diisi.");

    const result = await SHUService.processSHU(
      parseInt(tahun),
      parseFloat(jatah_anggota),
      parseFloat(jatah_pengurus),
      parseFloat(laba_ditahan),
      userId,
    );

    const io = req.io || req.app.get("io");
    if (io) {
      io.emit("notifikasi:shu-proses-sukses", {
        notifikasi: {
          judul: "SHU Berhasil Diproses 📊",
          pesan: `Data SHU Tahun ${tahun} berhasil diproses oleh Bendahara.`
        }
      });
      io.emit("dashboardUpdate");
    }

    res.json({
      success: true,
      message: `SHU tahun ${tahun} berhasil diproses. Silakan simpan untuk memperbarui Neraca.`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/keuangan/shu/finalize
 */
exports.finalizeSHU = async (req, res) => {
  try {
    const { tahun } = req.body;
    const userId = req.user.user_id;
    if (!tahun) throw new Error("Tahun harus diisi.");

    const result = await SHUService.finalizeSHU(parseInt(tahun), userId);

    const io = req.io || req.app.get("io");
    if (io) {
      io.emit("shu:finalized", { tahun });
      io.emit("notifikasi:shu", {
        notifikasi: {
          judul: "SHU Telah Diterima 🎉",
          pesan: `Pembagian SHU Tahun ${tahun} telah dikalkulasi dan masuk ke akun Anda.`,
        }
      });
      io.emit("notifikasi:shu-final-sukses", {
        notifikasi: {
          judul: "SHU Berhasil Dibagikan 🎉",
          pesan: `Distribusi SHU Tahun ${tahun} berhasil diselesaikan.`
        }
      });
      io.emit("dashboardUpdate");
      io.emit("arus-kas-updated");
    }

    res.json({
      success: true,
      message: `SHU tahun ${tahun} telah difinalisasi dan Laba Ditahan telah masuk ke Neraca.`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/keuangan/shu/cancel-finalize
 */
exports.cancelFinalizeSHU = async (req, res) => {
  try {
    const { tahun } = req.body;
    if (!tahun) throw new Error("Tahun harus diisi.");

    const result = await SHUService.cancelFinalizeSHU(parseInt(tahun));

    const io = req.io || req.app.get("io");
    if (io) {
      io.emit("shu:unfinalized", { tahun });
      io.emit("dashboardUpdate");
      io.emit("arus-kas-updated");
    }

    res.json({
      success: true,
      message: `Finalisasi SHU tahun ${tahun} telah dibatalkan. Saldo Laba Ditahan telah dikeluarkan dari Neraca.`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/keuangan/shu/:tahun
 */
exports.cancelSHU = async (req, res) => {
  try {
    const { tahun } = req.params;
    if (!tahun) throw new Error("Tahun harus diisi.");

    await SHUService.cancelSHU(parseInt(tahun));
    res.json({
      success: true,
      message: `Proses SHU tahun ${tahun} telah dibatalkan.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
