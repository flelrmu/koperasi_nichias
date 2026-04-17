'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notifikasi = sequelize.define('Notifikasi', {
    id: {
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
    judul: {
      type: DataTypes.STRING(100),
    },
    pesan: {
      type: DataTypes.TEXT,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'notifikasi',
    timestamps: false,
  });

  Notifikasi.associate = (models) => {
    Notifikasi.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Notifikasi;
};
