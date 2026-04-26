'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const kategori = [
      { nama_kategori: 'Setoran Pokok', jenis: 'Debit' },
      { nama_kategori: 'Setoran Wajib', jenis: 'Debit' },
      { nama_kategori: 'Setoran Sukarela', jenis: 'Debit' },
      { nama_kategori: 'Pembayaran Angsuran', jenis: 'Debit' },
      { nama_kategori: 'Pencairan Pinjaman', jenis: 'Kredit' },
      { nama_kategori: 'Biaya Operasional', jenis: 'Kredit' },
      { nama_kategori: 'Penarikan Simpanan', jenis: 'Kredit' }
    ];
    return queryInterface.bulkInsert('kategori_kas', kategori);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('kategori_kas', null, {});
  }
};
