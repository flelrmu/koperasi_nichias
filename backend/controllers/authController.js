const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { generateNoAnggota } = require('../utils/idGenerator');
const ArusKasService = require('../services/ArusKasService');

const User = db.User;
const Anggota = db.Anggota;
const Pengurus = db.Pengurus;
const Notifikasi = db.Notifikasi;

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
  
  const emailDomainRegex = /^[^\s@]+@koperasi-nichias\.co\.id$/i;
  if (!emailDomainRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email harus menggunakan domain @koperasi-nichias.co.id',
    });
  }
  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password minimal 8 karakter, harus mengandung huruf besar, huruf kecil, angka, dan simbol.',
    });
  }
  
  const transaction = await db.sequelize.transaction();

  try {
    
    const existingUser = await User.findOne({
      where: { email },
      include: [{ model: Anggota, as: 'anggota' }],
      transaction,
    });

    if (existingUser) {
      const status = existingUser.anggota?.status_keanggotaan;

      
      if (status === 'Aktif') {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: 'Email sudah terdaftar dan aktif.',
        });
      }

      
      if (status === 'Pending') {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: 'Pendaftaran Anda sedang diproses, harap tunggu.',
        });
      }

      
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar. Silakan hubungi pengurus koperasi.',
      });
    }

    
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

    
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const newUser = await User.create(
      {
        email,
        password: hashedPassword,
        role: 'Anggota',
      },
      { transaction }
    );

    
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

    
    await transaction.commit();

    
    const fullAnggota = await Anggota.findByPk(newAnggota.anggota_id, {
      include: [{ model: User, as: 'user', attributes: ['email', 'role'] }]
    });
    const anggotaPlain = fullAnggota.get({ plain: true });

    
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

    
    req.io.emit('dashboardUpdate');
    req.io.emit('arus-kas-updated');

    
    console.log(`📤 Emitting user:created for ${nama_lengkap}`);
    req.io.emit('user:created', {
      type: 'anggota',
      user: anggotaPlain,
    });

    
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
    
    await transaction.rollback();
    console.error('❌ Error pada registrasi:', error);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};



const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email dan password wajib diisi.',
    });
  }

  try {
    
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

    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    
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


const adminCreateUser = async (req, res) => {
  const {
    type, 
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
    
    role, 
    metode_pembayaran, 
  } = req.body;

  
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
        keterangan: 'Simpanan Pokok Awal (Dibuat oleh Admin)'
      }, { transaction });

      
      await ArusKasService.recordTransaction({
        user_id: detailInstance.user_id,
        nama_kategori: 'Simpanan Pokok',
        jenis: 'Debit',
        nominal: nominalPokok,
        keterangan: 'Simpanan Pokok Awal (Dibuat oleh Admin)',
        kode_transaksi: `ADM-PKK-${detailInstance.anggota_id}`,
        metode_pembayaran: metode_pembayaran || 'CASH'
      }, { transaction }, req.io);
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

    
    const socketPayload = { 
      type: type.toLowerCase(), 
      user: fullData.get({ plain: true }) 
    };

    console.log(`📤 Emitting user:created event for ${socketPayload.type}:`, socketPayload.user.nama_lengkap);

    
    req.io.emit('user:created', socketPayload);

    
    req.io.emit('dashboardUpdate');
    req.io.emit('arus-kas-updated');

    
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
