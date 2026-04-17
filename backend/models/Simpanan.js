'use strict';

module.exports = (sequelize, DataTypes) => {
  const Simpanan = sequelize.define('Simpanan', {
    simpanan_id: {
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
    saldo_pokok: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    saldo_wajib: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    saldo_sukarela: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    last_updated: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'simpanan',
    timestamps: false,
  });

  Simpanan.associate = (models) => {
    Simpanan.belongsTo(models.Anggota, { foreignKey: 'anggota_id', as: 'anggota' });
  };

  return Simpanan;
};
