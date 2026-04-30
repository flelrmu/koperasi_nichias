const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { generateNoAnggota } = require('../utils/idGenerator');

const User = db.User;
const Anggota = db.Anggota;
const Pengurus = db.Pengurus;
const Notifikasi = db.Notifikasi;

/**
 * POST /api/auth/register
 * Mendaftarkan calon anggota baru.
 * - Validasi email domain @koperasi-nichias.co.id
 * - Validasi password complexity
 * - Cek status email existing (Aktif/Pending)
 * - Jika baru → INSERT ke tabel users & anggota
 * - Kirim notifikasi ke semua Sekretaris via Socket.IO
 */
const register = async (req, res) => {
  const {
    email,
    password,
    nama_lengkap,
    no_identitas,
    tempat_lahir,
    tanggal_lahir,
    jabatan,
    divisi,
    no_hp,
    no_rekening_bank,
    alamat,
  } = req.body;

  // Validasi field wajib (Semua 11 field harus diisi)
  if (
    !email || 
    !password || 
    !nama_lengkap || 
    !no_identitas || 
    !tempat_lahir || 
    !tanggal_lahir || 
    !jabatan || 
    !divisi || 
    !no_hp || 
    !no_rekening_bank || 
    !alamat
  ) {
    return res.status(400).json({
      success: false,
      message: 'Semua data (11 field) wajib diisi lengkap.',
    });
  }

  // Validasi domain email: harus @koperasi-nichias.co.id
  const emailDomainRegex = /^[^\s@]+@koperasi-nichias\.co\.id$/i;
  if (!emailDomainRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email harus menggunakan domain @koperasi-nichias.co.id',
    });
  }

  // Validasi password complexity: min 8 char, huruf besar, huruf kecil, angka, simbol
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password minimal 8 karakter, harus mengandung huruf besar, huruf kecil, angka, dan simbol.',
    });
  }

  // Gunakan transaction untuk menjaga konsistensi data
  const transaction = await db.sequelize.transaction();

  try {
    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({
      where: { email },
      include: [{ model: Anggota, as: 'anggota' }],
      transaction,
    });

    if (existingUser) {
      const status = existingUser.anggota?.status_keanggotaan;

      // Jika statusnya 'Aktif' → Tolak
      if (status === 'Aktif') {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: 'Email sudah terdaftar dan aktif.',
        });
      }

      // Jika statusnya 'Pending' → Tolak
      if (status === 'Pending') {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: 'Pendaftaran Anda sedang diproses, harap tunggu.',
        });
      }

      // Status lainnya (Keluar, dll) → Tolak
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar. Silakan hubungi pengurus koperasi.',
      });
    }

    // Cek apakah no_identitas sudah terdaftar (jika diisi)
    if (no_identitas) {
      const existingAnggota = await Anggota.findOne({ where: { no_identitas }, transaction });
      if (existingAnggota) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: 'Nomor identitas sudah terdaftar.',
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Insert ke tabel users
    const newUser = await User.create(
      {
        email,
        password: hashedPassword,
        role: 'Anggota',
      },
      { transaction }
    );

    // 2. Insert ke tabel anggota
    const newAnggota = await Anggota.create(
      {
        user_id: newUser.user_id,
        nama_lengkap,
        no_identitas: no_identitas || null,
        tempat_lahir: tempat_lahir || null,
        tanggal_lahir: tanggal_lahir || null,
        jabatan,
        divisi,
        no_hp: no_hp || null,
        no_rekening_bank: no_rekening_bank || null,
        alamat: alamat || null,
        status_keanggotaan: 'Pending',
      },
      { transaction }
    );

    // 3. Buat notifikasi untuk semua Sekretaris
    const sekretarisList = await User.findAll({
      where: { role: 'Sekretaris' },
      attributes: ['user_id'],
      transaction,
    });

    const notifJudul = 'Pendaftaran Baru';
    const notifPesan = `${nama_lengkap} (${divisi}) telah mendaftar sebagai calon anggota koperasi.`;
    const notifLink = `/admin/users?highlight=${newAnggota.anggota_id}`;

    const notifikasiRecords = sekretarisList.map(s => ({
      user_id: s.user_id,
      judul: notifJudul,
      pesan: notifPesan,
      tipe: 'pendaftaran',
      link: notifLink,
      is_read: false,
    }));

    if (notifikasiRecords.length > 0) {
      await Notifikasi.bulkCreate(notifikasiRecords, { transaction });
    }

    // Commit transaction
    await transaction.commit();

    // 4. Fetch full data from DB for complete socket payload
    const fullAnggota = await Anggota.findByPk(newAnggota.anggota_id, {
      include: [{ model: User, as: 'user', attributes: ['email', 'role'] }]
    });
    const anggotaPlain = fullAnggota.get({ plain: true });

    // 5. Emit Socket.IO event untuk notifikasi real-time
    const notifPayload = {
      notifikasi: {
        judul: notifJudul,
        pesan: notifPesan,
        tipe: 'pendaftaran',
        link: notifLink,
        created_at: new Date().toISOString(),
      },
      anggota: anggotaPlain,
    };

    console.log(`📤 Emitting notifikasi:pendaftaran-baru for ${nama_lengkap}`);
    req.io.emit('notifikasi:pendaftaran-baru', notifPayload);

    // Emit dashboard update for real-time stats
    req.io.emit('dashboardUpdate');

    // Emit juga user:created agar UserManagement table auto-update
    console.log(`📤 Emitting user:created for ${nama_lengkap}`);
    req.io.emit('user:created', {
      type: 'anggota',
      user: anggotaPlain,
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: newUser.user_id,
        email: newUser.email,
        role: newUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil diajukan!',
      data: {
        token,
        user: {
          user_id: newUser.user_id,
          email: newUser.email,
          role: newUser.role,
          nama_lengkap: newAnggota.nama_lengkap,
          status_keanggotaan: newAnggota.status_keanggotaan,
          foto_profil: newAnggota.foto_profil || null,
        },
      },
    });
  } catch (error) {
    // Rollback jika terjadi error
    await transaction.rollback();
    console.error('❌ Error pada registrasi:', error);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * POST /api/auth/login
 * Login untuk semua role (Anggota & Pengurus).
 * - Cek email + password
 * - Generate JWT token
 * - Response berisi redirect path berdasarkan role & status
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email dan password wajib diisi.',
    });
  }

  try {
    // Cari user berdasarkan email
    const user = await User.findOne({
      where: { email },
      include: [
        { model: Anggota, as: 'anggota' },
        { model: Pengurus, as: 'pengurus' },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    // Bandingkan password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Tentukan redirect path dan data user berdasarkan role
    let redirectPath = '/dashboard';
    let nama_lengkap = '';
    let status_keanggotaan = null;
    let foto_profil = null;

    if (user.role === 'Anggota') {
      nama_lengkap = user.anggota?.nama_lengkap || '';
      status_keanggotaan = user.anggota?.status_keanggotaan || 'Pending';
      foto_profil = user.anggota?.foto_profil || null;

      switch (status_keanggotaan) {
        case 'Pending':
          redirectPath = '/dashboard/pending';
          break;
        case 'Aktif':
        case 'Pending_Keluar':
          redirectPath = '/dashboard';
          break;
        case 'Keluar':
          redirectPath = '/dashboard/keluar';
          break;
        default:
          redirectPath = '/dashboard';
      }
    } else {
      // Pengurus (Ketua, Wakil_Ketua, Sekretaris, Bendahara, Koordinator_Simpan_Pinjam)
      nama_lengkap = user.pengurus?.nama_lengkap || '';
      foto_profil = user.pengurus?.foto_profil || null;
      redirectPath = '/admin/dashboard';
    }

    return res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      data: {
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
          nama_lengkap,
          status_keanggotaan,
          foto_profil,
          anggota_id: user.anggota?.anggota_id || null,
          pengurus_id: user.pengurus?.pengurus_id || null,
        },
        redirectPath,
      },
    });
  } catch (error) {
    console.error('❌ Error pada login:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * POST /api/auth/admin/create-user
 * Membuat user baru oleh admin/pengurus.
 */
const adminCreateUser = async (req, res) => {
  const {
    type, // 'Anggota' atau 'Pengurus'
    email,
    password,
    nama_lengkap,
    // Field khusus Anggota
    no_identitas,
    tempat_lahir,
    tanggal_lahir,
    jabatan,
    divisi,
    no_hp,
    no_rekening_bank,
    alamat,
    // Field khusus Pengurus
    role, // e.g., 'Sekretaris', 'Bendahara'
  } = req.body;

  // ... (Validasi tetap sama)
  if (!email || !password || !nama_lengkap || !type) {
    return res.status(400).json({ success: false, message: 'Field email, password, nama lengkap, dan tipe user wajib diisi.' });
  }

  const transaction = await db.sequelize.transaction();

  try {
    const existingUser = await User.findOne({ where: { email }, transaction });
    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: type === 'Pengurus' ? role : 'Anggota',
    }, { transaction });

    let detailInstance;
    if (type === 'Anggota') {
      const gNoAnggota = await generateNoAnggota();
      detailInstance = await Anggota.create({
        user_id: newUser.user_id,
        nama_lengkap,
        no_anggota: gNoAnggota,
        no_identitas,
        tempat_lahir: tempat_lahir || null,
        tanggal_lahir: tanggal_lahir || null,
        jabatan,
        divisi,
        no_hp: no_hp || null,
        no_rekening_bank: no_rekening_bank || null,
        alamat: alamat || null,
        status_keanggotaan: 'Aktif',
        tanggal_bergabung: new Date(),
      }, { transaction });

      // --- AUTO-GENERATE SIMPANAN POKOK (SAME AS APPROVE) ---
      const configPokok = await db.Konfigurasi.findOne({ 
        where: { nama_config: 'SIMPANAN_POKOK' },
        transaction 
      });
      const nominalPokok = configPokok ? parseFloat(configPokok.nilai) : 100000;

      await db.Simpanan.create({
        anggota_id: detailInstance.anggota_id,
        saldo_pokok: nominalPokok,
        saldo_wajib: 0,
        saldo_sukarela: 0,
        last_updated: new Date()
      }, { transaction });

      await db.TransaksiSimpanan.create({
        anggota_id: detailInstance.anggota_id,
        jenis_simpanan: 'Pokok',
        jenis_transaksi: 'Setor',
        nominal: nominalPokok,
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: 'Setoran Pokok Awal (Dibuat oleh Admin)'
      }, { transaction });
    } else {
      detailInstance = await Pengurus.create({
        user_id: newUser.user_id,
        nama_lengkap,
        jabatan: role,
        no_hp: no_hp || null,
        alamat: alamat || null,
      }, { transaction });
    }

    await transaction.commit();

    // Ambil data LENGKAP untuk emit & response
    let fullData;
    if (type.toLowerCase() === 'anggota') {
      fullData = await Anggota.findByPk(detailInstance.anggota_id, {
        include: [{ model: User, as: 'user', attributes: ['email', 'role'] }]
      });
    } else {
      fullData = await Pengurus.findByPk(detailInstance.pengurus_id, {
        include: [{ model: User, as: 'user', attributes: ['email', 'role'] }]
      });
    }

    // Ubah ke JSON murni & pastikan casing konsisten (lowercase)
    const socketPayload = { 
      type: type.toLowerCase(), 
      user: fullData.get({ plain: true }) 
    };

    console.log(`📤 Emitting user:created event for ${socketPayload.type}:`, socketPayload.user.nama_lengkap);

    // Emit event real-time dengan data lengkap
    req.io.emit('user:created', socketPayload);

    // Emit dashboard update for real-time stats
    req.io.emit('dashboardUpdate');

    // Emit simpanan:created if member was created
    if (type.toLowerCase() === 'anggota') {
      const newSimpanan = await db.Simpanan.findOne({
        where: { anggota_id: detailInstance.anggota_id },
        include: [{ 
          model: Anggota, 
          as: 'anggota',
          include: [{ model: User, as: 'user', attributes: ['email'] }]
        }]
      });
      req.io.emit('simpanan:created', newSimpanan);
    }

    return res.status(201).json({
      success: true,
      message: `User ${type} berhasil dibuat.`,
      data: socketPayload.user
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Nomor Identitas atau Email sudah digunakan.' });
    }
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat membuat user.', error: error.message });
  }
};

module.exports = { register, login, adminCreateUser };
