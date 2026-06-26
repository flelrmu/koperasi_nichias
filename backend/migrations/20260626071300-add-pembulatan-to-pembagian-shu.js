'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pembagian_shu', 'pembulatan', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Nilai pembulatan nominal SHU yang diterima anggota',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('pembagian_shu', 'pembulatan');
  }
};
