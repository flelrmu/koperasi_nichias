'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('Anggota', 'Sekretaris', 'Bendahara', 'Koordinator_Simpan_Pinjam', 'Ketua', 'Wakil_Ketua'),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'users',
    timestamps: false,
  });

  User.associate = (models) => {
    User.hasOne(models.Anggota, { foreignKey: 'user_id', as: 'anggota' });
    User.hasOne(models.Pengurus, { foreignKey: 'user_id', as: 'pengurus' });
    User.hasMany(models.Notifikasi, { foreignKey: 'user_id', as: 'notifikasi' });
    User.hasMany(models.ArusKas, { foreignKey: 'user_id', as: 'arusKas' });
    User.hasMany(models.Pinjaman, { foreignKey: 'acc_koordinator_id', as: 'pinjamanDisetujui' });
    User.hasMany(models.PeriodeKeuangan, { foreignKey: 'closed_by', as: 'periodeKeuangan' });
    User.hasMany(models.RekapShu, { foreignKey: 'processed_by', as: 'rekapShu' });
  };

  return User;
};
