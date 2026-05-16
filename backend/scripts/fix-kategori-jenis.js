const db = require('../models');
const { KategoriKas, sequelize } = db;

async function fixKategoriJenis() {
  try {
    console.log('🔧 Fixing empty jenis in kategori_kas...');
    
    // Fix empty → Debit (these were originally Kredit=masuk, now Debit=masuk)
    await sequelize.query("UPDATE kategori_kas SET jenis = 'Debit' WHERE jenis = '' OR jenis IS NULL");
    
    // Now manually set the ones that should be Kredit (keluar):
    // Pencairan Pinjaman → Kredit (keluar) ✓ already correct
    // Biaya Operasional → Kredit (keluar) ✓ already correct
    // Penarikan Simpanan → Kredit (keluar) ✓ already correct
    // ANGSURAN PINJAMAN UANG should be Debit (masuk) - fix it
    // ANGSURAN CREDIT BARANG should be Debit (masuk) - fix it
    await sequelize.query("UPDATE kategori_kas SET jenis = 'Debit' WHERE nama_kategori IN ('ANGSURAN PINJAMAN UANG', 'ANGSURAN CREDIT BARANG')");
    
    // PINJAMAN UANG → Kredit (keluar, pencairan)
    // CREDIT BARANG → Kredit (keluar, pencairan)
    await sequelize.query("UPDATE kategori_kas SET jenis = 'Kredit' WHERE nama_kategori IN ('PINJAMAN UANG', 'CREDIT BARANG')");

    const cats = await KategoriKas.findAll({ order: [['kategori_id', 'ASC']] });
    cats.forEach(c => console.log(`[${c.kategori_id}] ${c.nama_kategori} → ${c.jenis}`));
    console.log('✅ Done!');
  } catch (e) {
    console.error('❌', e.message);
  } finally {
    process.exit(0);
  }
}
fixKategoriJenis();
