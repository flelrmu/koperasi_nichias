'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.dropTable('neraca_saldo');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('neraca_saldo', {
      saldo_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      kategori_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'kategori_kas',
          key: 'kategori_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      bulan: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tahun: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      saldo_awal: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_debit: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_kredit: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      saldo_akhir: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      status_tutup_buku: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      tgl_tutup_buku: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      bendahara_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });
  },
};
