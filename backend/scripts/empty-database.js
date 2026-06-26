const { 
  sequelize, 
  ArusKas, 
  Pinjaman, 
  Angsuran, 
  Simpanan, 
  TransaksiSimpanan, 
  SaldoBulanan, 
  PembagianShu, 
  RekapShu, 
  PeriodeKeuangan,
  KategoriKas,
  Notifikasi
} = require('../models');

async function emptyDatabase() {
  const transaction = await sequelize.transaction();
  try {
    console.log('🗑️  Mulai mengosongkan transaksi database...');

    // 1. Hapus data transaksi/operasional
    console.log('- Menghapus tabel Angsuran...');
    await Angsuran.destroy({ where: {}, transaction });

    console.log('- Menghapus tabel Pinjaman...');
    await Pinjaman.destroy({ where: {}, transaction });

    console.log('- Menghapus tabel TransaksiSimpanan...');
    await TransaksiSimpanan.destroy({ where: {}, transaction });

    console.log('- Menghapus tabel Notifikasi...');
    await Notifikasi.destroy({ where: {}, transaction });

    console.log('- Menghapus tabel SaldoBulanan...');
    await SaldoBulanan.destroy({ where: {}, transaction });

    console.log('- Menghapus tabel PembagianShu...');
    await PembagianShu.destroy({ where: {}, transaction });

    console.log('- Menghapus tabel RekapShu...');
    await RekapShu.destroy({ where: {}, transaction });

    console.log('- Menghapus tabel PeriodeKeuangan...');
    await PeriodeKeuangan.destroy({ where: {}, transaction });

    console.log('- Menghapus tabel ArusKas...');
    await ArusKas.destroy({ where: {}, transaction });

    // 2. Reset saldo simpanan anggota ke 0
    console.log('- Mereset saldo Simpanan Anggota ke 0...');
    await Simpanan.update(
      { saldo_pokok: 0, saldo_wajib: 0, saldo_sukarela: 0, last_updated: new Date() },
      { where: {}, transaction }
    );

    // 3. Reset saldo_awal kategori kas ke 0
    console.log('- Mereset saldo awal di KategoriKas ke 0...');
    await KategoriKas.update(
      { saldo_awal: 0 },
      { where: {}, transaction }
    );

    await transaction.commit();
    console.log('✅ Berhasil mengosongkan transaksi database!');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Gagal mengosongkan database:', error);
  } finally {
    process.exit();
  }
}

emptyDatabase();
