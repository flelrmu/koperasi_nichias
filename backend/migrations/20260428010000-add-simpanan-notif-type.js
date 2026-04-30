'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'simpanan' to notifikasi.tipe ENUM
    await queryInterface.sequelize.query(
      "ALTER TABLE notifikasi MODIFY COLUMN tipe ENUM('pendaftaran', 'umum', 'sistem', 'simpanan') DEFAULT 'umum'"
    );

    // Add SIMPANAN_SUKARELA config if not exists
    const [existing] = await queryInterface.sequelize.query(
      "SELECT * FROM konfigurasi WHERE nama_config = 'SIMPANAN_SUKARELA'"
    );
    if (existing.length === 0) {
      await queryInterface.bulkInsert('konfigurasi', [{
        nama_config: 'SIMPANAN_SUKARELA',
        nilai: '0',
        keterangan: 'Simpanan sukarela (0 = bebas, angka lain = nominal tetap)',
        updated_by: 1,
        updated_at: new Date()
      }]);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TABLE notifikasi MODIFY COLUMN tipe ENUM('pendaftaran', 'umum', 'sistem') DEFAULT 'umum'"
    );
    await queryInterface.bulkDelete('konfigurasi', { nama_config: 'SIMPANAN_SUKARELA' });
  }
};
