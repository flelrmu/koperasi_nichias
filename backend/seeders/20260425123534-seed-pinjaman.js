'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Kosongkan seeder pinjaman sesuai permintaan
    return Promise.resolve();
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('pinjaman', null, {});
  }
};
