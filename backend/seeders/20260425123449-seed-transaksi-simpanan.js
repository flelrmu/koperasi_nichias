'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaksi = [];
    for (let i = 1; i <= 20; i++) {
      transaksi.push({
        anggota_id: i,
        jenis_simpanan: 'Pokok',
        jenis_transaksi: 'Setor',
        nominal: 1000000,
        tanggal: '2026-01-01',
        keterangan: 'Setoran Pokok Awal'
      });
      transaksi.push({
        anggota_id: i,
        jenis_simpanan: 'Wajib',
        jenis_transaksi: 'Setor',
        nominal: 500000,
        tanggal: '2026-02-01',
        keterangan: 'Setoran Wajib Bulanan'
      });
      transaksi.push({
        anggota_id: i,
        jenis_simpanan: 'Wajib',
        jenis_transaksi: 'Setor',
        nominal: 500000,
        tanggal: '2026-03-01',
        keterangan: 'Setoran Wajib Bulanan'
      });
    }
    return queryInterface.bulkInsert('transaksi_simpanan', transaksi);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('transaksi_simpanan', null, {});
  }
};
