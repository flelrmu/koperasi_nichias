### 🔐 MODUL AUTENTIKASI & AKUN UMUM
**1. Pendaftaran / Register (Calon Anggota)**
* **Logika:** Calon anggota mengisi form. Sistem membuat akun baru dengan `role` = 'Anggota' dan `status_keanggotaan` = 'Pending'.
* **Tabel Terlibat:** Insert ke tabel `users` (email, password yang di-hash), lalu Insert ke tabel `anggota` (hubungkan dengan `user_id` yang baru dibuat).

**2. Login (Semua Aktor kecuali Calon)**
* **Logika:** Sistem mencocokkan email dan *password* (bcrypt). Jika benar, sistem menghasilkan token JWT dan mengarahkan halaman berdasarkan `role`.
* **Tabel Terlibat:** Read dari tabel `users`.

**3. Melihat Peraturan Koperasi (Semua Aktor)**
* **Logika:** Menampilkan aturan yang dinamis (seperti syarat limit atau persentase bunga) yang bisa diatur Sekretaris.
* **Tabel Terlibat:** Read dari tabel `konfigurasi`.

**4. Melihat Pesan/Notif (Semua Aktor)**
* **Logika:** Menampilkan daftar notifikasi yang dikirim via WebSocket. Saat diklik, mengubah status notifikasi menjadi "Sudah Dibaca".
* **Tabel Terlibat:** Read dan Update (`is_read` = true) pada tabel `notifikasi`.

**5. Edit Profile (Semua Aktor kecuali Calon)**
* **Logika:** Mengubah informasi pribadi seperti alamat atau No. HP.
* **Tabel Terlibat:** Update pada tabel `anggota` (jika user adalah anggota) atau tabel `pengurus` (jika user adalah pengurus).

**6. Ubah Password (Semua Aktor kecuali Calon)**
* **Logika:** Memverifikasi password lama, lalu meng-hash password baru dan menyimpannya.
* **Tabel Terlibat:** Update field `password` pada tabel `users`.

**7. Logout (Semua Aktor kecuali Calon)**
* **Logika:** Mengakhiri sesi dan menghapus token JWT dari *browser*. (Hanya logika sisi klien/server, tidak menyentuh database).

---

### 👥 MODUL ANGGOTA (Self-Service)
**8. Mengajukan Pinjaman**
* **Logika:** Anggota memasukkan jumlah dan tenor. Sistem **wajib mengecek limit** berdasarkan `jabatan`. [cite_start]Jika jumlah > limit, tolak[cite: 1446, 1447, 1448, 1449, 1450, 1451, 1452, 1453].
* **Tabel Terlibat:** Read batas limit dari tabel `anggota` & `konfigurasi`. Insert ke tabel `pinjaman` (status = 'Pending').

**9. Simulasi Angsuran Pinjaman**
* **Logika:** Kalkulator untuk anggota menghitung perkiraan bayaran bulanannya sebelum benar-benar meminjam. (Logika murni matematika).
* **Tabel Terlibat:** Read persentase bunga dari tabel `konfigurasi`.

**10. Melihat Invoices Pinjaman**
* **Logika:** Menampilkan daftar tagihan cicilan bulanan dari pinjaman yang sedang berjalan.
* **Tabel Terlibat:** Read dari tabel `angsuran` (menggunakan `pinjaman_id` milik anggota).

**11. Melihat Riwayat Pinjaman**
* **Logika:** Menampilkan daftar pinjaman masa lalu yang statusnya sudah 'Lunas'.
* **Tabel Terlibat:** Read dari tabel `pinjaman` (dimana `status` = 'Lunas').

**12. Melihat Dashboard Simpanan dan Pinjaman**
* **Logika:** Menampilkan total uang tabungan anggota (Pokok + Wajib + Sukarela) dan total sisa hutangnya saat ini.
* **Tabel Terlibat:** Read dan sum dari tabel `simpanan` dan `pinjaman` (`sisa_tagihan`).

**13. Mengajukan Permohonan Keluar Koperasi**
* **Logika:** Anggota meminta keluar. Sistem memvalidasi apakah anggota ini masih punya `sisa_tagihan` pinjaman. Jika punya hutang, permohonan ditolak oleh sistem.
* **Tabel Terlibat:** Read dari tabel `pinjaman` (validasi), mengirim data ke Sekretaris.

---

### 📋 MODUL SEKRETARIS (Admin & Data Master)
**14. Menyetujui/Menolak Pendaftaran**
* **Logika:** Jika disetujui, ubah status dari 'Pending' jadi 'Aktif', dan otomatis men- *generate* `no_anggota`. Jika ditolak, status jadi 'Ditolak'.
* **Tabel Terlibat:** Update tabel `anggota` (kolom `status_keanggotaan` & `tanggal_bergabung`).

**15. Menyetujui/Menolak Permohonan Keluar**
* **Logika:** Jika disetujui, status keanggotaan diubah jadi 'Keluar'.
* **Tabel Terlibat:** Update tabel `anggota` (`status_keanggotaan`). Read dari tabel `simpanan` untuk menginformasikan pengembalian dana.

**16. Mengatur Konfigurasi Koperasi**
* **Logika:** Tempat Sekretaris mengubah nilai-nilai penting. Misal: merubah bunga tenor 10 bulan dari 10% menjadi 12%.
* **Tabel Terlibat:** Update pada tabel `konfigurasi`.

**17. CRUD Akun Anggota dan Pengurus Koperasi**
* **Logika:** Fungsi *Super Admin* untuk menambah, mengedit, atau menghapus akun jika terjadi pergantian pengurus atau *error* data anggota.
* **Tabel Terlibat:** Create/Read/Update/Delete pada tabel `users`, `anggota`, dan `pengurus`.

---

### 💰 MODUL KOORDINATOR SIMPAN PINJAM (Operasional)
**18. CRUD Data Simpan Pinjam**
* **Logika:** Tempat Koordinator mencatat jika ada anggota yang setor simpanan sukarela, atau saat anggota membayar angsuran bulanan. Sistem akan otomatis memperbarui saldo.
* **Tabel Terlibat:** Insert ke `transaksi_simpanan`, Update ke tabel `simpanan` (menambah saldo), dan Update tabel `angsuran` (`status_bayar` = 'Lunas').

**19. Menyetujui/Menolak Pinjaman**
* [cite_start]**Logika:** Jika Koordinator klik Setuju, sistem akan otomatis menghitung total bunga, menetapkan `sisa_tagihan`, dan **men-generate jadwal cicilan bulanannya**[cite: 1634]. Lalu kirim notifikasi WebSocket.
* **Tabel Terlibat:** Update tabel `pinjaman` (status='Approved', set `acc_koordinator_id`), Insert berulang (loop) ke tabel `angsuran` berdasarkan tenor. Insert ke `notifikasi`.

---

### 📊 MODUL BENDAHARA (Keuangan & Pelaporan)
**20. CRUD Arus Kas Koperasi**
* **Logika:** Jurnal umum. Tempat bendahara mencatat uang masuk (debit) dan keluar (kredit) selain simpan pinjam anggota (misal: bayar listrik kantor, pembelian ATK).
* **Tabel Terlibat:** Insert/Update ke tabel `arus_kas` yang terhubung ke `kategori_kas`.

**21. Perhitungan Otomatis SHU**
* **Logika:** Menghitung total laba bersih (LPHU). Kemudian membagikan nilai SHU ke masing-masing anggota berdasarkan rumus: (Simpanan Anggota / Total Simpanan Koperasi) * Persentase Jasa.
* **Tabel Terlibat:** Read & Insert ke tabel `lphu`, lalu memecahnya secara massal (Bulk Insert) ke tabel `pembagian_shu`.

**22. Generate Neraca Akhir Tahun**
* **Logika:** Mengumpulkan semua aset (Kas, Piutang Anggota) dan Kewajiban (Simpanan Anggota, SHU belum dibagi) untuk memastikan Aktiva dan Pasiva seimbang (Balance).
* **Tabel Terlibat:** Read agregasi (*sum*) dari tabel `arus_kas`, `pinjaman`, `simpanan`, dan `lphu`.

**23. Mengunduh Dokumen Keuangan**
* **Logika:** Mengonversi data JSON Neraca dan LPHU menjadi file PDF atau Excel untuk dicetak saat Rapat Anggota Tahunan (RAT).
* **Tabel Terlibat:** Tidak ada perubahan tabel (Hanya mengambil data dari memori fungsi no. 22 lalu dikonversi formatnya menggunakan *library* backend seperti `pdfkit` atau `exceljs`).

***