'use strict';

module.exports = (sequelize, DataTypes) => {
  const Pengurus = sequelize.define('Pengurus', {
    pengurus_id: {
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
    nama_lengkap: {
      type: DataTypes.STRING(100),
    },
    jabatan: {
      type: DataTypes.STRING(50),
      comment: 'Sekretaris/Bendahara/Koordinator SP',
    },
    no_hp: {
      type: DataTypes.STRING(15),
    },
    alamat: {
      type: DataTypes.TEXT,
    },
    foto_profil: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  }, {
    tableName: 'pengurus',
    timestamps: false,
  });

  Pengurus.associate = (models) => {
    Pengurus.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Pengurus;
};
