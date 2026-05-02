'use strict';

module.exports = (sequelize, DataTypes) => {
  const Pinjaman = sequelize.define('Pinjaman', {
    pinjaman_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    anggota_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'anggota',
        key: 'anggota_id',
      },
    },
    jenis_pinjaman: {
      type: DataTypes.ENUM('Uang', 'Barang'),
    },

    keperluan: {
      type: DataTypes.TEXT,
      comment: 'Alasan atau tujuan pengajuan pinjaman',
    },
    jumlah_pinjaman: {
      type: DataTypes.DECIMAL(15, 2),
      comment: 'Nominal Uang/Harga Barang yang DIAJUKAN',
    },
    terbilang: {
      type: DataTypes.TEXT,
      comment: 'Jumlah pinjaman diajukan dalam bentuk tulisan/huruf',
    },
    tenor: {
      type: DataTypes.INTEGER,
      comment: 'Bulan (10/15/20) yang diajukan',
    },
    tanggal_pengajuan: {
      type: DataTypes.DATEONLY,
    },
    pinjaman_disetujui: {
      type: DataTypes.DECIMAL(15, 2),
      comment: 'Nominal yang DI-ACC (Bisa lebih kecil dari pengajuan)',
    },
    total_bunga: {
      type: DataTypes.DECIMAL(15, 2),
      comment: 'Jasa Pinjaman atau Margin Profit',
    },
    total_angsuran: {
      type: DataTypes.DECIMAL(15, 2),
      comment: 'Pokok Disetujui + Bunga',
    },
    angsuran_per_bulan: {
      type: DataTypes.DECIMAL(15, 2),
      comment: 'Limit Potongan Gaji dicek berdasarkan Jabatan',
    },
    acc_koordinator_id: {
      type: DataTypes.INTEGER,
      comment: 'User ID Koordinator SP',
      references: {
        model: 'users',
        key: 'user_id',
      },
    },
    tgl_acc_koordinator: {
      type: DataTypes.DATE,
    },
    catatan_pengurus: {
      type: DataTypes.TEXT,
      comment: 'Alasan penolakan atau catatan kondisi persetujuan',
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Lunas'),
      defaultValue: 'Pending',
    },
    sisa_tagihan: {
      type: DataTypes.DECIMAL(15, 2),
    },
    nomor_invoice: {
      type: DataTypes.STRING,
      comment: 'Nomor Invoice unik (INV/PNJ/...)',
    },
  }, {
    tableName: 'pinjaman',
    timestamps: false,
  });

  Pinjaman.associate = (models) => {
    Pinjaman.belongsTo(models.Anggota, { foreignKey: 'anggota_id', as: 'anggota' });
    Pinjaman.belongsTo(models.User, { foreignKey: 'acc_koordinator_id', as: 'koordinator' });
    Pinjaman.hasMany(models.Angsuran, { foreignKey: 'pinjaman_id', as: 'angsuran' });
  };

  return Pinjaman;
};
