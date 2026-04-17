'use strict';

module.exports = (sequelize, DataTypes) => {
  const ArusKas = sequelize.define('ArusKas', {
    kas_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'user_id',
      },
    },
    kategori_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'kategori_kas',
        key: 'kategori_id',
      },
    },
    tanggal: {
      type: DataTypes.DATEONLY,
    },
    kode_transaksi: {
      type: DataTypes.STRING(20),
    },
    jenis: {
      type: DataTypes.ENUM('Debit', 'Kredit'),
    },
    keterangan: {
      type: DataTypes.TEXT,
    },
    nominal: {
      type: DataTypes.DECIMAL(15, 2),
    },
    saldo_akhir: {
      type: DataTypes.DECIMAL(15, 2),
    },
  }, {
    tableName: 'arus_kas',
    timestamps: false,
  });

  ArusKas.associate = (models) => {
    ArusKas.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    ArusKas.belongsTo(models.KategoriKas, { foreignKey: 'kategori_id', as: 'kategoriKas' });
  };

  return ArusKas;
};
