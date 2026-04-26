'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const pinjaman = [];
    for (let i = 1; i <= 10; i++) {
      pinjaman.push({
        anggota_id: i,
        jenis_pinjaman: 'Uang',
        keperluan: 'Renovasi Rumah',
        jumlah_pinjaman: 5000000,
        terbilang: 'Lima Juta Rupiah',
        tenor: 10,
        tanggal_pengajuan: '2026-02-01',
        pinjaman_disetujui: 5000000,
        total_bunga: 500000,
        total_angsuran: 5500000,
        angsuran_per_bulan: 550000,
        acc_koordinator_id: 4,
        tgl_acc_koordinator: new Date('2026-02-03'),
        status: 'Approved',
        sisa_tagihan: 5500000 - (550000 * 2)
      });
    }
    return queryInterface.bulkInsert('pinjaman', pinjaman);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('pinjaman', null, {});
  }
};
