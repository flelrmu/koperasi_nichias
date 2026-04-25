'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('notifikasi', 'tipe', {
      type: Sequelize.ENUM('pendaftaran', 'umum', 'sistem'),
      defaultValue: 'umum',
      after: 'pesan',
    });

    await queryInterface.addColumn('notifikasi', 'link', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'tipe',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('notifikasi', 'link');
    await queryInterface.removeColumn('notifikasi', 'tipe');
  },
};
