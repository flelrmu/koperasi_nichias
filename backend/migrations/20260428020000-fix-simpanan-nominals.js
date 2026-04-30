'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkUpdate('konfigurasi', 
      { nilai: '100000' }, 
      { nama_config: 'SIMPANAN_POKOK' }
    );
    await queryInterface.bulkUpdate('konfigurasi', 
      { nilai: '200000' }, 
      { nama_config: 'SIMPANAN_WAJIB' }
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkUpdate('konfigurasi', 
      { nilai: '1000000' }, 
      { nama_config: 'SIMPANAN_POKOK' }
    );
    await queryInterface.bulkUpdate('konfigurasi', 
      { nilai: '500000' }, 
      { nama_config: 'SIMPANAN_WAJIB' }
    );
  }
};
