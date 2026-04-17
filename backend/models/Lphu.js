'use strict';

module.exports = (sequelize, DataTypes) => {
  const Lphu = sequelize.define('Lphu', {
    lphu_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tahun: {
      type: DataTypes.INTEGER,
    },
    total_pendapatan_bunga: {
      type: DataTypes.DECIMAL(15, 2),
    },
    total_pendapatan_barang: {
      type: DataTypes.DECIMAL(15, 2),
    },
    total_biaya_operasional: {
      type: DataTypes.DECIMAL(15, 2),
    },
    shu_kotor: {
      type: DataTypes.DECIMAL(15, 2),
    },
    pajak: {
      type: DataTypes.DECIMAL(15, 2),
    },
    dana_cadangan: {
      type: DataTypes.DECIMAL(15, 2),
    },
    shu_bersih: {
      type: DataTypes.DECIMAL(15, 2),
    },
    created_at: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'lphu',
    timestamps: false,
  });

  Lphu.associate = (models) => {
    Lphu.hasMany(models.PembagianShu, { foreignKey: 'lphu_id', as: 'pembagianShu' });
  };

  return Lphu;
};
