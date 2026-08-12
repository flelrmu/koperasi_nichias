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
      type: DataTypes.ENUM('Staff', 'Assistant_Manager', 'Manager', 'Lainnya'),
      allowNull: false,
      comment: 'Untuk menentukan Limit Potongan (Staff/Mgr)',
    },
    divisi: {
      type: DataTypes.ENUM('Marketing', 'Purchasing', 'HRD', 'Admin', 'Keuangan', 'Lainnya'),
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
      type: DataTypes.ENUM('Pending', 'Aktif', 'Keluar', 'Pending_Keluar'),
      defaultValue: 'Pending',
    },
    alasan_keluar: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Alasan pengunduran diri dari keanggotaan',
    },
    foto_profil: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    saldo_pokok: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
    },
    saldo_wajib: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
    },
    saldo_sukarela: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'anggota',
    timestamps: false,
  });

  Anggota.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    values.simpanan = {
      simpanan_id: this.anggota_id,
      anggota_id: this.anggota_id,
      saldo_pokok: parseFloat(this.saldo_pokok || 0),
      saldo_wajib: parseFloat(this.saldo_wajib || 0),
      saldo_sukarela: parseFloat(this.saldo_sukarela || 0),
      last_updated: this.last_updated,
      toJSON() {
        return this;
      }
    };
    return values;
  };

  Anggota.associate = (models) => {
    Anggota.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Anggota.hasMany(models.TransaksiSimpanan, { foreignKey: 'anggota_id', as: 'transaksiSimpanan' });
    Anggota.hasMany(models.Pinjaman, { foreignKey: 'anggota_id', as: 'pinjaman' });
    Anggota.hasMany(models.PembagianShu, { foreignKey: 'anggota_id', as: 'pembagianShu' });
  };

  return Anggota;
};
