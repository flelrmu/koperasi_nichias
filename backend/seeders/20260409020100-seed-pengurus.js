'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('pengurus', [
      { user_id: 1, nama_lengkap: 'Muhammad Farhan', jabatan: 'Ketua Koperasi', no_hp: '081234567890', alamat: 'Padang' },
      { user_id: 2, nama_lengkap: 'Ahmad Hidayat', jabatan: 'Sekretaris', no_hp: '081234567891', alamat: 'Padang' },
      { user_id: 3, nama_lengkap: 'Siti Aminah', jabatan: 'Bendahara', no_hp: '081234567892', alamat: 'Padang' },
      { user_id: 4, nama_lengkap: 'Budi Santoso', jabatan: 'Koordinator Simpan Pinjam', no_hp: '081234567893', alamat: 'Padang' }
    ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('pengurus', null, {});
  }
};