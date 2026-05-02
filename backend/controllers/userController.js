const db = require('../models');
const { generateNoAnggota } = require('../utils/idGenerator');
const bcrypt = require('bcrypt');
const User = db.User;
const Anggota = db.Anggota;
const Pengurus = db.Pengurus;
const Notifikasi = db.Notifikasi;
const Simpanan = db.Simpanan;
const TransaksiSimpanan = db.TransaksiSimpanan;
const Konfigurasi = db.Konfigurasi;
const Pinjaman = db.Pinjaman;
const { Op } = require('sequelize');

/**
 * POST /api/user/anggota/request-keluar
 * Anggota mengajukan pengunduran diri
 */
const requestKeluar = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { user_id } = req.user;
    const { alasan_keluar } = req.body;

    const anggota = await Anggota.findOne({ 
      where: { user_id },
      transaction
    });

    if (!anggota) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Data anggota tidak ditemukan.' });
    }

    // Cek hutang: Pinjaman yang belum lunas
    const activeLoans = await Pinjaman.findAll({
      where: {
        anggota_id: anggota.anggota_id,
        status: ['Approved', 'Pending'], // Pending juga dicek agar tidak kabur saat ada pengajuan
        sisa_tagihan: { [Op.gt]: 0 }
      },
      transaction
    });

    if (activeLoans.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Anda tidak dapat mengajukan keluar karena masih memiliki pinjaman aktif atau sisa tagihan.' 
      });
    }

    await anggota.update({
      status_keanggotaan: 'Pending_Keluar',
      alasan_keluar
    }, { transaction });

    // Buat notifikasi untuk Sekretaris
    const secretaryUsers = await User.findAll({ where: { role: 'Sekretaris' }, transaction });
    for (const secretary of secretaryUsers) {
      await Notifikasi.create({
        user_id: secretary.user_id,
        judul: 'Pengajuan Keluar Anggota 🚪',
        pesan: `${anggota.nama_lengkap} telah mengajukan pengunduran diri dari koperasi.`,
        tipe: 'anggota',
        link: `/admin/users?review_keluar=${anggota.anggota_id}`,
        is_read: false
      }, { transaction });
    }

    await transaction.commit();

    if (req.io) {
      req.io.emit('user:updated', { 
        type: 'Anggota', 
        id: anggota.anggota_id, 
        data: { status_keanggotaan: 'Pending_Keluar', alasan_keluar } 
      });
      
      // Emit real-time notification for management
      req.io.emit('notifikasi:anggota-keluar', {
        user_id: user_id, // Pengirim
        notifikasi: {
          judul: 'Pengajuan Keluar Anggota 🚪',
          pesan: `${anggota.nama_lengkap} telah mengajukan pengunduran diri.`,
          tipe: 'anggota',
          link: `/admin/users?review_keluar=${anggota.anggota_id}`
        }
      });

      req.io.emit('dashboardUpdate');
    }

    res.status(200).json({ success: true, message: 'Pengajuan pengunduran diri berhasil dikirim.' });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Error request keluar:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/user/anggota/cancel-keluar
 * Anggota membatalkan pengajuan keluar
 */
const cancelKeluar = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { user_id } = req.user;

    const anggota = await Anggota.findOne({ 
      where: { user_id },
      transaction
    });

    if (!anggota) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Data anggota tidak ditemukan.' });
    }

    if (anggota.status_keanggotaan !== 'Pending_Keluar') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Anggota tidak sedang dalam status pengajuan keluar.' });
    }

    await anggota.update({
      status_keanggotaan: 'Aktif',
      alasan_keluar: null
    }, { transaction });

    await transaction.commit();

    if (req.io) {
      req.io.emit('user:updated', { 
        type: 'Anggota', 
        id: anggota.anggota_id, 
        data: { status_keanggotaan: 'Aktif', alasan_keluar: null } 
      });
      req.io.emit('dashboardUpdate');
    }

    res.status(200).json({ success: true, message: 'Pengajuan pengunduran diri berhasil dibatalkan.' });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Error cancel keluar:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/user/anggota/approve-keluar
 * Sekretaris menyetujui pengunduran diri anggota
 */
const approveKeluar = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { anggota_id } = req.body;

    const anggota = await Anggota.findOne({ 
      where: { anggota_id },
      include: [{ model: User, as: 'user' }],
      transaction
    });

    if (!anggota) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Data anggota tidak ditemukan.' });
    }

    await anggota.update({
      status_keanggotaan: 'Keluar'
    }, { transaction });

    // Buat notifikasi untuk Anggota
    await Notifikasi.create({
      user_id: anggota.user_id,
      judul: 'Pengajuan Keluar Disetujui ✅',
      pesan: `Pengajuan pengunduran diri Anda telah disetujui. Terima kasih atas kontribusi Anda di Koperasi Nichias.`,
      tipe: 'anggota',
      link: '/dashboard/keluar',
      is_read: false
    }, { transaction });

    await transaction.commit();

    if (req.io) {
      req.io.emit('user:updated', { 
        type: 'Anggota', 
        id: anggota.anggota_id, 
        data: { status_keanggotaan: 'Keluar' } 
      });
      req.io.emit('dashboardUpdate');
    }

    res.status(200).json({ success: true, message: 'Pengajuan pengunduran diri berhasil disetujui.' });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Error approve keluar:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/user/anggota
 * Mengambil daftar seluruh anggota beserta data user-nya.
 */
const getAnggotaList = async (req, res) => {
  try {
    const anggota = await Anggota.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'role']
        },
      ],
      order: [['tanggal_registrasi', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: anggota,
    });
  } catch (error) {
    console.error('❌ Error fetching anggota list:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar anggota.',
      error: error.message,
    });
  }
};

/**
 * GET /api/user/pengurus
 * Mengambil daftar seluruh pengurus jajaran manajemen.
 */
const getPengurusList = async (req, res) => {
  try {
    const pengurus = await Pengurus.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'role']
        },
      ],
      order: [['jabatan', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: pengurus,
    });
  } catch (error) {
    console.error('❌ Error fetching pengurus list:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar pengurus.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/user/:type/:id
 * Mengupdate data user (Anggota atau Pengurus).
 */
const updateUser = async (req, res) => {
  const { type, id } = req.params; // type: 'anggota' atau 'pengurus'
  const updateData = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    let result;
    if (type === 'anggota') {
      const anggota = await Anggota.findByPk(id, { transaction });
      if (!anggota) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Anggota tidak ditemukan.' });
      }
      await anggota.update(updateData, { transaction });
      
      // Update email/role di tabel User jika diperlukan
      if (updateData.email || updateData.role) {
        await User.update(
          { email: updateData.email, role: updateData.role },
          { where: { user_id: anggota.user_id }, transaction }
        );
      }
      result = anggota;
    } else {
      const pengurus = await Pengurus.findByPk(id, { transaction });
      if (!pengurus) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Pengurus tidak ditemukan.' });
      }

      // Sinkronisasi jabatan dengan role jika role diubah
      if (updateData.role && !updateData.jabatan) {
        updateData.jabatan = updateData.role;
      }

      await pengurus.update(updateData, { transaction });

      // Update email/role/jabatan di tabel User
      if (updateData.email || updateData.role) {
        await User.update(
          { email: updateData.email, role: updateData.role },
          { where: { user_id: pengurus.user_id }, transaction }
        );
      }
      result = pengurus;
    }

    await transaction.commit();

    // Emit event real-time
    req.io.emit('user:updated', { type, id, data: result });
    req.io.emit('dashboardUpdate');

    return res.status(200).json({
      success: true,
      message: `Data ${type} berhasil diupdate.`,
      data: result
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error updating user:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengupdate data.', error: error.message });
  }
};

/**
 * DELETE /api/user/:type/:id
 * Menghapus data user secara permanen.
 */
const deleteUser = async (req, res) => {
  const { type, id } = req.params;
  const transaction = await db.sequelize.transaction();

  try {
    let userId;
    if (type === 'anggota') {
      const anggota = await Anggota.findByPk(id, { transaction });
      if (!anggota) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Anggota tidak ditemukan.' });
      }
      userId = anggota.user_id;

      // Hapus data terkait di tabel lain (Cascade manual)
      await db.TransaksiSimpanan.destroy({ where: { anggota_id: id }, transaction });
      await db.Simpanan.destroy({ where: { anggota_id: id }, transaction });
      
      // Ambil ID pinjaman untuk menghapus angsuran
      const pinjamanList = await db.Pinjaman.findAll({ where: { anggota_id: id }, attributes: ['pinjaman_id'], transaction });
      const pinjamanIds = pinjamanList.map(p => p.pinjaman_id);
      
      if (pinjamanIds.length > 0) {
        await db.Angsuran.destroy({ where: { pinjaman_id: pinjamanIds }, transaction });
        await db.Pinjaman.destroy({ where: { anggota_id: id }, transaction });
      }

      await db.PembagianShu.destroy({ where: { anggota_id: id }, transaction });
      await db.Notifikasi.destroy({ where: { user_id: userId }, transaction });

      await anggota.destroy({ transaction });
    } else {
      const pengurus = await Pengurus.findByPk(id, { transaction });
      if (!pengurus) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Pengurus tidak ditemukan.' });
      }
      userId = pengurus.user_id;
      await pengurus.destroy({ transaction });
    }

    // Hapus juga data login-nya
    await User.destroy({ where: { user_id: userId }, transaction });

    await transaction.commit();

    // Emit event real-time
    req.io.emit('user:deleted', { type, id });
    req.io.emit('dashboardUpdate');

    return res.status(200).json({
      success: true,
      message: `User ${type} berhasil dihapus.`,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error deleting user:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus user.', error: error.message });
  }
};

/**
 * GET /api/user/:type/:id
 * Mengambil detail satu user.
 */
const getUserDetail = async (req, res) => {
  const { type, id } = req.params;
  try {
    let result;
    if (type === 'anggota') {
      result = await Anggota.findByPk(id, {
        include: [{ model: User, as: 'user', attributes: ['email', 'role'] }]
      });
    } else {
      result = await Pengurus.findByPk(id, {
        include: [{ model: User, as: 'user', attributes: ['email', 'role'] }]
      });
    }

    if (!result) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Error fetching user detail:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail user.' });
  }
};

/**
 * PUT /api/user/approve/:id
 * Menyetujui pendaftaran anggota (hanya aksi terima).
 * - Update status ke 'Aktif'
 * - Generate no_anggota
 * - Buat notifikasi untuk anggota yang diterima
 * - Emit member:approved event via Socket.IO
 */
const approveMember = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // hanya 'terima'
  const transaction = await db.sequelize.transaction();

  try {
    const anggota = await Anggota.findByPk(id, {
      include: [{ model: User, as: 'user' }],
      transaction
    });

    if (!anggota) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Data pendaftaran tidak ditemukan.' });
    }

    if (anggota.status_keanggotaan !== 'Pending') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Hanya pendaftaran berstatus Pending yang dapat diproses.' });
    }

    if (action !== 'terima') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Aksi tidak valid. Hanya aksi "terima" yang diperbolehkan.' });
    }

    const gNoAnggota = await generateNoAnggota();
    await anggota.update({
      status_keanggotaan: 'Aktif',
      no_anggota: gNoAnggota,
      tanggal_bergabung: new Date()
    }, { transaction });

    // --- AUTO-GENERATE SIMPANAN POKOK ---
    // Ambil nominal simpanan pokok dari konfigurasi
    const configPokok = await Konfigurasi.findOne({ 
      where: { nama_config: 'SIMPANAN_POKOK' },
      transaction 
    });
    const nominalPokok = configPokok ? parseFloat(configPokok.nilai) : 100000; // default 100rb jika tidak ada config

    // 1. Buat record Simpanan
    const newSimpanan = await Simpanan.create({
      anggota_id: anggota.anggota_id,
      saldo_pokok: nominalPokok,
      saldo_wajib: 0,
      saldo_sukarela: 0,
      last_updated: new Date()
    }, { transaction });

    // 2. Buat record TransaksiSimpanan (Setoran Pokok Awal)
    await TransaksiSimpanan.create({
      anggota_id: anggota.anggota_id,
      jenis_simpanan: 'Pokok',
      jenis_transaksi: 'Setor',
      nominal: nominalPokok,
      tanggal: new Date().toISOString().split('T')[0],
      keterangan: 'Setoran Pokok Awal (Pendaftaran Diterima)'
    }, { transaction });

    // 3. Buat notifikasi pendaftaran diterima
    await Notifikasi.create({
      user_id: anggota.user_id,
      judul: 'Pendaftaran Diterima! 🎉',
      pesan: 'Selamat! Pendaftaran Anda telah disetujui. Anda sekarang resmi menjadi anggota Koperasi Nichias.',
      tipe: 'sistem',
      link: '/dashboard',
      is_read: false,
    }, { transaction });

    // 4. Buat notifikasi kedua khusus simpanan pokok
    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    await Notifikasi.create({
      user_id: anggota.user_id,
      judul: 'Simpanan Pokok Tercatat! 💰',
      pesan: `Simpanan pokok Anda sebesar ${formatRupiah(nominalPokok)} telah otomatis tercatat. Selamat bergabung!`,
      tipe: 'simpanan',
      link: '/simpan-pinjam',
      is_read: false,
    }, { transaction });

    await transaction.commit();

    const updatedAnggota = await Anggota.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['email', 'role'] }]
    });
    const anggotaPlain = updatedAnggota.get({ plain: true });

    if (req.io) {
        req.io.emit('user:updated', { type: 'anggota', id, data: anggotaPlain });
        req.io.emit('dashboardUpdate');
    }

    // Emit member:approved untuk notifikasi ke user yang diterima
    console.log(`📤 Emitting member:approved for user_id: ${anggota.user_id}`);
    req.io.emit('member:approved', {
      user_id: anggota.user_id,
      anggota_id: anggota.anggota_id,
      no_anggota: gNoAnggota,
      nama_lengkap: anggota.nama_lengkap,
      status_keanggotaan: 'Aktif',
    });

    return res.status(200).json({
      success: true,
      message: 'Pendaftaran anggota disetujui!',
      data: updatedAnggota
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('❌ Error approving member:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat memproses pendaftaran.' });
  }
};

/**
 * GET /api/user/profile
 * Mendapatkan profil pengguna yang sedang login.
 */
const getProfile = async (req, res) => {
  const { user_id, role } = req.user;
  try {
    let profileData;
    if (role === 'Anggota') {
      profileData = await Anggota.findOne({
        where: { user_id },
        include: [
          { model: User, as: 'user', attributes: ['email', 'role'] },
          { model: db.Simpanan, as: 'simpanan' },
          { 
            model: db.Pinjaman, 
            as: 'pinjaman',
            include: [{ 
              model: db.Angsuran, 
              as: 'angsuran',
              separate: true,
              order: [['tanggal_bayar', 'DESC'], ['angsuran_ke', 'DESC']]
            }]
          },
          { model: db.PembagianShu, as: 'pembagianShu' },
          { 
            model: db.TransaksiSimpanan, 
            as: 'transaksiSimpanan',
            separate: true,
            order: [['tanggal', 'DESC'], ['transaksi_id', 'DESC']],
            limit: 20
          }
        ]
      });
    } else {
      profileData = await Pengurus.findOne({
        where: { user_id },
        include: [{ model: User, as: 'user', attributes: ['email', 'role'] }]
      });
    }

    if (!profileData) {
      return res.status(404).json({ success: false, message: 'Profil tidak ditemukan.' });
    }

    return res.status(200).json({ success: true, data: profileData });
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data profil.' });
  }
};

/**
 * PUT /api/user/profile
 * Mengupdate data profil pengguna yang sedang login.
 */
const updateProfile = async (req, res) => {
  const { user_id, role } = req.user;
  const updateData = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    let result;
    if (role === 'Anggota') {
      const anggota = await Anggota.findOne({ where: { user_id }, transaction });
      if (!anggota) throw new Error('Anggota tidak ditemukan');
      
      // Keamanan: Cuma field tertentu yang boleh diubah secara mandiri
      const safeData = {
        no_hp: updateData.no_hp,
        tempat_lahir: updateData.tempat_lahir,
        tanggal_lahir: updateData.tanggal_lahir,
        alamat: updateData.alamat,
        no_rekening_bank: updateData.no_rekening_bank
      };
      
      await anggota.update(safeData, { transaction });
      result = await Anggota.findOne({ where: { user_id }, include: [{ model: User, as: 'user' }], transaction });
      
      req.io.emit('user:updated', { type: 'anggota', id: anggota.anggota_id, data: result.get({ plain: true }) });
    } else {
      const pengurus = await Pengurus.findOne({ where: { user_id }, transaction });
      if (!pengurus) throw new Error('Pengurus tidak ditemukan');

      const safeData = {
        no_hp: updateData.no_hp,
        alamat: updateData.alamat,
      };

      await pengurus.update(safeData, { transaction });
      result = await Pengurus.findOne({ where: { user_id }, include: [{ model: User, as: 'user' }], transaction });

      req.io.emit('user:updated', { type: 'pengurus', id: pengurus.pengurus_id, data: result.get({ plain: true }) });
    }

    await transaction.commit();
    return res.status(200).json({ success: true, message: 'Profil berhasil diperbarui.', data: result });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error updating profile:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui profil.', error: error.message });
  }
};

/**
 * PUT /api/user/profile/password
 * Mengganti password pengguna yang sedang login.
 */
const changePassword = async (req, res) => {
  const { user_id } = req.user;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi.' });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ success: false, message: 'Password minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan simbol.' });
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Password lama tidak sesuai.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    return res.status(200).json({ success: true, message: 'Password berhasil diubah!' });
  } catch (error) {
    console.error('❌ Error changing password:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengubah password.' });
  }
};

/**
 * POST /api/user/profile/photo
 * Upload foto profil
 */
const uploadProfilePhoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Tidak ada file yang diupload.' });
  }

  const { user_id, role } = req.user;
  const photoPath = `/uploads/profiles/${req.file.filename}`;

  try {
    let result;
    if (role === 'Anggota') {
      const anggota = await Anggota.findOne({ where: { user_id } });
      if (!anggota) return res.status(404).json({ success: false, message: 'Anggota tidak ditemukan.' });
      
      await anggota.update({ foto_profil: photoPath });
      result = await Anggota.findOne({ where: { user_id }, include: [{ model: User, as: 'user' }] });
      req.io.emit('user:photoUpdated', { type: 'anggota', id: anggota.anggota_id, data: result.get({ plain: true }) });
      req.io.emit('user:updated', { type: 'anggota', id: anggota.anggota_id, data: result.get({ plain: true }) });
    } else {
      const pengurus = await Pengurus.findOne({ where: { user_id } });
      if (!pengurus) return res.status(404).json({ success: false, message: 'Pengurus tidak ditemukan.' });
      
      await pengurus.update({ foto_profil: photoPath });
      result = await Pengurus.findOne({ where: { user_id }, include: [{ model: User, as: 'user' }] });
      req.io.emit('user:photoUpdated', { type: 'pengurus', id: pengurus.pengurus_id, data: result.get({ plain: true }) });
      req.io.emit('user:updated', { type: 'pengurus', id: pengurus.pengurus_id, data: result.get({ plain: true }) });
    }

    return res.status(200).json({
      success: true,
      message: 'Foto profil berhasil diupload.',
      data: result,
      foto_profil: photoPath
    });
  } catch (error) {
    console.error('❌ Error uploading profile photo:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengupload foto profil.' });
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
  approveKeluar
};
