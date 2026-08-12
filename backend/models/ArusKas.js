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
    periode_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'PeriodeKeuangan',
        key: 'periode_id',
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
    metode_pembayaran: {
      type: DataTypes.ENUM('CASH', 'BANK'),
      defaultValue: 'CASH',
    },
  }, {
    tableName: 'arus_kas',
    timestamps: false,
    hooks: {
      beforeCreate: async (arusKas, options) => {
        if (arusKas.tanggal && !arusKas.periode_id) {
          const moment = require('moment');
          const dateObj = moment(arusKas.tanggal);
          const bulan = dateObj.month() + 1;
          const tahun = dateObj.year();
          
          const PeriodeKeuangan = sequelize.models.PeriodeKeuangan;
          const [periode] = await PeriodeKeuangan.findOrCreate({
            where: { bulan, tahun },
            defaults: { is_closed: false },
            transaction: options.transaction
          });
          arusKas.periode_id = periode.periode_id;
        }
      },
      beforeUpdate: async (arusKas, options) => {
        if (arusKas.changed('tanggal') && arusKas.tanggal) {
          const moment = require('moment');
          const dateObj = moment(arusKas.tanggal);
          const bulan = dateObj.month() + 1;
          const tahun = dateObj.year();
          
          const PeriodeKeuangan = sequelize.models.PeriodeKeuangan;
          const [periode] = await PeriodeKeuangan.findOrCreate({
            where: { bulan, tahun },
            defaults: { is_closed: false },
            transaction: options.transaction
          });
          arusKas.periode_id = periode.periode_id;
        }
      }
    }
  });

  ArusKas.associate = (models) => {
    ArusKas.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    ArusKas.belongsTo(models.KategoriKas, { foreignKey: 'kategori_id', as: 'kategoriKas' });
    ArusKas.belongsTo(models.PeriodeKeuangan, { foreignKey: 'periode_id', as: 'periodeKeuangan' });
  };

  return ArusKas;
};
