'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const categories = [
      { nama_kategori: 'CASH', kode_akun: '11011', tipe_neraca: 'Asset', jenis: 'Kredit' },
      { nama_kategori: 'BANK', kode_akun: '11012', tipe_neraca: 'Asset', jenis: 'Kredit' },
      { nama_kategori: 'TAGIHAN PINJAMAN', kode_akun: '11013', tipe_neraca: 'Asset', jenis: 'Kredit' },
      { nama_kategori: 'TAGIHAN CREDIT BARANG', kode_akun: '11014', tipe_neraca: 'Asset', jenis: 'Kredit' },
      { nama_kategori: 'TAGIHAN RENTAL', kode_akun: '11015', tipe_neraca: 'Asset', jenis: 'Kredit' },
      { nama_kategori: 'PERSEDIAAN BARANG', kode_akun: '11016', tipe_neraca: 'Asset', jenis: 'Kredit' },
      { nama_kategori: 'ALAT KANTOR', kode_akun: '11017', tipe_neraca: 'Asset', jenis: 'Kredit' },
      { nama_kategori: 'INVESTASI', kode_akun: '11018', tipe_neraca: 'Asset', jenis: 'Kredit' },
      { nama_kategori: 'INCOME TAX', kode_akun: '11019', tipe_neraca: 'Asset', jenis: 'Kredit' },
      { nama_kategori: 'DP - PENERIMAAN DIMUKA', kode_akun: '21011', tipe_neraca: 'Liability', jenis: 'Kredit' },
      { nama_kategori: 'HUTANG USAHA', kode_akun: '21012', tipe_neraca: 'Liability', jenis: 'Kredit' },
      { nama_kategori: 'HUTANG BIAYA', kode_akun: '21013', tipe_neraca: 'Liability', jenis: 'Kredit' },
      { nama_kategori: 'TAX LIABILITY', kode_akun: '21014', tipe_neraca: 'Liability', jenis: 'Kredit' },
      { nama_kategori: 'LOAN', kode_akun: '21015', tipe_neraca: 'Liability', jenis: 'Kredit' },
      { nama_kategori: 'SIMPANAN ANGGOTA', kode_akun: '31011', tipe_neraca: 'Equity', jenis: 'Kredit' },
      { nama_kategori: 'LABA DITAHAN', kode_akun: '31012', tipe_neraca: 'Equity', jenis: 'Kredit' },
      { nama_kategori: 'PROFIT/LOSS', kode_akun: '31013', tipe_neraca: 'Equity', jenis: 'Kredit' },
    ];

    for (const cat of categories) {
      const existing = await queryInterface.rawSelect('kategori_kas', {
        where: { nama_kategori: cat.nama_kategori },
      }, ['kategori_id']);

      if (existing) {
        await queryInterface.bulkUpdate('kategori_kas', {
          kode_akun: cat.kode_akun,
          tipe_neraca: cat.tipe_neraca,
          jenis: cat.jenis
        }, { nama_kategori: cat.nama_kategori });
      } else {
        await queryInterface.bulkInsert('kategori_kas', [{
          ...cat,
          saldo_awal: 0
        }]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // No easy way to undo specific updates without tracking
  }
};
