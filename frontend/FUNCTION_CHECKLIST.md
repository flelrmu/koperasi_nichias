# Checklist Fungsi Proyek Koperasi Nichias

Dokumen ini berisi daftar seluruh fungsi (API Backend & Fitur Frontend) yang dikelompokkan berdasarkan Role untuk proses pengecekan (QA/Testing).

## 1. Fungsi Umum (Semua Role)
Fungsi-fungsi dasar yang dapat diakses oleh Anggota maupun Pengurus.

- [ ] **Login Multi-Role (`login`)**: Autentikasi dengan JWT, redirect sesuai role.
- [ ] **Get Profile (`getProfile`)**: Mengambil data profil diri sendiri beserta ringkasan simpanan/pinjaman.
- [ ] **Update Profile (`updateProfile`)**: Mengubah data mandiri (No HP, Alamat, No Rekening).
- [ ] **Change Password (`changePassword`)**: Mengganti password dengan validasi password lama.
- [ ] **Upload Profile Photo (`uploadProfilePhoto`)**: Mengunggah foto profil.
- [ ] **Get Notifications (`getNotifications`)**: Mengambil daftar notifikasi pribadi (pagination).
- [ ] **Mark As Read (`markAsRead` / `markAllAsRead`)**: Menandai notifikasi telah dibaca.
- [ ] **Get Peraturan & Suku Bunga (`getAllPeraturan`, `getSukuBunga`)**: Melihat peraturan koperasi dan bunga pinjaman aktif.
- [ ] **Real-time Notifikasi (Frontend)**: Toast & badge notifikasi muncul instan via Socket.IO.
- [ ] **Form Validasi Client-side**: Pengecekan input (email, password, nominal) sebelum submit.
- [ ] **Fitur "Terbilang"**: Konversi angka nominal ke format teks di kuitansi/invoice.
- [ ] **Get Secretary Contact (`getSecretaryContact`)**: Mengambil kontak WhatsApp sekretaris untuk pertanyaan umum.
- [ ] **Halaman Peraturan**: Tampilan katalog interaktif untuk melihat kebijakan koperasi (Tamu/Anggota).

---

## 2. Role: Anggota
Fitur khusus untuk anggota koperasi yang sudah aktif.

- [ ] **Register Calon Anggota (`register`)**: Pendaftaran mandiri dengan validasi domain email perusahaan.
- [ ] **Request Pinjaman (`createPinjaman`)**: Mengajukan pinjaman (Uang/Barang) dengan simulasi bunga.
- [ ] **View Pinjaman Pribadi**: Melihat detail sisa tagihan dan riwayat angsuran sendiri.
- [ ] **View Simpanan & Transaksi**: Melihat saldo (Pokok, Wajib, Sukarela) dan riwayat mutasi.
- [ ] **Request Keluar Koperasi (`requestKeluar`)**: Mengajukan pengunduran diri (validasi nol hutang).
- [ ] **Cancel Request Keluar (`cancelKeluar`)**: Membatalkan pengajuan keluar yang masih pending.
- [ ] **Preview Invoice/Kuitansi**: Melihat dan mengunduh bukti pinjaman/transaksi.

---

## 3. Role: Pengurus (Umum)
Berlaku untuk Sekretaris, Bendahara, Ketua, dan Koordinator.

- [ ] **Get Dashboard Stats (`getDashboardStats`)**: Statistik ringkasan (Total Anggota, Dana, Kas).
- [ ] **Real-time Dashboard Update**: Statistik berubah otomatis tanpa refresh saat ada transaksi baru.
- [ ] **Get Anggota List (`getAnggotaList`)**: Melihat daftar seluruh anggota koperasi.
- [ ] **Get Pengurus List (`getPengurusList`)**: Melihat daftar jajaran manajemen.
- [ ] **Get User Detail (`getUserDetail`)**: Melihat informasi lengkap satu user.
- [ ] **Sidebar & RBAC Management**: Menu yang muncul otomatis sesuai hak akses role.
- [ ] **Pencarian & Filter**: Mencari data anggota/pinjaman/kas dengan filter dinamis.

---

## 4. Role Spesifik: Sekretaris
Fungsi terkait administrasi keanggotaan dan manajemen user.

- [ ] **Approve Member (`approveMember`)**: Menyetujui pendaftaran, generate No Anggota, & auto-create Simpanan Pokok.
- [ ] **Admin Create User (`adminCreateUser`)**: Membuat user baru secara manual (Anggota/Pengurus).
- [ ] **Update User (`updateUser`)**: Mengoreksi data user lain (Email, Role, Nama, dll).
- [ ] **Delete User (`deleteUser`)**: Menghapus user beserta seluruh data terkait (Simpanan, Pinjaman, dll).
- [ ] **Approve Keluar (`approveKeluar`)**: Menyetujui pengunduran diri anggota.
- [ ] **Manage Peraturan (`createPeraturan`, `updatePeraturan`, `deletePeraturan`)**: Membuat, mengedit, dan menghapus kebijakan koperasi.
- [ ] **Get Peraturan Detail (`getPeraturanById`)**: Melihat detail langkah prosedur peraturan spesifik.

---

## 5. Role Spesifik: Bendahara
Fungsi terkait manajemen arus kas, keuangan, dan pembukuan.

- [ ] **Manage Arus Kas (`create`, `update`, `deleteArusKas`)**: Mencatat transaksi keuangan koperasi.
- [ ] **Edit Saldo Kas (`editSaldoKas`)**: Melakukan penyesuaian/adjusment saldo kas utama.
- [ ] **Manage Kategori Kas**: Menambah/mengubah kategori pemasukan dan pengeluaran.
- [ ] **Real-time Neraca (`getNeraca`)**: Laporan posisi keuangan (Asset, Liabilitas, Ekuitas) secara instan.
- [ ] **Neraca Tahunan (`getNeracaTahunan`)**: Melihat perbandingan laporan keuangan per tahun.
- [ ] **Tutup Buku (`tutupBuku`)**: Melakukan closing periode keuangan.
- [ ] **Update Simpanan (`updateSimpanan`)**: Koreksi manual saldo simpanan anggota.
- [ ] **Create Transaksi Simpanan (`createTransaksiSimpanan`)**: Mencatat setoran/penarikan sukarela.
- [ ] **Bulk Simpanan Wajib (`bulkCreateSimpananWajib`)**: Input setoran wajib masal per bulan.
- [ ] **Tarik Semua Simpanan (`tarikSemuaSimpanan`)**: Proses penarikan seluruh dana saat anggota keluar.
- [ ] **Get Saldo Kas (`getSaldoKas`)**: Melihat ketersediaan dana kas utama (CASH/BANK) secara real-time.
- [ ] **Get Periode Status (`getPeriodeStatus`)**: Mengecek status aktif atau tutup buku dari periode keuangan bulan berjalan.
- [ ] **Cancel Tutup Buku (`cancelTutupBuku`)**: Membatalkan tutup buku laporan bulanan yang sudah dikunci.
- [ ] **SHU Preview (`getPreview`)**: Melihat simulasi draf pembagian alokasi Sisa Hasil Usaha.
- [ ] **SHU Process (`prosesSHU`)**: Menghitung dan menyimpan draf pembagian SHU untuk tahun operasional berjalan.
- [ ] **SHU Finalize (`finalizeSHU`)**: Mengunci draf SHU menjadi final dan membagikan porsi ke saldo anggota.
- [ ] **SHU Cancel Finalize & Delete (`cancelFinalizeSHU`, `cancelSHU`)**: Membatalkan finalisasi SHU atau menghapus draf.
- [ ] **Ekspor Laporan Excel**: Mengunduh rekapitulasi Laporan Neraca (Bulanan/Tahunan) dan SHU.

---

## 6. Role Spesifik: Koordinator Simpan Pinjam
Fungsi terkait operasional pinjaman dan angsuran.

- [ ] **View All Pinjaman (`getAllPinjaman`)**: Memantau seluruh pengajuan pinjaman masuk.
- [ ] **Update Pinjaman Status (`updatePinjamanStatus`)**: Menyetujui/menolak pinjaman & set jadwal angsuran.
- [ ] **Bulk Process Angsuran (`bulkProcessAngsuran`)**: Memproses pemotongan gaji masal untuk cicilan.
- [ ] **Pelunasan Pinjaman (`lunaskanPinjaman`)**: Melakukan pelunasan sisa tagihan sekaligus.
- [ ] **Delete Pinjaman (`deletePinjaman`)**: Menghapus data pengajuan pinjaman.
- [ ] **Update Peraturan/Konfigurasi**: Mengubah nilai bunga, limit pinjaman, dll.
- [ ] **Get All Simpanan (`getAllSimpanan`)**: Memantau daftar dan nominal seluruh simpanan anggota koperasi.
- [ ] **Get Transaksi By Anggota (`getTransaksiByAnggota`)**: Melihat detail history mutasi simpanan dari satu anggota.
- [ ] **Update Transaksi Simpanan (`updateTransaksiSimpanan`)**: Memperbaiki nominal transaksi simpanan tertentu jika terjadi kesalahan input.
- [ ] **Get Pinjaman By ID (`getPinjamanById`)**: Melihat detail lengkap, jaminan, dan histori angsuran dari satu ID pinjaman.
- [ ] **Get Konfigurasi Simpanan (`getKonfigurasiSimpanan`)**: Mengambil detail konfigurasi operasional modul simpanan.
- [ ] **Cetak Invoice Pinjaman**: Men-generate laporan cetak PDF untuk pencairan/angsuran pinjaman.

---

## 7. Role: Ketua / Wakil Ketua
Fungsi pengawasan dan monitoring tingkat tinggi.

- [ ] **Full Monitoring Dashboard**: Akses visual ke seluruh data statistik koperasi.
- [ ] **Review Laporan Keuangan**: Memantau Arus Kas dan Neraca tanpa akses modifikasi (read-only monitoring).
- [ ] **Approval Oversight**: Memastikan proses approval anggota dan pinjaman berjalan sesuai prosedur.
