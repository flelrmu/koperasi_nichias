const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');

const User = db.User;
const Anggota = db.Anggota;
const Pengurus = db.Pengurus;

/**
 * POST /api/auth/register
 * Mendaftarkan calon anggota baru.
 * - Validasi email domain @koperasi-nichias.co.id
 * - Validasi password complexity
 * - Cek status email existing (Aktif/Pending/Ditolak)
 * - Jika Ditolak → UPDATE data lama, status kembali Pending
 * - Jika baru → INSERT ke tabel users & anggota
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

  // Validasi field wajib
  if (!email || !password || !nama_lengkap || !jabatan || !divisi) {
    return res.status(400).json({
      success: false,
      message: 'Field email, password, nama lengkap, jabatan, dan divisi wajib diisi.',
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

      // Jika statusnya 'Ditolak' → UPDATE data lama
      if (status === 'Ditolak') {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user
        await existingUser.update(
          { password: hashedPassword },
          { transaction }
        );

        // Update anggota
        await existingUser.anggota.update(
          {
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
            tanggal_registrasi: new Date(),
            tanggal_bergabung: null,
            no_anggota: null,
          },
          { transaction }
        );

        await transaction.commit();

        // Generate JWT token
        const token = jwt.sign(
          {
            user_id: existingUser.user_id,
            email: existingUser.email,
            role: existingUser.role,
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.status(200).json({
          success: true,
          message: 'Pendaftaran ulang berhasil! Data Anda telah diperbarui.',
          data: {
            token,
            user: {
              user_id: existingUser.user_id,
              email: existingUser.email,
              role: existingUser.role,
              nama_lengkap,
              status_keanggotaan: 'Pending',
            },
          },
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

    // Commit transaction
    await transaction.commit();

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

    if (user.role === 'Anggota') {
      nama_lengkap = user.anggota?.nama_lengkap || '';
      status_keanggotaan = user.anggota?.status_keanggotaan || 'Pending';

      switch (status_keanggotaan) {
        case 'Pending':
          redirectPath = '/dashboard/pending';
          break;
        case 'Ditolak':
          redirectPath = '/dashboard/ditolak';
          break;
        case 'Aktif':
          redirectPath = '/dashboard';
          break;
        case 'Keluar':
          return res.status(403).json({
            success: false,
            message: 'Akun Anda sudah tidak aktif. Silakan hubungi pengurus koperasi.',
          });
        default:
          redirectPath = '/dashboard';
      }
    } else {
      // Pengurus (Ketua, Wakil_Ketua, Sekretaris, Bendahara, Koordinator_Simpan_Pinjam)
      nama_lengkap = user.pengurus?.nama_lengkap || '';
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

module.exports = { register, login };
