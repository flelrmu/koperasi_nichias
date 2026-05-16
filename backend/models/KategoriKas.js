'use strict';

module.exports = (sequelize, DataTypes) => {
  const KategoriKas = sequelize.define('KategoriKas', {
    kategori_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nama_kategori: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    kode_akun: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    tipe_neraca: {
      type: DataTypes.ENUM('Asset', 'Liability', 'Equity', 'Income', 'Expense'),
      allowNull: false,
      defaultValue: 'Asset'
    },
    saldo_awal: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    jenis: {
      type: DataTypes.ENUM('Debit', 'Kredit'),
      allowNull: false,
      defaultValue: 'Kredit'
    },
  }, {
    tableName: 'kategori_kas',
    timestamps: false,
  });

  KategoriKas.associate = (models) => {
    KategoriKas.hasMany(models.ArusKas, { foreignKey: 'kategori_id', as: 'arusKas' });
  };

  return KategoriKas;
};
