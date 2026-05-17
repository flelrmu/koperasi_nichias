'use strict';

module.exports = (sequelize, DataTypes) => {
  const SaldoBulanan = sequelize.define('SaldoBulanan', {
    saldo_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    kategori_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    bulan: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tahun: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    saldo_awal: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    }
  }, {
    tableName: 'SaldoBulanan',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['kategori_id', 'bulan', 'tahun']
      }
    ]
  });

  return SaldoBulanan;
};
