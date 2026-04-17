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
    jenis: {
      type: DataTypes.ENUM('Debit', 'Kredit'),
      allowNull: false,
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
