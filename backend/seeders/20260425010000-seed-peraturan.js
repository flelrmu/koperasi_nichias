'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('peraturan', [
      {
        judul: 'Simpanan Pokok',
        deskripsi: 'Simpanan yang dibayarkan sekali saat pertama kali menjadi anggota.',
        kategori: 'Simpanan',
        ketentuan_utama: 'Rp 100.000',
        nilai_numerik: 100000,
        tujuan: 'Sebagai modal awal pembentukan koperasi dan bukti keanggotaan yang sah.',
        syarat_ketentuan: JSON.stringify([
          'Dibayar tunai saat pendaftaran menjadi anggota.',
          'Tidak dapat diambil selama masih menjadi anggota.',
          'Akan dikembalikan saat anggota mengundurkan diri secara resmi.'
        ]),
        prosedur: JSON.stringify([
          'Mengisi formulir pendaftaran anggota.',
          'Melakukan pembayaran ke Bendahara Koperasi.',
          'Menerima bukti pembayaran dan sertifikat keanggotaan sementara.'
        ]),
        icon_name: 'Wallet',
        icon_color: 'text-blue-600',
        icon_bg_color: 'bg-blue-50',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        judul: 'Simpanan Wajib',
        deskripsi: 'Simpanan rutin yang dibayarkan setiap bulan oleh setiap anggota.',
        kategori: 'Simpanan',
        ketentuan_utama: 'Rp 50.000 / bln',
        nilai_numerik: 50000,
        tujuan: 'Untuk memperkuat permodalan koperasi secara berkelanjutan guna mendukung unit usaha.',
        syarat_ketentuan: JSON.stringify([
          'Wajib dibayar oleh setiap anggota setiap bulan.',
          'Pemotongan dilakukan secara otomatis melalui payroll (gaji).',
          'Besaran dapat berubah berdasarkan keputusan Rapat Anggota Tahunan (RAT).'
        ]),
        prosedur: JSON.stringify([
          'Anggota menandatangani surat kuasa potong gaji saat aktivasi akun.',
          'Sistem melakukan rekonsiliasi data setiap tanggal 25.',
          'Saldo simpanan wajib akan terupdate di dashboard anggota setiap awal bulan.'
        ]),
        icon_name: 'Calendar',
        icon_color: 'text-indigo-600',
        icon_bg_color: 'bg-indigo-50',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        judul: 'Simpanan Sukarela',
        deskripsi: 'Simpanan yang dapat dilakukan kapan saja dengan nominal bebas.',
        kategori: 'Simpanan',
        ketentuan_utama: 'Min. Rp 10.000',
        nilai_numerik: 10000,
        tujuan: 'Memberikan sarana menabung bagi anggota dengan bagi hasil yang kompetitif.',
        syarat_ketentuan: JSON.stringify([
          'Nominal setoran minimal Rp 10.000.',
          'Dapat ditarik sewaktu-waktu sesuai ketentuan penarikan.',
          'Mendapatkan jasa simpanan yang dihitung berdasarkan saldo rata-rata bulanan.'
        ]),
        prosedur: JSON.stringify([
          'Pilih menu "Simpanan" di dashboard.',
          'Masukkan nominal yang ingin disetorkan.',
          'Lakukan transfer ke rekening resmi Koperasi Nichias.',
          'Unggah bukti transfer untuk verifikasi admin.'
        ]),
        icon_name: 'FileText',
        icon_color: 'text-green-600',
        icon_bg_color: 'bg-green-50',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        judul: 'Maksimal Pinjaman',
        deskripsi: 'Batas maksimal pengajuan pinjaman berdasarkan total simpanan.',
        kategori: 'Pinjaman',
        ketentuan_utama: '10x Total Simpanan',
        nilai_numerik: 10,
        tujuan: 'Menjaga kesehatan rasio kredit dan memastikan keamanan dana anggota.',
        syarat_ketentuan: JSON.stringify([
          'Anggota telah bergabung minimal selama 6 bulan.',
          'Total angsuran tidak boleh melebihi 40% dari total gaji bulanan.',
          'Harus memiliki penjamin dari sesama anggota (untuk nominal tertentu).'
        ]),
        prosedur: JSON.stringify([
          'Ajukan pinjaman melalui menu "Pinjaman".',
          'Sistem akan memvalidasi limit pinjaman berdasarkan saldo simpanan.',
          'Survey dan verifikasi oleh tim Kredit Koperasi.',
          'Persetujuan oleh Ketua Koperasi.'
        ]),
        icon_name: 'CreditCard',
        icon_color: 'text-orange-600',
        icon_bg_color: 'bg-orange-50',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        judul: 'Suku Bunga',
        deskripsi: 'Bunga pinjaman yang ditetapkan oleh koperasi per bulan.',
        kategori: 'Pinjaman',
        ketentuan_utama: '1% Flat / bulan',
        nilai_numerik: 1.00,
        tujuan: 'Sebagai imbal jasa atas penggunaan dana dan biaya operasional pengelolaan pinjaman.',
        syarat_ketentuan: JSON.stringify([
          'Suku bunga bersifat Flat (Tetap) selama masa pinjaman.',
          'Dihitung dari total plafon pinjaman awal.',
          'Bunga dikembalikan kepada anggota dalam bentuk pembagian SHU di akhir tahun.'
        ]),
        prosedur: JSON.stringify([
          'Simulasi angsuran ditampilkan saat pengajuan pinjaman.',
          'Tabel angsuran (Pokok + Bunga) dilampirkan dalam perjanjian pinjaman.',
          'Pemotongan angsuran dimulai satu bulan setelah pencairan.'
        ]),
        icon_name: 'Info',
        icon_color: 'text-red-600',
        icon_bg_color: 'bg-red-50',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        judul: 'Pengunduran Diri',
        deskripsi: 'Syarat bagi anggota yang ingin mengundurkan diri dari koperasi.',
        kategori: 'Keanggotaan',
        ketentuan_utama: 'Min. 12 bln Keanggotaan',
        nilai_numerik: 12,
        tujuan: 'Mengatur hak dan kewajiban anggota yang ingin mengakhiri masa keanggotaannya.',
        syarat_ketentuan: JSON.stringify([
          'Telah melunasi seluruh kewajiban pinjaman.',
          'Mengisi form pengunduran diri di menu Profil.',
          'Pengembalian simpanan dilakukan maksimal 30 hari setelah permohonan disetujui.'
        ]),
        prosedur: JSON.stringify([
          'Mengajukan permohonan melalui sistem (Menu Profil > Keluar Koperasi).',
          'Proses verifikasi oleh Sekretaris dan Bendahara.',
          'Wawancara singkat jika diperlukan.',
          'Penerbitan Surat Keterangan Selesai Keanggotaan.'
        ]),
        icon_name: 'ShieldCheck',
        icon_color: 'text-purple-600',
        icon_bg_color: 'bg-purple-50',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('peraturan', null, {});
  },
};
