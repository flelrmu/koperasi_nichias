'use strict';

module.exports = (sequelize, DataTypes) => {
  const TransaksiSimpanan = sequelize.define('TransaksiSimpanan', {
    transaksi_id: {
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
    jenis_simpanan: {
      type: DataTypes.ENUM('Pokok', 'Wajib', 'Sukarela'),
    },
    jenis_transaksi: {
      type: DataTypes.ENUM('Setor', 'Tarik'),
    },
    nominal: {
      type: DataTypes.DECIMAL(15, 2),
    },
    tanggal: {
      type: DataTypes.DATEONLY,
    },
    keterangan: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'transaksi_simpanan',
    timestamps: false,
  });

  TransaksiSimpanan.associate = (models) => {
    TransaksiSimpanan.belongsTo(models.Anggota, { foreignKey: 'anggota_id', as: 'anggota' });
  };

  return TransaksiSimpanan;
};
