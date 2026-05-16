'use strict';

module.exports = (sequelize, DataTypes) => {
  const NeracaSaldo = sequelize.define('NeracaSaldo', {
    saldo_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    kategori_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'kategori_kas',
        key: 'kategori_id',
      },
    },
    bulan: {
      type: DataTypes.INTEGER, // 1-12
      allowNull: false,
    },
    tahun: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    saldo_awal: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    total_debit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    total_kredit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    saldo_akhir: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    status_tutup_buku: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    tgl_tutup_buku: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bendahara_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    tableName: 'neraca_saldo',
    timestamps: true,
    underscored: false,
  });

  NeracaSaldo.associate = (models) => {
    NeracaSaldo.belongsTo(models.KategoriKas, { foreignKey: 'kategori_id', as: 'kategori' });
    NeracaSaldo.belongsTo(models.User, { foreignKey: 'bendahara_id', as: 'bendahara' });
  };

  return NeracaSaldo;
};
