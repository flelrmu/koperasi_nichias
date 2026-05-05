# Checklist Fungsi Proyek Koperasi Nichias

Dokumen ini berisi daftar seluruh fungsi (API Backend & Fitur Frontend) yang ada dalam proyek Koperasi Nichias untuk proses pengecekan (QA/Testing).

## 1. Modul Autentikasi (Backend: authController.js)
- [✅] **Register Anggota Baru (`register`)**: Mendaftarkan calon anggota dengan validasi domain email, kompleksitas password, dan pengecekan duplikasi NIK/Email. Mengirim notifikasi real-time ke Sekretaris.
- [✅] **Login Multi-Role (`login`)**: Autentikasi untuk Anggota dan Pengurus dengan JWT. Menentukan jalur redirect berdasarkan role dan status keanggotaan.
- [✅] **Admin Create User (`adminCreateUser`)**: Fungsi khusus pengurus untuk membuat user baru (Anggota/Pengurus) secara langsung. Otomatis membuat simpanan pokok jika tipe yang dibuat adalah Anggota.

## 2. Modul Manajemen User (Backend: userController.js)
- [✅] **Get Anggota List (`getAnggotaList`)**: Mengambil daftar seluruh anggota koperasi.
- [✅] **Get Pengurus List (`getPengurusList`)**: Mengambil daftar seluruh pengurus jajaran manajemen.
- [✅] **Get User Detail (`getUserDetail`)**: Mengambil informasi detail satu user (Anggota/Pengurus).
- [✅] **Update User (`updateUser`)**: Mengubah data user (Email, Role, Nama, dll) oleh admin.
- [✅] **Delete User (`deleteUser`)**: Menghapus data user secara permanen beserta data terkait (Simpanan, Pinjaman, dll).
- [✅] **Approve Member (`approveMember`)**: Menyetujui pendaftaran calon anggota, generate nomor anggota, dan buat setoran pokok awal secara otomatis.
- [✅] **Get Profile (`getProfile`)**: Mengambil profil user yang sedang login beserta ringkasan simpanan/pinjamannya.
- [✅] **Update Profile (`updateProfile`)**: User mengupdate data mandiri (No HP, Alamat, dll).
- [✅] **Change Password (`changePassword`)**: Mengubah password user yang sedang login dengan validasi password lama.
- [✅] **Upload Profile Photo (`uploadProfilePhoto`)**: Mengunggah foto profil ke server.
- [✅] **Request Keluar (`requestKeluar`)**: Anggota mengajukan pengunduran diri (hanya jika tidak ada hutang).
- [✅] **Cancel Keluar (`cancelKeluar`)**: Anggota membatalkan pengajuan pengunduran diri yang masih pending.
- [✅] **Approve Keluar (`approveKeluar`)**: Sekretaris menyetujui pengunduran diri anggota.

## 3. Modul Simpanan (Backend: simpanPinjamController.js)
- [✅] **Get All Simpanan (`getAllSimpanan`)**: Mengambil daftar saldo simpanan seluruh anggota.
- [✅] **Update Simpanan (`updateSimpanan`)**: Mengoreksi saldo simpanan anggota secara manual.
- [✅] **Create Transaksi Simpanan (`createTransaksiSimpanan`)**: Mencatat setoran (Pokok/Wajib/Sukarela) atau penarikan (hanya Sukarela).
- [✅] **Bulk Create Simpanan Wajib (`bulkCreateSimpananWajib`)**: Mencatat setoran wajib bulanan untuk seluruh atau sebagian anggota terpilih secara kolektif.
- [✅] **Get Konfigurasi Simpanan (`getKonfigurasiSimpanan`)**: Mengambil nilai konfigurasi simpanan (nominal wajib/pokok).
- [✅] **Get Transaksi By Anggota (`getTransaksiByAnggota`)**: Mengambil riwayat transaksi simpanan per anggota.

## 4. Modul Pinjaman (Backend: simpanPinjamController.js)
- [✅] **Get All Pinjaman (`getAllPinjaman`)**: Mengambil daftar seluruh pengajuan pinjaman.
- [✅] **Get Pinjaman By ID (`getPinjamanById`)**: Mengambil detail satu pinjaman.
- [✅] **Create Pinjaman (`createPinjaman`)**: Anggota mengajukan pinjaman baru (Uang/Barang) dengan validasi limit dan tenor.
- [✅] **Update Pinjaman Status (`updatePinjamanStatus`)**: Koordinator menyetujui/menolak pinjaman, menghitung bunga, angsuran, dan sisa tagihan secara otomatis.
- [✅] **Delete Pinjaman (`deletePinjaman`)**: Menghapus data pengajuan pinjaman.
- [✅] **Bulk Process Angsuran (`bulkProcessAngsuran`)**: Memproses angsuran bulanan secara kolektif untuk pinjaman yang sudah disetujui.
- [✅] **Lunaskan Pinjaman (`lunaskanPinjaman`)**: Melunasi seluruh sisa tagihan pinjaman anggota sekaligus.

## 5. Modul Notifikasi (Backend: notificationController.js)
- [✅] **Get Notifications (`getNotifications`)**: Mengambil daftar notifikasi user yang sedang login dengan pagination.
- [✅] **Mark As Read (`markAsRead`)**: Menandai satu notifikasi sebagai sudah dibaca.
- [✅] **Mark All As Read (`markAllAsRead`)**: Menandai seluruh notifikasi user sebagai sudah dibaca.

## 6. Modul Peraturan & Konfigurasi (Backend: peraturanController.js)
- [✅] **Get All Peraturan (`getAllPeraturan`)**: Mengambil daftar seluruh peraturan koperasi.
- [✅] **Get Suku Bunga (`getSukuBunga`)**: Mengambil data suku bunga pinjaman aktif.
- [✅] **Get Peraturan By ID (`getPeraturanById`)**: Mengambil detail satu peraturan.
- [✅] **Create Peraturan (`createPeraturan`)**: Menambah peraturan baru.
- [✅] **Update Peraturan (`updatePeraturan`)**: Mengubah peraturan (otomatis sinkron ke tabel Konfigurasi jika berupa nilai numerik).
- [✅] **Delete Peraturan (`deletePeraturan`)**: Menghapus peraturan.

## 7. Modul Dashboard (Backend: dashboardController.js)
- [✅] **Get Dashboard Stats (`getDashboardStats`)**: Mengambil statistik ringkasan untuk dashboard admin (Total Anggota, Dana, Aliran Kas, dll).

## 8. Fitur Frontend (React & Socket.io)
- [✅] **Real-time Notifikasi**: Munculnya badge notifikasi dan toast secara instan saat ada aksi (pendaftaran baru, pinjaman disetujui, dll).
- [ ] **Real-time Dashboard Update**: Statistik di dashboard admin berubah otomatis tanpa refresh saat ada transaksi baru.
- [✅] **Form Validasi Client-side**: Pengecekan input (email, password, nominal) di sisi browser sebelum dikirim ke API.
- [✅] **Sidebar & Role-based Access Control (RBAC)**: Menu yang muncul menyesuaikan dengan role user (Anggota vs Pengurus).
- [✅] **Preview Invoice/Kuitansi**: Tampilan detail pinjaman yang diformat seperti invoice untuk diunduh/cetak.
- [✅] **Fitur "Terbilang"**: Konversi otomatis angka nominal ke format teks (contoh: 1.000.000 -> Satu Juta Rupiah).
- [✅] **Pencarian & Filter**: Mencari anggota atau pinjaman berdasarkan nama/nomor identitas di tabel.
