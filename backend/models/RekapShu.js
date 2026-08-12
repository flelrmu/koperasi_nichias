'use strict';

module.exports = (sequelize, DataTypes) => {
  const RekapShu = sequelize.define('RekapShu', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tahun: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false
    },
    total_profit: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false
    },
    jatah_anggota: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false
    },
    jatah_pengurus: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false
    },
    laba_ditahan: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false
    },
    is_processed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_finalized: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    processed_at: {
      type: DataTypes.DATE
    },
    processed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
    }
  }, {
    tableName: 'RekapShu',
    timestamps: true,
    underscored: false
  });

  RekapShu.associate = (models) => {
    RekapShu.hasMany(models.PembagianShu, { foreignKey: 'rekap_id', as: 'details' });
    RekapShu.belongsTo(models.User, { foreignKey: 'processed_by', as: 'processor' });
  };

  return RekapShu;
};
