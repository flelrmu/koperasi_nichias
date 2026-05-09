'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Fix existing categories (Swap Debit/Kredit according to new rule)
      // Standard: Kredit = Pemasukan (In), Debit = Pengeluaran (Out)
      
      const fixCategories = [
        { name: 'Simpanan Pokok', type: 'Kredit' },
        { name: 'Simpanan Wajib', type: 'Kredit' },
        { name: 'Simpanan Sukarela', type: 'Kredit' },
        { name: 'Pembayaran Angsuran', type: 'Kredit' },
        { name: 'Pencairan Pinjaman', type: 'Debit' },
        { name: 'Biaya Operasional', type: 'Debit' },
        { name: 'Penarikan Simpanan', type: 'Debit' }
      ];

      for (const cat of fixCategories) {
        await queryInterface.sequelize.query(
          `UPDATE kategori_kas SET jenis = :type WHERE nama_kategori = :name`,
          {
            replacements: { type: cat.type, name: cat.name },
            type: Sequelize.QueryTypes.UPDATE,
            transaction
          }
        );
      }

      // 2. Add new requested categories
      const newCategories = [
        { nama_kategori: 'BANK', jenis: 'Kredit' },
        { nama_kategori: 'TAGIHAN PINJAMAN', jenis: 'Debit' },
        { nama_kategori: 'TAGIHAN CREDIT BARANG', jenis: 'Debit' },
        { nama_kategori: 'TAGIHAN RENTAL', jenis: 'Debit' },
        { nama_kategori: 'PERSEDIAAN BARANG', jenis: 'Debit' },
        { nama_kategori: 'ALAT KANTOR', jenis: 'Debit' },
        { nama_kategori: 'INVESTASI', jenis: 'Debit' },
        { nama_kategori: 'INCOME TAX', jenis: 'Debit' },
        { nama_kategori: 'TOTAL ASSET', jenis: 'Kredit' },
        { nama_kategori: 'DP - PENERIMAAN DIMUKA', jenis: 'Kredit' },
        { nama_kategori: 'HUTANG USAHA', jenis: 'Debit' },
        { nama_kategori: 'HUTANG BIAYA', jenis: 'Debit' },
        { nama_kategori: 'TAX LIABILITY', jenis: 'Debit' },
        { nama_kategori: 'LOAN', jenis: 'Debit' },
        { nama_kategori: 'PROFIT/LOSS', jenis: 'Kredit' },
        { nama_kategori: 'SIMPANAN ANGGOTA', jenis: 'Kredit' },
        { nama_kategori: 'Simpanan Lain-lain', jenis: 'Kredit' }
      ];

      // Use bulkInsert for new categories, ignore if already exists (using raw query for better control or just manual check)
      for (const cat of newCategories) {
        const [existing] = await queryInterface.sequelize.query(
          `SELECT kategori_id FROM kategori_kas WHERE nama_kategori = :name`,
          {
            replacements: { name: cat.nama_kategori },
            type: Sequelize.QueryTypes.SELECT,
            transaction
          }
        );

        if (!existing) {
          await queryInterface.bulkInsert('kategori_kas', [cat], { transaction });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverting might be complex, usually we don't delete standard categories in down
  }
};
