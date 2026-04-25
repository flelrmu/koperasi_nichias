'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Update existing 'Ditolak' records to 'Keluar'
    await queryInterface.sequelize.query(
      `UPDATE anggota SET status_keanggotaan = 'Keluar' WHERE status_keanggotaan = 'Ditolak'`
    );

    // 2. Alter ENUM to remove 'Ditolak'
    await queryInterface.changeColumn('anggota', 'status_keanggotaan', {
      type: Sequelize.ENUM('Pending', 'Aktif', 'Keluar'),
      defaultValue: 'Pending',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('anggota', 'status_keanggotaan', {
      type: Sequelize.ENUM('Pending', 'Aktif', 'Ditolak', 'Keluar'),
      defaultValue: 'Pending',
    });
  },
};
