'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const arusKas = [
      { user_id: 3, kategori_id: 1, tanggal: '2026-01-10', kode_transaksi: 'TRX-202601-001', jenis: 'Debit', keterangan: 'Setoran Pokok Agus Pratama', nominal: 1000000, saldo_akhir: 1000000 },
      { user_id: 3, kategori_id: 1, tanggal: '2026-01-15', kode_transaksi: 'TRX-202601-002', jenis: 'Debit', keterangan: 'Setoran Pokok Bambang', nominal: 1000000, saldo_akhir: 2000000 },
      { user_id: 3, kategori_id: 5, tanggal: '2026-02-05', kode_transaksi: 'TRX-202602-001', jenis: 'Kredit', keterangan: 'Pencairan Pinjaman Agus', nominal: 5000000, saldo_akhir: -3000000 }
    ];
    return queryInterface.bulkInsert('arus_kas', arusKas);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('arus_kas', null, {});
  }
};
