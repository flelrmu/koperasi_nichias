'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('anggota', 'foto_profil', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Path foto profil anggota',
    });

    await queryInterface.addColumn('pengurus', 'foto_profil', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Path foto profil pengurus',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('anggota', 'foto_profil');
    await queryInterface.removeColumn('pengurus', 'foto_profil');
  }
};
