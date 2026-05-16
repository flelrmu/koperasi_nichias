const db = require('../models');

(async () => {
  try {
    // 1. Cari kategori lama
    const old1 = await db.KategoriKas.findOne({ where: { nama_kategori: 'JASA PINJAMAN UANG' } });
    const old2 = await db.KategoriKas.findOne({ where: { nama_kategori: 'JASA CREDIT BARANG' } });

    // 2. Buat atau Update kategori baru 'BUNGA/PROFIT'
    const [targetCat, created] = await db.KategoriKas.findOrCreate({
      where: { nama_kategori: 'BUNGA/PROFIT' },
      defaults: {
        nama_kategori: 'BUNGA/PROFIT',
        kode_akun: '41011',
        tipe_neraca: 'Income',
        jenis: 'Debit'
      }
    });

    if (!created) {
        console.log("Kategori 'BUNGA/PROFIT' sudah ada.");
    } else {
        console.log("Kategori 'BUNGA/PROFIT' berhasil dibuat.");
    }

    // 3. Jika ada transaksi di kategori lama, pindahkan ke kategori baru (opsional tapi baik untuk integritas)
    if (old1) {
        await db.ArusKas.update({ kategori_id: targetCat.kategori_id }, { where: { kategori_id: old1.kategori_id } });
        // Hapus kategori lama jika sudah tidak dipakai
        await old1.destroy();
    }
    if (old2) {
        await db.ArusKas.update({ kategori_id: targetCat.kategori_id }, { where: { kategori_id: old2.kategori_id } });
        await old2.destroy();
    }

    console.log("Migrasi kategori selesai.");
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
