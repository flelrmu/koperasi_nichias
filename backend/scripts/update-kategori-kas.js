/**
 * Script: Update Kategori Kas
 * 
 * 1. Rename TAGIHAN PNJIAMAN → PINJAMAN UANG
 * 2. Rename TAGIHAN CREDIT BARANG → CREDIT BARANG
 * 3. Tambah kategori ANGSURAN PINJAMAN UANG & ANGSURAN CREDIT BARANG
 * 4. Hapus kategori yang tidak dipakai lagi (Pencairan Pinjaman, Pembayaran Angsuran)
 */

const db = require('../models');
const { KategoriKas, sequelize } = db;

async function updateKategoriKas() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('📂 Memulai update kategori kas...\n');

    // 1. Rename TAGIHAN PNJIAMAN → PINJAMAN UANG
    const tagPinjaman = await KategoriKas.findOne({ where: { nama_kategori: 'TAGIHAN PNJIAMAN' }, transaction });
    if (tagPinjaman) {
      await tagPinjaman.update({ nama_kategori: 'PINJAMAN UANG' }, { transaction });
      console.log('✅ TAGIHAN PNJIAMAN → PINJAMAN UANG (ID:', tagPinjaman.kategori_id, ')');
    } else {
      console.log('ℹ️  TAGIHAN PNJIAMAN tidak ditemukan, skip rename.');
    }

    // 2. Rename TAGIHAN CREDIT BARANG → CREDIT BARANG  
    const tagCredit = await KategoriKas.findOne({ where: { nama_kategori: 'TAGIHAN CREDIT BARANG' }, transaction });
    if (tagCredit) {
      await tagCredit.update({ nama_kategori: 'CREDIT BARANG' }, { transaction });
      console.log('✅ TAGIHAN CREDIT BARANG → CREDIT BARANG (ID:', tagCredit.kategori_id, ')');
    } else {
      console.log('ℹ️  TAGIHAN CREDIT BARANG tidak ditemukan, skip rename.');
    }

    // 3. Tambah kategori baru jika belum ada
    const newCategories = [
      { nama_kategori: 'ANGSURAN PINJAMAN UANG', kode_akun: '11013A', tipe_neraca: 'Asset', jenis: 'Debit' },
      { nama_kategori: 'ANGSURAN CREDIT BARANG', kode_akun: '11014A', tipe_neraca: 'Asset', jenis: 'Debit' },
    ];

    for (const cat of newCategories) {
      const existing = await KategoriKas.findOne({ where: { nama_kategori: cat.nama_kategori }, transaction });
      if (!existing) {
        await KategoriKas.create(cat, { transaction });
        console.log(`✅ Kategori baru ditambahkan: ${cat.nama_kategori}`);
      } else {
        console.log(`ℹ️  ${cat.nama_kategori} sudah ada, skip.`);
      }
    }

    // 4. Rename kategori lama yang dipakai simpanPinjamController
    // Pencairan Pinjaman → tetap ada tapi akan di-refer sebagai PINJAMAN UANG / CREDIT BARANG di controller
    // Pembayaran Angsuran → tetap ada tapi akan di-refer sebagai ANGSURAN PINJAMAN UANG / ANGSURAN CREDIT BARANG
    // Kita TIDAK menghapus karena data historis masih mereferensikan ID-nya
    console.log('\nℹ️  Kategori lama (Pencairan Pinjaman, Pembayaran Angsuran) tetap dipertahankan untuk data historis.');

    await transaction.commit();
    console.log('\n🎉 Update kategori kas selesai!');
    
    // Show final state
    const allCats = await KategoriKas.findAll({ order: [['kategori_id', 'ASC']] });
    console.log('\n📋 Daftar kategori saat ini:');
    allCats.forEach(c => {
      console.log(`   [${c.kategori_id}] ${c.nama_kategori} | ${c.kode_akun || '-'} | ${c.tipe_neraca} | ${c.jenis}`);
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Update gagal, rollback:', error.message);
  } finally {
    process.exit(0);
  }
}

updateKategoriKas();
