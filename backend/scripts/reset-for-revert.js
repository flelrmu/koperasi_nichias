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
  User,
  Anggota,
  Notifikasi
} = require('../models');

async function resetAndRevert() {
  const transaction = await sequelize.transaction();
  try {
    console.log('🗑️  Mereset data transaksi kas dan simpan pinjam...');
    
    // Clear transactional tables
    await ArusKas.destroy({ where: {}, transaction });
    await Angsuran.destroy({ where: {}, transaction });
    await Pinjaman.destroy({ where: {}, transaction });
    await TransaksiSimpanan.destroy({ where: {}, transaction });
    await Simpanan.destroy({ where: {}, transaction });
    await Notifikasi.destroy({ where: {}, transaction });
    
    await SaldoBulanan.destroy({ where: {}, transaction });
    
    await PembagianShu.destroy({ where: {}, transaction });
    await RekapShu.destroy({ where: {}, transaction });
    await PeriodeKeuangan.destroy({ where: {}, transaction });
    
    console.log('🔄 Memperbarui jenis Kategori Kas (Pemasukan = Debit, Pengeluaran = Kredit)...');
    // Swap jenis di KategoriKas
    await sequelize.query("UPDATE kategori_kas SET jenis = 'TEMP' WHERE jenis = 'Kredit'", { transaction });
    await sequelize.query("UPDATE kategori_kas SET jenis = 'Kredit' WHERE jenis = 'Debit'", { transaction });
    await sequelize.query("UPDATE kategori_kas SET jenis = 'Debit' WHERE jenis = 'TEMP'", { transaction });
    await sequelize.query("UPDATE kategori_kas SET saldo_awal = 0", { transaction });

    console.log('👥 Mengelola akun pengguna...');
    // Dapatkan semua user dengan role 'anggota'
    const anggotaUsers = await User.findAll({ 
      where: { role: 'anggota' },
      order: [['user_id', 'ASC']],
      transaction
    });

    if (anggotaUsers.length > 15) {
      const usersToDelete = anggotaUsers.slice(15);
      const userIdsToDelete = usersToDelete.map(u => u.user_id);
      
      console.log(`   Menghapus ${userIdsToDelete.length} akun anggota...`);
      // Hapus dari tabel Anggota terlebih dahulu
      await Anggota.destroy({ 
        where: { user_id: userIdsToDelete },
        transaction
      });
      // Lalu hapus dari tabel User
      await User.destroy({ 
        where: { user_id: userIdsToDelete },
        transaction
      });
    } else {
      console.log(`   Jumlah anggota saat ini adalah ${anggotaUsers.length}, tidak ada yang dihapus.`);
    }

    await transaction.commit();
    console.log('✅ Reset dan Revert berhasil!');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Terjadi kesalahan:', error);
  } finally {
    process.exit();
  }
}

resetAndRevert();
