const db = require('../models');

(async () => {
  try {
    const categories = [
      { nama_kategori: 'JASA PINJAMAN UANG', kode_akun: '41011', tipe_neraca: 'Income', jenis: 'Debit' },
      { nama_kategori: 'JASA CREDIT BARANG', kode_akun: '41012', tipe_neraca: 'Income', jenis: 'Debit' }
    ];

    for (const cat of categories) {
      const [record, created] = await db.KategoriKas.findOrCreate({
        where: { nama_kategori: cat.nama_kategori },
        defaults: cat
      });
      if (created) {
        console.log(`Kategori '${cat.nama_kategori}' berhasil dibuat.`);
      } else {
        console.log(`Kategori '${cat.nama_kategori}' sudah ada.`);
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
