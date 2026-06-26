const { 
  sequelize, 
  SaldoBulanan, 
  ArusKas, 
  Pinjaman,
  Anggota,
  KategoriKas
} = require('../models');

async function setupNeraca() {
  const transaction = await sequelize.transaction();
  try {
    console.log('🔍 Mengambil data anggota aktif untuk relasi...');
    const membersList = await Anggota.findAll({ 
      limit: 2, 
      order: [['anggota_id', 'ASC']], 
      transaction 
    });

    if (membersList.length < 2) {
      throw new Error('Data anggota tidak mencukupi untuk membuat pinjaman. Harap jalankan import-members.js terlebih dahulu.');
    }

    const member1 = membersList[0];
    const member2 = membersList[1];
    console.log(`- Anggota 1: ID ${member1.anggota_id} (${member1.nama_lengkap})`);
    console.log(`- Anggota 2: ID ${member2.anggota_id} (${member2.nama_lengkap})`);

    console.log('🗑️  Mengosongkan SaldoBulanan, ArusKas, dan Pinjaman lama...');
    await SaldoBulanan.destroy({ where: {}, transaction });
    await ArusKas.destroy({ where: {}, transaction });
    await Pinjaman.destroy({ where: {}, transaction });

    console.log('📌 Memasukkan Saldo Awal (SaldoBulanan) untuk Juni 2026...');
    const startingBalances = [
      { kategori_id: 46, saldo_awal: 2039000.00 },        // CASH
      { kategori_id: 47, saldo_awal: 789497060.46 },     // BANK
      { kategori_id: 9,  saldo_awal: 249390490.00 },      // PINJAMAN UANG
      { kategori_id: 10, saldo_awal: 149592095.00 },      // CREDIT BARANG
      { kategori_id: 14, saldo_awal: 200000000.00 },      // INVESTASI
      { kategori_id: 15, saldo_awal: 29418000.00 },       // INCOME TAX
      { kategori_id: 19, saldo_awal: -49563109.66 },      // HUTANG BIAYA
      { kategori_id: 20, saldo_awal: -74988.63 },         // TAX LIABILITY
      { kategori_id: 27, saldo_awal: -150000000.00 },     // LOAN
      { kategori_id: 45, saldo_awal: -1013253600.00 },    // SIMPANAN ANGGOTA (Combined)
      { kategori_id: 44, saldo_awal: -68872578.56 },      // LABA DITAHAN
      
      // Override member savings details to 0 in SaldoBulanan to prevent double addition
      { kategori_id: 1,  saldo_awal: 0.00 },              // Simpanan Pokok
      { kategori_id: 2,  saldo_awal: 0.00 },              // Simpanan Wajib
      { kategori_id: 3,  saldo_awal: 0.00 }               // Simpanan Sukarela
    ];

    for (const sb of startingBalances) {
      await SaldoBulanan.create({
        kategori_id: sb.kategori_id,
        bulan: 6,
        tahun: 2026,
        saldo_awal: sb.saldo_awal
      }, { transaction });
    }

    console.log('💵 Memasukkan transaksi Arus Kas (ArusKas)...');
    const transactions = [
      // 1. PROFIT/LOSS Starting Balance (May 31, 2026)
      {
        kategori_id: 35, // PENDAPATAN RENTAL (Income)
        jenis: 'Debit', // Uang Masuk
        nominal: 138172368.61,
        metode_pembayaran: 'BANK',
        tanggal: '2026-05-31',
        keterangan: 'Saldo Awal Profit/Loss Pembukuan Kumulatif',
        kode_transaksi: 'SYS-PL-INIT',
        saldo_akhir: 0
      },
      // 2. CASH Inflow (June 1, 2026)
      {
        kategori_id: 35, // PENDAPATAN RENTAL
        jenis: 'Debit',
        nominal: 1100000.00,
        metode_pembayaran: 'CASH',
        tanggal: '2026-06-01',
        keterangan: 'Pendapatan Rental Cash',
        kode_transaksi: 'TRX-260601-01',
        saldo_akhir: 0
      },
      // 3. Tagihan Pinjaman Repayment (June 10, 2026)
      {
        kategori_id: 30, // ANGSURAN PINJAMAN UANG
        jenis: 'Debit',
        nominal: 64691000.00,
        metode_pembayaran: 'BANK',
        tanggal: '2026-06-10',
        keterangan: 'Pembayaran Angsuran Pinjaman Uang',
        kode_transaksi: 'TRX-260610-01',
        saldo_akhir: 0
      },
      // 4. Tagihan Credit Barang Repayment (June 11, 2026)
      {
        kategori_id: 31, // ANGSURAN CREDIT BARANG
        jenis: 'Debit',
        nominal: 21042122.00,
        metode_pembayaran: 'BANK',
        tanggal: '2026-06-11',
        keterangan: 'Pembayaran Angsuran Pinjaman Barang',
        kode_transaksi: 'TRX-260611-01',
        saldo_akhir: 0
      },
      // 5. Simpanan Anggota Deposit (June 7, 2026)
      {
        kategori_id: 45, // SIMPANAN ANGGOTA
        jenis: 'Debit',
        nominal: 15850000.00,
        metode_pembayaran: 'BANK',
        tanggal: '2026-06-07',
        keterangan: 'Penerimaan Simpanan Anggota Kumulatif',
        kode_transaksi: 'TRX-260607-01',
        saldo_akhir: 0
      },
      // 6. Bank Inflow Adjustment (Rental Income) (June 12, 2026)
      {
        kategori_id: 35, // PENDAPATAN RENTAL
        jenis: 'Debit',
        nominal: 16945829.51,
        metode_pembayaran: 'BANK',
        tanggal: '2026-06-12',
        keterangan: 'Pendapatan Rental Bank',
        kode_transaksi: 'TRX-260612-01',
        saldo_akhir: 0
      },
      // 7. Tagihan Pinjaman Disbursement (June 2, 2026)
      {
        kategori_id: 9, // PINJAMAN UANG
        jenis: 'Kredit', // Uang Keluar
        nominal: 41800000.00,
        metode_pembayaran: 'BANK',
        tanggal: '2026-06-02',
        keterangan: 'Pencairan Pinjaman Uang',
        kode_transaksi: 'TRX-260602-01',
        saldo_akhir: 0
      },
      // 8. Tagihan Credit Barang Disbursement (June 3, 2026) - Non-Cash
      {
        kategori_id: 10, // CREDIT BARANG
        jenis: 'Kredit',
        nominal: 21450000.00,
        metode_pembayaran: null,
        tanggal: '2026-06-03',
        keterangan: 'Pencairan Pinjaman Barang',
        kode_transaksi: 'TRX-260603-01',
        saldo_akhir: 0
      },
      // 9. Income Tax Payment (June 4, 2026)
      {
        kategori_id: 15, // INCOME TAX
        jenis: 'Kredit',
        nominal: 358000.00,
        metode_pembayaran: 'BANK',
        tanggal: '2026-06-04',
        keterangan: 'Pembayaran Pajak Pendapatan',
        kode_transaksi: 'TRX-260604-01',
        saldo_akhir: 0
      },
      // 10. Hutang Biaya Payment (June 5, 2026)
      {
        kategori_id: 19, // HUTANG BIAYA
        jenis: 'Kredit',
        nominal: 41400000.00,
        metode_pembayaran: 'BANK',
        tanggal: '2026-06-05',
        keterangan: 'Pelunasan Hutang Biaya',
        kode_transaksi: 'TRX-260605-01',
        saldo_akhir: 0
      },
      // 11. Simpanan Anggota Withdrawal (June 6, 2026)
      {
        kategori_id: 45, // SIMPANAN ANGGOTA
        jenis: 'Kredit',
        nominal: 16250000.00,
        metode_pembayaran: 'BANK',
        tanggal: '2026-06-06',
        keterangan: 'Penarikan Simpanan Anggota',
        kode_transaksi: 'TRX-260606-01',
        saldo_akhir: 0
      },
      // 12. Bank Outflow Adjustment (Expense) (June 13, 2026)
      {
        kategori_id: 38, // BEBAN OPERASIONAL
        jenis: 'Kredit',
        nominal: 10510065.90,
        metode_pembayaran: 'BANK',
        tanggal: '2026-06-13',
        keterangan: 'Beban Operasional Bank',
        kode_transaksi: 'TRX-260613-01',
        saldo_akhir: 0
      },
      // 13. Non-Cash Hutang Biaya Incurred (June 8, 2026) - Non-Cash
      {
        kategori_id: 19, // HUTANG BIAYA
        jenis: 'Debit', // Uang Masuk
        nominal: 160400000.00,
        metode_pembayaran: null,
        tanggal: '2026-06-08',
        keterangan: 'Pencatatan Hutang Biaya Baru',
        kode_transaksi: 'TRX-260608-01',
        saldo_akhir: 0
      },
      // 14. Non-Cash Beban Operasional (June 8, 2026) - Non-Cash
      {
        kategori_id: 38, // BEBAN OPERASIONAL
        jenis: 'Kredit', // Uang Keluar
        nominal: 160400000.00,
        metode_pembayaran: null,
        tanggal: '2026-06-08',
        keterangan: 'Beban Operasional Non-Cash',
        kode_transaksi: 'TRX-260608-02',
        saldo_akhir: 0
      },
      // 15. Non-Cash Rental Income (June 9, 2026) - Non-Cash
      {
        kategori_id: 35, // PENDAPATAN RENTAL
        jenis: 'Debit',
        nominal: 21450000.00, // Adjusted to result in net loss of 131,414,236.39
        metode_pembayaran: null,
        tanggal: '2026-06-09',
        keterangan: 'Pendapatan Rental Non-Cash',
        kode_transaksi: 'TRX-260609-01',
        saldo_akhir: 0
      }
    ];

    for (const trx of transactions) {
      await ArusKas.create(trx, { transaction });
    }

    console.log('📝 Membuat profil pinjaman (Pinjaman) untuk anggota...');
    // Pinjaman 1: member1 - Uang - 41.800.000
    await Pinjaman.create({
      anggota_id: member1.anggota_id,
      jenis_pinjaman: 'Uang',
      keperluan: 'Kebutuhan Pribadi / Desak',
      jumlah_pinjaman: 41800000.00,
      terbilang: 'Empat Puluh Satu Juta Delapan Ratus Ribu Rupiah',
      tenor: 10,
      tanggal_pengajuan: '2026-06-01',
      pinjaman_disetujui: 41800000.00,
      total_bunga: 4180000.00,
      total_angsuran: 45980000.00,
      angsuran_per_bulan: 4598000.00,
      status: 'Approved',
      sisa_tagihan: 45980000.00,
      nomor_invoice: 'INV/PNJ/2026/06/001'
    }, { transaction });

    // Pinjaman 2: member2 - Barang - 21.450.000
    await Pinjaman.create({
      anggota_id: member2.anggota_id,
      jenis_pinjaman: 'Barang',
      keperluan: 'Pembelian Barang / Gadget',
      jumlah_pinjaman: 21450000.00,
      terbilang: 'Dua Puluh Satu Juta Empat Ratus Lima Puluh Ribu Rupiah',
      tenor: 10,
      tanggal_pengajuan: '2026-06-02',
      pinjaman_disetujui: 21450000.00,
      total_bunga: 2145000.00,
      total_angsuran: 23595000.00,
      angsuran_per_bulan: 2359500.00,
      status: 'Approved',
      sisa_tagihan: 23595000.00,
      nomor_invoice: 'INV/PNJ/2026/06/002'
    }, { transaction });

    console.log('🔄 Menyelaraskan saldo_awal global KategoriKas...');
    // Adjust BANK global starting balance to (789497060.46 - May 31 PL initialization amount)
    await KategoriKas.update(
      { saldo_awal: 651324691.85 },
      { where: { nama_kategori: 'BANK' }, transaction }
    );
    await KategoriKas.update(
      { saldo_awal: 2039000.00 },
      { where: { nama_kategori: 'CASH' }, transaction }
    );

    await transaction.commit();
    console.log('✅ Neraca berhasil disetup sesuai gambar!');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Terjadi kesalahan saat setup neraca:', error);
  } finally {
    process.exit();
  }
}

setupNeraca();
