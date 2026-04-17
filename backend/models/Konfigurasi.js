'use strict';

module.exports = (sequelize, DataTypes) => {
  const Konfigurasi = sequelize.define('Konfigurasi', {
    config_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nama_config: {
      type: DataTypes.STRING(100),
      unique: true,
    },
    nilai: {
      type: DataTypes.STRING(255),
    },
    keterangan: {
      type: DataTypes.TEXT,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      comment: 'User ID Sekretaris/Ketua yg edit',
      references: {
        model: 'users',
        key: 'user_id',
      },
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Waktu terakhir diedit',
    },
  }, {
    tableName: 'konfigurasi',
    timestamps: false,
  });

  Konfigurasi.associate = (models) => {
    Konfigurasi.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
  };

  return Konfigurasi;
};
