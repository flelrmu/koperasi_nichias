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
        deskripsi: 'Kebijakan pengunduran diri anggota koperasi secara sukarela melalui sistem dengan syarat penyelesaian seluruh kewajiban keuangan.',
        kategori: 'Keanggotaan',
        ketentuan_utama: 'Tanpa Hutang Aktif',
        nilai_numerik: 0,
        tujuan: 'Menjamin seluruh kewajiban pinjaman dan sisa tagihan anggota telah diselesaikan secara penuh sebelum keanggotaan dinonaktifkan.',
        syarat_ketentuan: JSON.stringify([
          'Tidak memiliki pinjaman aktif (status Approved/Pending dengan sisa tagihan > 0).',
          'Telah melunasi seluruh kewajiban keuangan di koperasi.',
          'Mengisi form pengajuan keluar koperasi digital dengan menyertakan alasan tertulis.',
          'Persetujuan akhir wajib divalidasi oleh Sekretaris atau Ketua Koperasi.'
        ]),
        prosedur: JSON.stringify([
          'Anggota mengajukan pengunduran diri melalui Menu Profil > Keluar Koperasi.',
          'Sistem secara otomatis melakukan validasi tagihan pinjaman aktif.',
          'Sekretaris menerima notifikasi real-time dan melakukan verifikasi administratif.',
          'Sekretaris/Ketua memberikan persetujuan (Approval) atas pengajuan keluar.',
          'Keanggotaan dinyatakan nonaktif (Status: Keluar) dan dana simpanan dapat dikembalikan.'
        ]),
        icon_name: 'ShieldCheck',
        icon_color: 'text-purple-600',
        icon_bg_color: 'bg-purple-50',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        judul: 'Alokasi SHU Tahunan',
        deskripsi: 'Mengatur proporsi pembagian keuntungan bersih (laba usaha) tahunan koperasi secara adil dan berkekuatan hukum.',
        kategori: 'Keanggotaan',
        ketentuan_utama: '80% Anggota | 15% Pengurus | 5% Laba Ditahan',
        nilai_numerik: 80,
        tujuan: 'Mengatur proporsi pembagian keuntungan bersih (laba usaha) tahunan koperasi secara adil dan berkekuatan hukum.',
        syarat_ketentuan: JSON.stringify([
          'Alokasi wajib disahkan secara resmi melalui Rapat Anggota Tahunan (RAT).',
          'Laba Ditahan (5%) akan dipindahkan ke neraca tahun buku berikutnya sebagai modal cadangan.',
          'Jatah Pengurus (15%) dibagikan kepada pengurus aktif yang menjabat pada tahun buku terkait.'
        ]),
        prosedur: JSON.stringify([
          'Sistem secara otomatis mengalkulasi total laba bersih operasional tahunan.',
          'Bendahara menyesuaikan persentase alokasi di Menu SHU.',
          'Bendahara mengunci pembagian secara final (Finalize SHU).',
          'Sistem memindahkan alokasi jatah dan laba ditahan secara otomatis ke pos neraca.'
        ]),
        icon_name: 'PieChart',
        icon_color: 'text-green-600',
        icon_bg_color: 'bg-green-50',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        judul: 'Pembulatan Distribusi SHU',
        deskripsi: 'Menyederhanakan penyaluran dana tunai jatah SHU kepada anggota dan mencegah pecahan desimal yang rumit.',
        kategori: 'Simpanan',
        ketentuan_utama: 'Kelipatan Rp 100 (Bawah)',
        nilai_numerik: 100,
        tujuan: 'Menyederhanakan penyaluran dana tunai jatah SHU kepada anggota dan mencegah pecahan desimal yang rumit.',
        syarat_ketentuan: JSON.stringify([
          'Sistem melakukan pembulatan ke bawah pada kelipatan Rp 100 terdekat.',
          'Selisih pembulatan (pecahan rupiah) disimpan kembali sebagai laba ditahan koperasi.',
          'Diterapkan pada semua kalkulasi nominal akhir SHU yang diterima anggota.'
        ]),
        prosedur: JSON.stringify([
          'Sistem menghitung SHU proporsional berdasarkan total simpanan.',
          'Formula pembulatan kelipatan Rp 100 diterapkan otomatis pada hasil bagi.',
          'Anggota menerima nominal bersih yang sudah dibulatkan.'
        ]),
        icon_name: 'Wallet',
        icon_color: 'text-blue-600',
        icon_bg_color: 'bg-blue-50',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        judul: 'Tutup Buku Neraca Bulanan',
        deskripsi: 'Membekukan data transaksi bulanan guna menjaga integritas laporan keuangan dari mutasi sepihak.',
        kategori: 'Keanggotaan',
        ketentuan_utama: 'Akhir Periode Bulanan',
        nilai_numerik: 1,
        tujuan: 'Membekukan data transaksi bulanan guna menjaga integritas laporan keuangan dari mutasi sepihak.',
        syarat_ketentuan: JSON.stringify([
          'Tutup Buku dilakukan oleh Bendahara di akhir periode bulan berjalan.',
          'Seluruh pencatatan transaksi (debit/kredit) pada bulan yang ditutup akan dikunci secara permanen.',
          'Saldo akhir bulan berjalan otomatis menjadi saldo awal bulan berikutnya.',
          'Batal Tutup Buku (Unlock) memerlukan persetujuan dari Ketua Koperasi.'
        ]),
        prosedur: JSON.stringify([
          'Bendahara merampungkan seluruh input mutasi arus kas harian.',
          'Bendahara meninjau keseimbangan laporan neraca bulanan.',
          'Bendahara mengeksekusi aksi Tutup Buku di tab Neraca.',
          'Sistem mengunci jurnal kas dan mencatatkan snapshot saldo akhir ke database.'
        ]),
        icon_name: 'Lock',
        icon_color: 'text-red-600',
        icon_bg_color: 'bg-red-50',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('peraturan', null, {});
  },
};
