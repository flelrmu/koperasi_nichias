'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const config = [
      { nama_config: 'BUNGA_PINJAMAN_PERSEN', nilai: '1', keterangan: 'Bunga pinjaman 1% per bulan', updated_by: 1, updated_at: new Date() },
      { nama_config: 'SIMPANAN_POKOK', nilai: '100000', keterangan: 'Simpanan pokok anggota baru', updated_by: 1, updated_at: new Date() },
      { nama_config: 'SIMPANAN_WAJIB', nilai: '200000', keterangan: 'Simpanan wajib per bulan', updated_by: 1, updated_at: new Date() },
      { nama_config: 'SIMPANAN_SUKARELA', nilai: '0', keterangan: 'Simpanan sukarela (0 = bebas)', updated_by: 1, updated_at: new Date() }
    ];
    return queryInterface.bulkInsert('konfigurasi', config);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('konfigurasi', null, {});
  }
};
