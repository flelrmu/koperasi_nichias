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
      allowNull: false,
      references: {
        model: 'kategori_kas',
        key: 'kategori_id',
      },
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

  SaldoBulanan.associate = (models) => {
    SaldoBulanan.belongsTo(models.KategoriKas, { foreignKey: 'kategori_id', as: 'kategoriKas' });
  };

  return SaldoBulanan;
};
