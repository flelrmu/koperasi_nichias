'use strict';

module.exports = (sequelize, DataTypes) => {
  const Angsuran = sequelize.define('Angsuran', {
    angsuran_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pinjaman_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'pinjaman',
        key: 'pinjaman_id',
      },
    },
    angsuran_ke: {
      type: DataTypes.INTEGER,
    },
    jumlah_bayar: {
      type: DataTypes.DECIMAL(15, 2),
    },
    tanggal_jatuh_tempo: {
      type: DataTypes.DATEONLY,
    },
    tanggal_bayar: {
      type: DataTypes.DATEONLY,
    },
    status_bayar: {
      type: DataTypes.ENUM('Belum', 'Lunas'),
      defaultValue: 'Belum',
    },
  }, {
    tableName: 'angsuran',
    timestamps: false,
  });

  Angsuran.associate = (models) => {
    Angsuran.belongsTo(models.Pinjaman, { foreignKey: 'pinjaman_id', as: 'pinjaman' });
  };

  return Angsuran;
};
