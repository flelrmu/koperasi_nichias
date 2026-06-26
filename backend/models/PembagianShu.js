'use strict';

module.exports = (sequelize, DataTypes) => {
  const PembagianShu = sequelize.define('PembagianShu', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rekap_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'RekapShu',
        key: 'id',
      },
    },
    anggota_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Anggota',
        key: 'anggota_id',
      },
    },
    total_simpanan: {
      type: DataTypes.DECIMAL(15, 2),
    },
    persentase: {
      type: DataTypes.FLOAT,
    },
    shu_diterima: {
      type: DataTypes.DECIMAL(15, 2),
    },
    pembulatan: {
      type: DataTypes.DECIMAL(15, 2),
    },
  }, {
    tableName: 'pembagian_shu',
    timestamps: false,
  });

  PembagianShu.associate = (models) => {
    PembagianShu.belongsTo(models.RekapShu, { foreignKey: 'rekap_id', as: 'rekap' });
    PembagianShu.belongsTo(models.Anggota, { foreignKey: 'anggota_id', as: 'anggota' });
  };

  return PembagianShu;
};
