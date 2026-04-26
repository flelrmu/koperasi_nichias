'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const angsuran = [];
    let pinjamanId = 1;
    for (let i = 1; i <= 10; i++) {
      angsuran.push({
        pinjaman_id: pinjamanId,
        angsuran_ke: 1,
        jumlah_bayar: 550000,
        tanggal_jatuh_tempo: '2026-03-01',
        tanggal_bayar: '2026-02-28',
        status_bayar: 'Lunas',
        nomor_invoice: `INV-${pinjamanId}-001`
      });
      angsuran.push({
        pinjaman_id: pinjamanId,
        angsuran_ke: 2,
        jumlah_bayar: 550000,
        tanggal_jatuh_tempo: '2026-04-01',
        tanggal_bayar: '2026-03-28',
        status_bayar: 'Lunas',
        nomor_invoice: `INV-${pinjamanId}-002`
      });
      angsuran.push({
        pinjaman_id: pinjamanId,
        angsuran_ke: 3,
        jumlah_bayar: 550000,
        tanggal_jatuh_tempo: '2026-05-01',
        tanggal_bayar: null,
        status_bayar: 'Belum',
        nomor_invoice: `INV-${pinjamanId}-003`
      });
      pinjamanId++;
    }
    return queryInterface.bulkInsert('angsuran', angsuran);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('angsuran', null, {});
  }
};
