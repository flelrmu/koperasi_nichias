'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    
    // 1. Add Konfigurasi if not exists
    const configs = [
      { nama_config: 'MAX_PINJAMAN_UANG', nilai: '15000000', keterangan: 'Maksimal pinjaman uang untuk semua jabatan', updated_by: 1, updated_at: now },
      { nama_config: 'LIMIT_ANGSURAN_STAFF', nilai: '2000000', keterangan: 'Batas maksimal angsuran per bulan untuk Staff', updated_by: 1, updated_at: now },
      { nama_config: 'LIMIT_ANGSURAN_ASST_MGR', nilai: '3000000', keterangan: 'Batas maksimal angsuran per bulan untuk Assistant Manager', updated_by: 1, updated_at: now },
      { nama_config: 'LIMIT_ANGSURAN_MGR', nilai: '5000000', keterangan: 'Batas maksimal angsuran per bulan untuk Manager', updated_by: 1, updated_at: now },
      { nama_config: 'BUNGA_10_BULAN', nilai: '0.10', keterangan: 'Suku bunga untuk tenor 10 bulan', updated_by: 1, updated_at: now },
      { nama_config: 'BUNGA_15_BULAN', nilai: '0.15', keterangan: 'Suku bunga untuk tenor 15 bulan', updated_by: 1, updated_at: now },
      { nama_config: 'BUNGA_20_BULAN', nilai: '0.20', keterangan: 'Suku bunga untuk tenor 20 bulan', updated_by: 1, updated_at: now }
    ];

    for (const config of configs) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT config_id FROM konfigurasi WHERE nama_config = '${config.nama_config}'`
      );
      if (existing.length === 0) {
        await queryInterface.bulkInsert('konfigurasi', [config]);
      }
    }

    // 2. Add Peraturan for UI
    const peraturan = [
      {
        judul: 'Maksimal Pinjaman Uang',
        deskripsi: 'Batas maksimal pinjaman dalam bentuk uang tunai untuk semua jabatan anggota.',
        kategori: 'Pinjaman',
        ketentuan_utama: 'Rp 15.000.000',
        nilai_numerik: 15000000,
        tujuan: 'Menjaga likuiditas dana tunai koperasi dan pemerataan bantuan keuangan.',
        syarat_ketentuan: JSON.stringify(['Maksimal tenor adalah 10 bulan.', 'Hanya untuk kebutuhan mendesak.', 'Dapat diajukan setelah 6 bulan menjadi anggota.']),
        prosedur: JSON.stringify(['Ajukan melalui dashboard anggota.', 'Verifikasi oleh Koordinator Simpan Pinjam.', 'Pencairan via transfer bank.']),
        icon_name: 'Wallet',
        icon_color: 'text-blue-600',
        icon_bg_color: 'bg-blue-50',
        created_at: now,
        updated_at: now
      },
      {
        judul: 'Limit Angsuran Staff',
        deskripsi: 'Maksimal pemotongan gaji per bulan untuk angsuran pinjaman bagi anggota dengan jabatan Staff.',
        kategori: 'Pinjaman',
        ketentuan_utama: 'Rp 2.000.000 / bln',
        nilai_numerik: 2000000,
        tujuan: 'Memastikan anggota masih memiliki sisa gaji yang cukup untuk kebutuhan hidup.',
        syarat_ketentuan: JSON.stringify(['Berlaku untuk total seluruh pinjaman yang sedang berjalan.', 'Jika melebihi limit, pengajuan akan otomatis ditolak sistem.']),
        prosedur: JSON.stringify(['Sistem mengecek jabatan anggota saat simulasi.', 'Validasi dilakukan sebelum formulir dikirim.']),
        icon_name: 'Briefcase',
        icon_color: 'text-gray-600',
        icon_bg_color: 'bg-gray-50',
        created_at: now,
        updated_at: now
      },
      {
        judul: 'Limit Angsuran Asst Manager',
        deskripsi: 'Maksimal pemotongan gaji per bulan untuk angsuran pinjaman bagi anggota dengan jabatan Assistant Manager.',
        kategori: 'Pinjaman',
        ketentuan_utama: 'Rp 3.000.000 / bln',
        nilai_numerik: 3000000,
        tujuan: 'Memastikan rasio utang tetap sehat sesuai dengan tingkat pendapatan.',
        syarat_ketentuan: JSON.stringify(['Berlaku untuk akumulasi pinjaman uang dan barang.']),
        prosedur: JSON.stringify(['Pengecekan otomatis berdasarkan data keanggotaan.']),
        icon_name: 'Briefcase',
        icon_color: 'text-indigo-600',
        icon_bg_color: 'bg-indigo-50',
        created_at: now,
        updated_at: now
      },
      {
        judul: 'Limit Angsuran Manager',
        deskripsi: 'Maksimal pemotongan gaji per bulan untuk angsuran pinjaman bagi anggota dengan jabatan Manager.',
        kategori: 'Pinjaman',
        ketentuan_utama: 'Rp 5.000.000 / bln',
        nilai_numerik: 5000000,
        tujuan: 'Menetapkan batas plafon cicilan yang aman bagi level manajemen.',
        syarat_ketentuan: JSON.stringify(['Maksimal angsuran bulanan adalah Rp 5.000.000.']),
        prosedur: JSON.stringify(['Validasi sistem pada tahap persetujuan.']),
        icon_name: 'Briefcase',
        icon_color: 'text-purple-600',
        icon_bg_color: 'bg-purple-50',
        created_at: now,
        updated_at: now
      },
      {
        judul: 'Bunga 10 Bulan',
        deskripsi: 'Suku bunga atau profit margin yang dikenakan untuk pinjaman dengan masa tenor 10 bulan.',
        kategori: 'Pinjaman',
        ketentuan_utama: '10% Total',
        nilai_numerik: 0.10,
        tujuan: 'Sebagai bagi hasil pengelolaan dana bagi peminjam jangka pendek.',
        syarat_ketentuan: JSON.stringify(['Bunga dihitung flat dari nilai pinjaman disetujui.', 'Berlaku untuk pinjaman uang dan barang.']),
        prosedur: JSON.stringify(['Otomatis diaplikasikan pada simulasi tenor 10 bulan.']),
        icon_name: 'TrendingUp',
        icon_color: 'text-green-600',
        icon_bg_color: 'bg-green-50',
        created_at: now,
        updated_at: now
      },
      {
        judul: 'Bunga 15 Bulan',
        deskripsi: 'Suku bunga atau profit margin yang dikenakan untuk pinjaman dengan masa tenor 15 bulan.',
        kategori: 'Pinjaman',
        ketentuan_utama: '15% Total',
        nilai_numerik: 0.15,
        tujuan: 'Sebagai bagi hasil pengelolaan dana bagi peminjam jangka menengah.',
        syarat_ketentuan: JSON.stringify(['Hanya berlaku untuk pinjaman barang.']),
        prosedur: JSON.stringify(['Otomatis diaplikasikan pada simulasi tenor 15 bulan.']),
        icon_name: 'TrendingUp',
        icon_color: 'text-yellow-600',
        icon_bg_color: 'bg-yellow-50',
        created_at: now,
        updated_at: now
      },
      {
        judul: 'Bunga 20 Bulan',
        deskripsi: 'Suku bunga atau profit margin yang dikenakan untuk pinjaman dengan masa tenor 20 bulan.',
        kategori: 'Pinjaman',
        ketentuan_utama: '20% Total',
        nilai_numerik: 0.20,
        tujuan: 'Sebagai bagi hasil pengelolaan dana bagi peminjam jangka panjang.',
        syarat_ketentuan: JSON.stringify(['Hanya berlaku untuk pinjaman barang.']),
        prosedur: JSON.stringify(['Otomatis diaplikasikan pada simulasi tenor 20 bulan.']),
        icon_name: 'TrendingUp',
        icon_color: 'text-red-600',
        icon_bg_color: 'bg-red-50',
        created_at: now,
        updated_at: now
      }
    ];

    for (const rule of peraturan) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT peraturan_id FROM peraturan WHERE judul = '${rule.judul}'`
      );
      if (existing.length === 0) {
        await queryInterface.bulkInsert('peraturan', [rule]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // We don't necessarily want to delete them in down if they are system critical, 
    // but for seeder completeness:
    await queryInterface.bulkDelete('konfigurasi', {
      nama_config: [
        'MAX_PINJAMAN_UANG', 'LIMIT_ANGSURAN_STAFF', 'LIMIT_ANGSURAN_ASST_MGR', 'LIMIT_ANGSURAN_MGR',
        'BUNGA_10_BULAN', 'BUNGA_15_BULAN', 'BUNGA_20_BULAN'
      ]
    });
    await queryInterface.bulkDelete('peraturan', {
      judul: [
        'Maksimal Pinjaman Uang', 'Limit Angsuran Staff', 'Limit Angsuran Asst Manager', 'Limit Angsuran Manager',
        'Bunga 10 Bulan', 'Bunga 15 Bulan', 'Bunga 20 Bulan'
      ]
    });
  }
};
