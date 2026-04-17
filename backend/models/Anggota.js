'use strict';

module.exports = (sequelize, DataTypes) => {
  const Anggota = sequelize.define('Anggota', {
    anggota_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'user_id',
      },
    },
    no_anggota: {
      type: DataTypes.STRING(20),
      unique: true,
      comment: 'Digenerate setelah status Aktif',
    },
    no_identitas: {
      type: DataTypes.STRING(20),
      unique: true,
      comment: 'Nomor NIK atau KTP anggota',
    },
    nama_lengkap: {
      type: DataTypes.STRING(100),
    },
    tempat_lahir: {
      type: DataTypes.STRING(100),
    },
    tanggal_lahir: {
      type: DataTypes.DATEONLY,
    },
    jabatan: {
      type: DataTypes.ENUM('Staff', 'Assistant_Manager', 'Manager'),
      allowNull: false,
      comment: 'Untuk menentukan Limit Potongan (Staff/Mgr)',
    },
    divisi: {
      type: DataTypes.ENUM('Marketing', 'Purchasing', 'HRD', 'Admin', 'Keuangan'),
      allowNull: false,
      comment: 'Departemen tempat anggota bekerja',
    },
    no_hp: {
      type: DataTypes.STRING(15),
    },
    no_rekening_bank: {
      type: DataTypes.STRING(50),
      comment: 'Nomor rekening untuk pencairan dana',
    },
    alamat: {
      type: DataTypes.TEXT,
    },
    tanggal_registrasi: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    tanggal_bergabung: {
      type: DataTypes.DATEONLY,
      comment: 'Diisi saat Sekretaris klik Approve',
    },
    status_keanggotaan: {
      type: DataTypes.ENUM('Pending', 'Aktif', 'Ditolak', 'Keluar'),
      defaultValue: 'Pending',
    },
  }, {
    tableName: 'anggota',
    timestamps: false,
  });

  Anggota.associate = (models) => {
    Anggota.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Anggota.hasOne(models.Simpanan, { foreignKey: 'anggota_id', as: 'simpanan' });
    Anggota.hasMany(models.TransaksiSimpanan, { foreignKey: 'anggota_id', as: 'transaksiSimpanan' });
    Anggota.hasMany(models.Pinjaman, { foreignKey: 'anggota_id', as: 'pinjaman' });
    Anggota.hasMany(models.PembagianShu, { foreignKey: 'anggota_id', as: 'pembagianShu' });
  };

  return Anggota;
};
