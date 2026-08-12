const db = require("../models");
const { generateNoAnggota } = require("../utils/idGenerator");
const bcrypt = require("bcrypt");
const ArusKasService = require("../services/ArusKasService");
const User = db.User;
const Anggota = db.Anggota;
const Pengurus = db.Pengurus;
const Notifikasi = db.Notifikasi;
const TransaksiSimpanan = db.TransaksiSimpanan;
const Konfigurasi = db.Konfigurasi;
const Pinjaman = db.Pinjaman;
const { Op } = require("sequelize");





const requestKeluar = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { user_id } = req.user;
    const { alasan_keluar } = req.body;

    const anggota = await Anggota.findOne({
      where: { user_id },
      transaction,
    });

    if (!anggota) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Data anggota tidak ditemukan." });
    }

    
    const activeLoans = await Pinjaman.findAll({
      where: {
        anggota_id: anggota.anggota_id,
        status: ["Approved", "Pending"], 
        sisa_tagihan: { [Op.gt]: 0 },
      },
      transaction,
    });

    if (activeLoans.length > 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Anda tidak dapat mengajukan keluar karena masih memiliki pinjaman aktif atau sisa tagihan.",
      });
    }

    await anggota.update(
      {
        status_keanggotaan: "Pending_Keluar",
        alasan_keluar,
      },
      { transaction },
    );

    
    const secretaryUsers = await User.findAll({
      where: { role: "Sekretaris" },
      transaction,
    });
    for (const secretary of secretaryUsers) {
      await Notifikasi.create(
        {
          user_id: secretary.user_id,
          judul: "Pengajuan Keluar Anggota 🚪",
          pesan: `${anggota.nama_lengkap} telah mengajukan pengunduran diri dari koperasi.`,
          tipe: "anggota",
          link: `/admin/users?review_keluar=${anggota.anggota_id}`,
          is_read: false,
        },
        { transaction },
      );
    }

    await transaction.commit();

    if (req.io) {
      req.io.emit("user:updated", {
        type: "Anggota",
        id: anggota.anggota_id,
        data: { status_keanggotaan: "Pending_Keluar", alasan_keluar },
      });

      
      req.io.emit("notifikasi:anggota-keluar", {
        user_id: user_id, 
        notifikasi: {
          judul: "Pengajuan Keluar Anggota 🚪",
          pesan: `${anggota.nama_lengkap} telah mengajukan pengunduran diri.`,
          tipe: "anggota",
          link: `/admin/users?review_keluar=${anggota.anggota_id}`,
        },
      });

      req.io.emit("dashboardUpdate");
      req.io.emit("arus-kas-updated");
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Pengajuan pengunduran diri berhasil dikirim.",
      });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("❌ Error request keluar:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};





const cancelKeluar = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { user_id } = req.user;

    const anggota = await Anggota.findOne({
      where: { user_id },
      transaction,
    });

    if (!anggota) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Data anggota tidak ditemukan." });
    }

    if (anggota.status_keanggotaan !== "Pending_Keluar") {
      await transaction.rollback();
      return res
        .status(400)
        .json({
          success: false,
          message: "Anggota tidak sedang dalam status pengajuan keluar.",
        });
    }

    await anggota.update(
      {
        status_keanggotaan: "Aktif",
        alasan_keluar: null,
      },
      { transaction },
    );

    await transaction.commit();

    if (req.io) {
      req.io.emit("user:updated", {
        type: "Anggota",
        id: anggota.anggota_id,
        data: { status_keanggotaan: "Aktif", alasan_keluar: null },
      });
      req.io.emit("dashboardUpdate");
      req.io.emit("arus-kas-updated");
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Pengajuan pengunduran diri berhasil dibatalkan.",
      });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("❌ Error cancel keluar:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};





const approveKeluar = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { anggota_id } = req.body;

    const anggota = await Anggota.findOne({
      where: { anggota_id },
      include: [{ model: User, as: "user" }],
      transaction,
    });

    if (!anggota) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Data anggota tidak ditemukan." });
    }

    await anggota.update(
      {
        status_keanggotaan: "Keluar",
      },
      { transaction },
    );

    
    await Notifikasi.create(
      {
        user_id: anggota.user_id,
        judul: "Pengajuan Keluar Disetujui ✅",
        pesan: `Pengajuan pengunduran diri Anda telah disetujui. Terima kasih atas kontribusi Anda di Koperasi Nichias.`,
        tipe: "anggota",
        link: "/dashboard/keluar",
        is_read: false,
      },
      { transaction },
    );

    await transaction.commit();

    if (req.io) {
      req.io.emit("user:updated", {
        type: "Anggota",
        id: anggota.anggota_id,
        data: { status_keanggotaan: "Keluar" },
      });
      req.io.emit("dashboardUpdate");
      req.io.emit("arus-kas-updated");
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Pengajuan pengunduran diri berhasil disetujui.",
      });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("❌ Error approve keluar:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};





const getAnggotaList = async (req, res) => {
  try {
    const anggota = await Anggota.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email", "role"],
        },
      ],
      order: [["tanggal_registrasi", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: anggota,
    });
  } catch (error) {
    console.error("❌ Error fetching anggota list:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar anggota.",
      error: error.message,
    });
  }
};





const getPengurusList = async (req, res) => {
  try {
    const pengurus = await Pengurus.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["email", "role"],
        },
      ],
      order: [["jabatan", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: pengurus,
    });
  } catch (error) {
    console.error("❌ Error fetching pengurus list:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil daftar pengurus.",
      error: error.message,
    });
  }
};





const updateUser = async (req, res) => {
  const { type, id } = req.params; 
  const updateData = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    let result;
    if (type === "anggota") {
      const anggota = await Anggota.findByPk(id, { transaction });
      if (!anggota) {
        await transaction.rollback();
        return res
          .status(404)
          .json({ success: false, message: "Anggota tidak ditemukan." });
      }
      await anggota.update(updateData, { transaction });

      
      if (updateData.email || updateData.role) {
        await User.update(
          { email: updateData.email, role: updateData.role },
          { where: { user_id: anggota.user_id }, transaction },
        );
      }
      result = anggota;
    } else {
      const pengurus = await Pengurus.findByPk(id, { transaction });
      if (!pengurus) {
        await transaction.rollback();
        return res
          .status(404)
          .json({ success: false, message: "Pengurus tidak ditemukan." });
      }

      
      if (updateData.role && !updateData.jabatan) {
        updateData.jabatan = updateData.role;
      }

      await pengurus.update(updateData, { transaction });

      
      if (updateData.email || updateData.role) {
        await User.update(
          { email: updateData.email, role: updateData.role },
          { where: { user_id: pengurus.user_id }, transaction },
        );
      }
      result = pengurus;
    }

    await transaction.commit();

    
    if (type === "anggota") {
      result = await Anggota.findByPk(id, {
        include: [{ model: User, as: "user", attributes: ["email", "role"] }],
      });
    } else {
      result = await Pengurus.findByPk(id, {
        include: [{ model: User, as: "user", attributes: ["email", "role"] }],
      });
    }

    
    req.io.emit("user:updated", { type, id: parseInt(id), data: result });
    req.io.emit("dashboardUpdate");

    return res.status(200).json({
      success: true,
      message: `Data ${type} berhasil diupdate.`,
      data: result,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error updating user:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal mengupdate data.",
        error: error.message,
      });
  }
};





const deleteUser = async (req, res) => {
  const { type, id } = req.params;
  const transaction = await db.sequelize.transaction();

  try {
    let userId;
    if (type === "anggota") {
      const anggota = await Anggota.findByPk(id, { transaction });
      if (!anggota) {
        await transaction.rollback();
        return res
          .status(404)
          .json({ success: false, message: "Anggota tidak ditemukan." });
      }
      userId = anggota.user_id;

      
      const activeLoans = await Pinjaman.findAll({
        where: {
          anggota_id: id,
          status: ["Approved", "Pending"],
          sisa_tagihan: { [Op.gt]: 0 },
        },
        transaction,
      });

      if (activeLoans.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Anggota tidak dapat dihapus karena masih memiliki pinjaman yang belum lunas.",
        });
      }

      
      const transaksiSimpananList = await TransaksiSimpanan.findAll({
        where: { anggota_id: id },
        transaction,
      });
      const transaksiIds = transaksiSimpananList.map((t) => t.transaksi_id);

      
      const pinjamanList = await Pinjaman.findAll({
        where: { anggota_id: id },
        transaction,
      });
      const pinjamanIds = pinjamanList.map((p) => p.pinjaman_id);
      const invoiceNumbers = pinjamanList.map((p) => p.nomor_invoice).filter(Boolean);

      
      const arusKasConditions = [];

      
      if (transaksiIds.length > 0) {
        arusKasConditions.push(
          { kode_transaksi: { [Op.in]: transaksiIds.map((tid) => `TXS-${tid}`) } },
          { kode_transaksi: { [Op.in]: transaksiIds.map((tid) => `WDR-${tid}`) } }
        );
      }
      arusKasConditions.push(
        { kode_transaksi: `REG-PKK-${id}` },
        { kode_transaksi: `ADM-PKK-${id}` },
        { kode_transaksi: { [Op.like]: `BLK-WJB-${id}-%` } }
      );

      
      if (invoiceNumbers.length > 0) {
        invoiceNumbers.forEach((inv) => {
          arusKasConditions.push({ kode_transaksi: inv });
          if (inv.length > 20) {
            arusKasConditions.push({ kode_transaksi: inv.substring(0, 20) });
          }
        });
      }
      if (pinjamanIds.length > 0) {
        pinjamanIds.forEach((pid) => {
          arusKasConditions.push(
            { kode_transaksi: { [Op.like]: `ANG-PKK-${pid}-%` } },
            { kode_transaksi: { [Op.like]: `ANG-JSA-${pid}-%` } },
            { kode_transaksi: `LNS-PKK-${pid}` },
            { kode_transaksi: `LNS-JSA-${pid}` }
          );
        });
      }

      
      await db.ArusKas.destroy({
        where: {
          [Op.or]: arusKasConditions,
        },
        transaction,
      });

      
      await ArusKasService.recalculateSaldo({ transaction });

      
      await db.TransaksiSimpanan.destroy({
        where: { anggota_id: id },
        transaction,
      });

      
      const pinjamanListToDestroy = await db.Pinjaman.findAll({
        where: { anggota_id: id },
        attributes: ["pinjaman_id"],
        transaction,
      });
      const pinjamanIdsToDestroy = pinjamanListToDestroy.map((p) => p.pinjaman_id);

      if (pinjamanIdsToDestroy.length > 0) {
        await db.Angsuran.destroy({
          where: { pinjaman_id: pinjamanIdsToDestroy },
          transaction,
        });
        await db.Pinjaman.destroy({ where: { anggota_id: id }, transaction });
      }

      await db.PembagianShu.destroy({ where: { anggota_id: id }, transaction });
      await db.Notifikasi.destroy({ where: { user_id: userId }, transaction });

      await anggota.destroy({ transaction });
    } else {
      const pengurus = await Pengurus.findByPk(id, { transaction });
      if (!pengurus) {
        await transaction.rollback();
        return res
          .status(404)
          .json({ success: false, message: "Pengurus tidak ditemukan." });
      }
      userId = pengurus.user_id;
      await pengurus.destroy({ transaction });
    }

    
    await User.destroy({ where: { user_id: userId }, transaction });

    await transaction.commit();

    
    const globalIo = req.app.get("io") || req.io;
    globalIo.emit("user:deleted", { type: type.toLowerCase(), id: String(id) });
    globalIo.emit("dashboardUpdate");
    globalIo.emit("arus-kas-updated");

    return res.status(200).json({
      success: true,
      message: `User ${type} berhasil dihapus.`,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error deleting user:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal menghapus user.",
        error: error.message,
      });
  }
};





const getUserDetail = async (req, res) => {
  const { type, id } = req.params;
  try {
    let result;
    if (type === "anggota") {
      result = await Anggota.findByPk(id, {
        include: [{ model: User, as: "user", attributes: ["email", "role"] }],
      });
    } else {
      result = await Pengurus.findByPk(id, {
        include: [{ model: User, as: "user", attributes: ["email", "role"] }],
      });
    }

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan." });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("❌ Error fetching user detail:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil detail user." });
  }
};









const approveMember = async (req, res) => {
  const { id } = req.params;
  const { action, metode_pembayaran } = req.body; 
  const transaction = await db.sequelize.transaction();

  try {
    const anggota = await Anggota.findByPk(id, {
      include: [{ model: User, as: "user" }],
      transaction,
    });

    if (!anggota) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Data pendaftaran tidak ditemukan." });
    }

    if (anggota.status_keanggotaan !== "Pending") {
      await transaction.rollback();
      return res
        .status(400)
        .json({
          success: false,
          message: "Hanya pendaftaran berstatus Pending yang dapat diproses.",
        });
    }

    if (action !== "terima") {
      await transaction.rollback();
      return res
        .status(400)
        .json({
          success: false,
          message: 'Aksi tidak valid. Hanya aksi "terima" yang diperbolehkan.',
        });
    }

    const gNoAnggota = await generateNoAnggota();
    
    const configPokok = await Konfigurasi.findOne({
      where: { nama_config: "SIMPANAN_POKOK" },
      transaction,
    });
    const nominalPokok = configPokok ? parseFloat(configPokok.nilai) : 100000; 

    await anggota.update(
      {
        status_keanggotaan: "Aktif",
        no_anggota: gNoAnggota,
        tanggal_bergabung: new Date(),
        saldo_pokok: nominalPokok,
        saldo_wajib: 0,
        saldo_sukarela: 0,
        last_updated: new Date(),
      },
      { transaction },
    );

    
    await TransaksiSimpanan.create(
      {
        anggota_id: anggota.anggota_id,
        jenis_simpanan: "Pokok",
        jenis_transaksi: "Setor",
        nominal: nominalPokok,
        tanggal: new Date().toISOString().split("T")[0],
        keterangan: "Simpanan Pokok Awal (Pendaftaran Diterima)",
      },
      { transaction },
    );

    
    await ArusKasService.recordTransaction(
      {
        user_id: anggota.user_id,
        nama_kategori: "Simpanan Pokok",
        jenis: "Debit",
        nominal: nominalPokok,
        keterangan: "Simpanan Pokok Awal (Pendaftaran Diterima)",
        kode_transaksi: `REG-PKK-${anggota.anggota_id}`,
        metode_pembayaran: metode_pembayaran || "CASH",
      },
      { transaction },
      req.io,
    );

    
    await Notifikasi.create(
      {
        user_id: anggota.user_id,
        judul: "Pendaftaran Diterima! 🎉",
        pesan:
          "Selamat! Pendaftaran Anda telah disetujui. Anda sekarang resmi menjadi anggota Koperasi Nichias.",
        tipe: "sistem",
        link: "/dashboard",
        is_read: false,
      },
      { transaction },
    );

    
    const formatRupiah = (val) =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(val);
    await Notifikasi.create(
      {
        user_id: anggota.user_id,
        judul: "Simpanan Pokok Tercatat! 💰",
        pesan: `Simpanan pokok Anda sebesar ${formatRupiah(nominalPokok)} telah otomatis tercatat. Selamat bergabung!`,
        tipe: "simpanan",
        link: "/simpan-pinjam",
        is_read: false,
      },
      { transaction },
    );

    await transaction.commit();

    const updatedAnggota = await Anggota.findByPk(id, {
      include: [{ model: User, as: "user", attributes: ["email", "role"] }],
    });
    const anggotaPlain = updatedAnggota.get({ plain: true });

    if (req.io) {
      req.io.emit("user:updated", { type: "anggota", id, data: anggotaPlain });
      req.io.emit("dashboardUpdate");
      req.io.emit("arus-kas-updated");
    }

    
    console.log(`📤 Emitting member:approved for user_id: ${anggota.user_id}`);
    req.io.emit("member:approved", {
      user_id: anggota.user_id,
      anggota_id: anggota.anggota_id,
      no_anggota: gNoAnggota,
      nama_lengkap: anggota.nama_lengkap,
      status_keanggotaan: "Aktif",
    });

    return res.status(200).json({
      success: true,
      message: "Pendaftaran anggota disetujui!",
      data: updatedAnggota,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("❌ Error approving member:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Terjadi kesalahan saat memproses pendaftaran.",
      });
  }
};





const getProfile = async (req, res) => {
  const { user_id, role } = req.user;
  try {
    let profileData;
    if (role === "Anggota") {
      profileData = await Anggota.findOne({
        where: { user_id },
        include: [
          { model: User, as: "user", attributes: ["email", "role"] },
          {
            model: db.Pinjaman,
            as: "pinjaman",
            include: [
              {
                model: db.Angsuran,
                as: "angsuran",
                separate: true,
                order: [
                  ["tanggal_bayar", "DESC"],
                  ["angsuran_ke", "DESC"],
                ],
              },
            ],
          },
          {
            model: db.PembagianShu,
            as: "pembagianShu",
            include: [
              {
                model: db.RekapShu,
                as: "rekap",
              },
            ],
            required: false,
          },
          {
            model: db.TransaksiSimpanan,
            as: "transaksiSimpanan",
            separate: true,
            order: [
              ["tanggal", "DESC"],
              ["transaksi_id", "DESC"],
            ],
            limit: 20,
          },
        ],
      });
    } else {
      profileData = await Pengurus.findOne({
        where: { user_id },
        include: [{ model: User, as: "user", attributes: ["email", "role"] }],
      });
    }

    if (!profileData) {
      return res
        .status(404)
        .json({ success: false, message: "Profil tidak ditemukan." });
    }

    return res.status(200).json({ success: true, data: profileData });
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengambil data profil." });
  }
};





const updateProfile = async (req, res) => {
  const { user_id, role } = req.user;
  const updateData = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    let result;
    if (role === "Anggota") {
      const anggota = await Anggota.findOne({
        where: { user_id },
        transaction,
      });
      if (!anggota) throw new Error("Anggota tidak ditemukan");

      
      const safeData = {
        no_hp: updateData.no_hp,
        tempat_lahir: updateData.tempat_lahir,
        tanggal_lahir: updateData.tanggal_lahir,
        alamat: updateData.alamat,
        no_rekening_bank: updateData.no_rekening_bank,
      };

      await anggota.update(safeData, { transaction });
      result = await Anggota.findOne({
        where: { user_id },
        include: [{ model: User, as: "user" }],
        transaction,
      });

      req.io.emit("user:updated", {
        type: "anggota",
        id: anggota.anggota_id,
        data: result.get({ plain: true }),
      });
    } else {
      const pengurus = await Pengurus.findOne({
        where: { user_id },
        transaction,
      });
      if (!pengurus) throw new Error("Pengurus tidak ditemukan");

      const safeData = {
        no_hp: updateData.no_hp,
        alamat: updateData.alamat,
      };

      await pengurus.update(safeData, { transaction });
      result = await Pengurus.findOne({
        where: { user_id },
        include: [{ model: User, as: "user" }],
        transaction,
      });

      req.io.emit("user:updated", {
        type: "pengurus",
        id: pengurus.pengurus_id,
        data: result.get({ plain: true }),
      });
    }

    await transaction.commit();
    return res
      .status(200)
      .json({
        success: true,
        message: "Profil berhasil diperbarui.",
        data: result,
      });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error updating profile:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Gagal memperbarui profil.",
        error: error.message,
      });
  }
};





const changePassword = async (req, res) => {
  const { user_id } = req.user;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Password lama dan baru wajib diisi." });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res
      .status(400)
      .json({
        success: false,
        message:
          "Password minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol.",
      });
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan." });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Password lama tidak sesuai." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    return res
      .status(200)
      .json({ success: true, message: "Password berhasil diubah!" });
  } catch (error) {
    console.error("❌ Error changing password:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengubah password." });
  }
};





const uploadProfilePhoto = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Tidak ada file yang diupload." });
  }

  const { user_id, role } = req.user;
  const photoPath = `/uploads/profiles/${req.file.filename}`;

  try {
    let result;
    if (role === "Anggota") {
      const anggota = await Anggota.findOne({ where: { user_id } });
      if (!anggota)
        return res
          .status(404)
          .json({ success: false, message: "Anggota tidak ditemukan." });

      await anggota.update({ foto_profil: photoPath });
      result = await Anggota.findOne({
        where: { user_id },
        include: [{ model: User, as: "user" }],
      });
      req.io.emit("user:photoUpdated", {
        type: "anggota",
        id: anggota.anggota_id,
        data: result.get({ plain: true }),
      });
      req.io.emit("user:updated", {
        type: "anggota",
        id: anggota.anggota_id,
        data: result.get({ plain: true }),
      });
    } else {
      const pengurus = await Pengurus.findOne({ where: { user_id } });
      if (!pengurus)
        return res
          .status(404)
          .json({ success: false, message: "Pengurus tidak ditemukan." });

      await pengurus.update({ foto_profil: photoPath });
      result = await Pengurus.findOne({
        where: { user_id },
        include: [{ model: User, as: "user" }],
      });
      req.io.emit("user:photoUpdated", {
        type: "pengurus",
        id: pengurus.pengurus_id,
        data: result.get({ plain: true }),
      });
      req.io.emit("user:updated", {
        type: "pengurus",
        id: pengurus.pengurus_id,
        data: result.get({ plain: true }),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Foto profil berhasil diupload.",
      data: result,
      foto_profil: photoPath,
    });
  } catch (error) {
    console.error("❌ Error uploading profile photo:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal mengupload foto profil." });
  }
};

const getSecretaryContact = async (req, res) => {
  try {
    const secretary = await Pengurus.findOne({
      where: { jabatan: "Sekretaris" },
      attributes: ["nama_lengkap", "no_hp"],
    });

    if (!secretary) {
      return res.status(404).json({
        success: false,
        message: "Kontak sekretaris tidak ditemukan.",
      });
    }

    return res.status(200).json({
      success: true,
      data: secretary,
    });
  } catch (error) {
    console.error("❌ Error fetching secretary contact:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil kontak sekretaris.",
    });
  }
};

module.exports = {
  getAnggotaList,
  getPengurusList,
  updateUser,
  deleteUser,
  getUserDetail,
  approveMember,
  getProfile,
  updateProfile,
  changePassword,
  uploadProfilePhoto,
  requestKeluar,
  cancelKeluar,
  approveKeluar,
  getSecretaryContact,
};
