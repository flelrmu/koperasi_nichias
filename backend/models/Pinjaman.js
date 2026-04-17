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
    nama_barang: {
      type: DataTypes.STRING(100),
      comment: 'Diisi jika jenis=Barang',
    },
    jumlah_pinjaman: {
      type: DataTypes.DECIMAL(15, 2),
      comment: 'Uang Cair atau Harga Beli Barang',
    },
    total_bunga: {
      type: DataTypes.DECIMAL(15, 2),
      comment: 'Jasa Pinjaman atau Margin Profit',
    },
    total_angsuran: {
      type: DataTypes.DECIMAL(15, 2),
      comment: 'Pokok + Bunga',
    },
    tenor: {
      type: DataTypes.INTEGER,
      comment: 'Bulan (10/15/20)',
    },
    angsuran_per_bulan: {
      type: DataTypes.DECIMAL(15, 2),
    },
    tanggal_pengajuan: {
      type: DataTypes.DATEONLY,
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
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected', 'Lunas'),
      defaultValue: 'Pending',
    },
    sisa_tagihan: {
      type: DataTypes.DECIMAL(15, 2),
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
