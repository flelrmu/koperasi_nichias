'use strict';

module.exports = (sequelize, DataTypes) => {
  const PeriodeKeuangan = sequelize.define('PeriodeKeuangan', {
    periode_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    bulan: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tahun: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    is_closed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closed_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'PeriodeKeuangan',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['bulan', 'tahun']
      }
    ]
  });

  return PeriodeKeuangan;
};
