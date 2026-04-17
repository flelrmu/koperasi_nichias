'use strict';

module.exports = (sequelize, DataTypes) => {
  const PembagianShu = sequelize.define('PembagianShu', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lphu_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'lphu',
        key: 'lphu_id',
      },
    },
    anggota_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'anggota',
        key: 'anggota_id',
      },
    },
    total_simpanan: {
      type: DataTypes.DECIMAL(15, 2),
      comment: 'Basis Hitung',
    },
    persentase: {
      type: DataTypes.FLOAT,
      comment: 'Simpanan Anggota / Total Simpanan Koperasi',
    },
    shu_diterima: {
      type: DataTypes.DECIMAL(15, 2),
      comment: 'Persentase x Total SHU',
    },
  }, {
    tableName: 'pembagian_shu',
    timestamps: false,
  });

  PembagianShu.associate = (models) => {
    PembagianShu.belongsTo(models.Lphu, { foreignKey: 'lphu_id', as: 'lphu' });
    PembagianShu.belongsTo(models.Anggota, { foreignKey: 'anggota_id', as: 'anggota' });
  };

  return PembagianShu;
};
