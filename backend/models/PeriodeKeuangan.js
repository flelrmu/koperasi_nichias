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
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id',
      },
    }
  }, {
    tableName: 'PeriodeKeuangan',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['bulan', 'tahun']
      }
    ]
  });

  PeriodeKeuangan.associate = (models) => {
    PeriodeKeuangan.belongsTo(models.User, { foreignKey: 'closed_by', as: 'closedBy' });
    PeriodeKeuangan.hasMany(models.ArusKas, { foreignKey: 'periode_id', as: 'arusKas' });
  };

  return PeriodeKeuangan;
};
