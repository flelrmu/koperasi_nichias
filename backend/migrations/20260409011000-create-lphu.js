'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('lphu', {
      lphu_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tahun: {
        type: Sequelize.INTEGER,
      },
      total_pendapatan_bunga: {
        type: Sequelize.DECIMAL(15, 2),
      },
      total_pendapatan_barang: {
        type: Sequelize.DECIMAL(15, 2),
      },
      total_biaya_operasional: {
        type: Sequelize.DECIMAL(15, 2),
      },
      shu_kotor: {
        type: Sequelize.DECIMAL(15, 2),
      },
      pajak: {
        type: Sequelize.DECIMAL(15, 2),
      },
      dana_cadangan: {
        type: Sequelize.DECIMAL(15, 2),
      },
      shu_bersih: {
        type: Sequelize.DECIMAL(15, 2),
      },
      created_at: {
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('lphu');
  },
};
