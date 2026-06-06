'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('peraturan', { judul: 'Kas Overdraft Protection' });
  },

  async down(queryInterface, Sequelize) {
    // No need to restore since it is deprecated
  }
};
