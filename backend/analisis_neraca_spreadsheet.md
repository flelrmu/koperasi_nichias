# Analisis Mendalam Tabel Neraca (Spreadsheet vs Database)

Dokumen ini menjelaskan hasil analisis keterkaitan antara list item pada tabel Neraca (Balance Sheet) di spreadsheet dengan modul/tabel yang ada di database sistem Koperasi Nichias. Analisis difokuskan pada data bulan **FEBRUARI**.

---

## 1. Alur Data Spreadsheet (Bulan Februari)

Secara umum, alur data di spreadsheet adalah:
**Buku Besar (Sheet 1-26)** -> **Neraca Percobaan (Sheet 27)** -> **Neraca Final (Sheet 29)**.

Setiap Buku Besar memiliki baris ringkasan di akhir bulan (berwarna kuning) yang menjumlahkan seluruh transaksi Debit dan Kredit.

### Rincian Item Neraca

| Deskripsi Item | Sumber Sheet (Spreadsheet) | Rumus / Logika Perhitungan | Status di Database Sistem |
| :--- | :--- | :--- | :--- |
| **CASH** | `1. CASH__11011` | Saldo awal + Total Debit (Masuk) - Total Kredit (Keluar). Ringkasan Feb ada di Baris 12. | **Ada**: Tabel `kategori_kas` (ID: 28, Kode: 11011). |
| **BANK** | `2. BANK__11025` | Mengambil baris ringkasan Februari (Baris 573). Integrasi dari banyak transaksi bank. | **Ada**: Tabel `kategori_kas` (ID: 8, Kode: 11012). |
| **TAGIHAN PNJIAMAN** | `3. TAGIHAN PINJAMAN` | Ringkasan transaksi pinjaman di bulan Feb. | **Ada**: Tabel `kategori_kas` (ID: 9, Kode: 11013). |
| **TAGIHAN CREDIT BRG** | `4. TAGIHAN CREDIT BARANG`| Ringkasan transaksi kredit barang di bulan Feb. | **Ada**: Tabel `kategori_kas` (ID: 10, Kode: 11014). |
| **TAGIHAN RENTAL** | `5. TAGIHAN RENTAL` | Ringkasan transaksi rental di bulan Feb. | **Ada**: Tabel `kategori_kas` (ID: 11, Kode: 11015). |
| **PERSEDIAAN BARANG** | `6. PERSEDIAAN BARANG` | Ringkasan nilai stok/barang di bulan Feb. | **Ada**: Tabel `kategori_kas` (ID: 12, Kode: 11016). |
| **ALAT KANTOR** | `7. ALAT KANTOR` | Ringkasan nilai aset kantor di bulan Feb. | **Ada**: Tabel `kategori_kas` (ID: 13, Kode: 11017). |
| **INVESTASI** | `8. INVESTASI` | Ringkasan penempatan dana investasi di bulan Feb. | **Ada**: Tabel `kategori_kas` (ID: 14, Kode: 11018). |
| **INCOME TAX** | `9. INCOME TAX` | Pajak penghasilan yang dibayarkan/diakui. | **Ada**: Tabel `kategori_kas` (ID: 15, Kode: 11019). |
| **TOTAL ASSET** | `29. NERACA` | **Rumus**: `=SUM(CASH:INCOME TAX)`. Penjumlahan seluruh Aktiva. | **Kalkulasi Otomatis** di Controller. |
| **DP - PENERIMAAN DIMUKA**| `10. DP - PENERIMAAN DIMUKA`| Penerimaan uang muka dari pelanggan/anggota. | **Ada**: Tabel `kategori_kas` (ID: 17, Kode: 21011). |
| **HUTANG USAHA** | `11. HUTANG USAHA` | Hutang kepada pihak ketiga. | **Ada**: Tabel `kategori_kas` (ID: 18, Kode: 21012). |
| **HUTANG BIAYA** | `12. HUTANG BIAYA` | Hutang atas biaya yang sudah terjadi tapi belum dibayar. | **Ada**: Tabel `kategori_kas` (ID: 19, Kode: 21013). |
| **TAX LIABILITY** | `27. NERACA PERCOBAAN` | Kewajiban pajak yang masih harus dibayar. | **Ada**: Tabel `kategori_kas` (ID: 20, Kode: 21014). |
| **LOAN** | `13. LOAN` | Pinjaman koperasi kepada pihak luar (Bank/Lainnya). | **Ada**: Tabel `kategori_kas` (ID: 27, Kode: 21015). |
| **PROFIT/LOSS** | `28. LAPORAN LABA RUGI` | **Rumus**: `Total Pendapatan - Total Beban`. Diambil dari Laporan Laba Rugi bulan Feb. | **Kalkulasi Otomatis** di Controller (ID 22). |
| **SIMPANAN ANGGOTA** | `25. SIMPANAN ANGGOTA` | Total simpanan pokok, wajib, dan sukarela anggota. | **Ada**: Tabel `kategori_kas` (ID: 23, Kode: 31011). |
| **LABA DITAHAN** | `26. LABA DITAHAN` | Laba tahun-tahun sebelumnya yang tidak dibagikan. | **Ada**: Tabel `kategori_kas` (ID: 29, Kode: 31012). |

---

## 2. Kesimpulan Implementasi

1.  **Modul yang Sudah Ada**: Seluruh list item di atas **SUDAH MEMILIKI** padanan di tabel `kategori_kas`. Artinya, data ini bisa ditarik secara otomatis dari transaksi `ArusKas`.
2.  **Integrasi Modul Lain**:
    *   **TAGIHAN PINJAMAN**: Terintegrasi otomatis saat angsuran dibayar di Modul Simpan Pinjam (masuk ke Arus Kas dengan kategori ID 9).
    *   **SIMPANAN ANGGOTA**: Terintegrasi saat anggota membayar Simpanan Pokok/Wajib/Sukarela (masuk ke Arus Kas dengan kategori ID 23).
    *   **PROFIT/LOSS**: Bukan diambil dari satu tabel, melainkan hasil kalkulasi `(Kredit - Debit)` dari semua kategori dengan `tipe_neraca` 'Income' dan 'Expense'.
3.  **Fleksibilitas Input Manual**: 
    *   Untuk item seperti **ALAT KANTOR**, **INVESTASI**, atau **HUTANG**, Bendahara dapat menginputnya melalui menu **Update Kas** dengan memilih kategori yang sesuai. 
    *   Jika ada kategori baru yang benar-benar belum ada, Bendahara dapat menambahkannya melalui menu **Bagan Akun (Kategori Kas)**, menentukan `tipe_neraca`-nya, dan sistem akan otomatis memasukkannya ke dalam perhitungan Neraca.

---

## 3. Rumus Utama Neraca (Coding Logic)

Dalam controller `neracaController.js`, rumus yang diterapkan adalah:

- **Saldo Awal Bulan Ini** = `Saldo Awal Kategori (DB)` + `Total Mutasi Sebelum Bulan Ini`.
- **Saldo Akhir Bulan Ini** = `Saldo Awal Bulan Ini` + `Total Kredit Bulan Ini` - `Total Debit Bulan Ini`.
- **TOTAL ASSET** = `SUM(Saldo Akhir)` untuk semua kategori tipe 'Asset'.
- **PROFIT/LOSS** = `SUM(Kredit - Debit)` untuk semua kategori tipe 'Income' & 'Expense' sejak awal tahun.

---

## 4. Analisis Detail Akun: CASH (11011)

Berdasarkan analisis pada spreadsheet **LAPORAN KEUANGAN KOPKAR**, berikut adalah rincian data yang masuk ke dalam akun **CASH**:

### A. Struktur Kolom & Logika
Sheet CASH menggunakan format berikut:
- **Kredit (Column E)**: Digunakan untuk **Uang Masuk (IN)**.
- **Debit (Column F)**: Digunakan untuk **Uang Keluar (OUT)**.
- **Deskripsi**: Mencatat detail subjek (nama anggota) atau objek (jenis pengeluaran).

### B. Jenis Transaksi yang Berkontribusi
Berbeda dengan akun BANK yang menerima simpanan besar secara kolektif, akun **CASH** digunakan untuk transaksi yang bersifat tunai, retail, atau pengembalian. Jenis data yang masuk meliputi:

1. **Pengembalian Simpanan (Refund)**:
   - Dana yang dikembalikan kepada anggota yang keluar atau kelebihan bayar.
   - *Status di Neraca*: Mengurangi saldo CASH (Debit/Out).

2. **Biaya Operasional (Kecil)**:
   - Pembelian kebutuhan kantor seperti Bantex, ATK, atau biaya administratif kecil lainnya.
   - *Status di Neraca*: Mengurangi saldo CASH (Debit/Out).

3. **Santunan Sosial**:
   - Pembayaran dana duka atau santunan kepada keluarga anggota.
   - *Status di Neraca*: Mengurangi saldo CASH (Debit/Out).

4. **Kelebihan Pembayaran Tagihan**:
   - Refund tunai kepada anggota jika ada kelebihan potong pada angsuran/credit barang.

### C. Kesimpulan Sinkronisasi Sistem
- **Fungsi**: Akun CASH dalam spreadsheet berfungsi sebagai **Kas Kecil (Petty Cash)**.
- **Aliran Dana**: Simpanan rutin bulanan (Pokok/Wajib) **TIDAK** masuk lewat CASH, melainkan terkumpul di akun **BANK**.
- **Integrasi Coding**: Sistem kita sudah benar dengan memisahkan kategori CASH dan BANK. Nilai Saldo Akhir CASH di tabel Neraca diambil dari:
  `Saldo Awal + Total Kredit (In) - Total Debit (Out)`.

---

## 5. Hubungan Persamaan Akuntansi (Assets = Liabilities + Equity)

Sistem telah menerapkan logika di mana **TOTAL ASSET** harus selalu sama dengan penjumlahan **Liabilities + Equity**.

- **Grup ASET**: (CASH + BANK + TAGIHAN + ASSET TETAP).
- **Grup PASIVA**: (HUTANG + SIMPANAN + PROFIT + LABA DITAHAN).

Setiap transaksi Arus Kas yang diinput oleh Bendahara akan otomatis memperbarui salah satu komponen di atas, sehingga Neraca akan tetap seimbang (Balanced) secara *real-time*.

---

## 6. Analisis Detail Akun: BANK (11025)

Berdasarkan analisis pada spreadsheet, akun **BANK** berfungsi sebagai penampung utama transaksi besar dan kolektif. Berbeda dengan akun CASH, sheet BANK menggunakan **Logika Akuntansi Standar**.

### A. Struktur Kolom & Logika
Sheet BANK menggunakan format berikut:
- **Debit (Column F)**: Digunakan untuk **Uang Masuk (IN)**.
- **Kredit (Column G)**: Digunakan untuk **Uang Keluar (OUT)**.
- **Perbedaan dengan CASH**: Logika ini berkebalikan dengan sheet CASH di spreadsheet yang menggunakan *Credit for IN*. Namun, logika BANK ini **SAMA** dengan logika yang kita terapkan di Sistem Aplikasi Koperasi (Debit = Plus, Kredit = Minus).

### B. Jenis Transaksi yang Berkontribusi
Akun BANK mencatat hampir seluruh aktivitas finansial utama koperasi:

1. **Simpanan Anggota (Wajib & Sukarela)**:
   - Setoran rutin yang biasanya dilakukan via transfer atau potong gaji.
   - *Status di Neraca*: Menambah saldo BANK (Debit/In).

2. **Pinjaman (Loans)**:
   - **Pencairan**: Uang ditransfer ke rekening anggota saat pinjaman disetujui. (Kredit/Out).
   - **Angsuran/Pelunasan**: Penerimaan pembayaran hutang dari anggota. (Debit/In).

3. **Tagihan Credit Barang**:
   - Penerimaan pembayaran angsuran barang (seperti motor, elektronik).
   - *Status di Neraca*: Menambah saldo BANK (Debit/In).

4. **Biaya Administrasi & Operasional Besar**:
   - Biaya administrasi bank bulanan, biaya transfer antar bank, dan pembayaran pajak.
   - *Status di Neraca*: Mengurangi saldo BANK (Kredit/Out).

5. **Transfer Keluar (Payroll/Vendor)**:
   - Pembayaran gaji pengurus atau pembayaran ke vendor pihak ketiga.
   - *Status di Neraca*: Mengurangi saldo BANK (Kredit/Out).

### C. Kesimpulan Sinkronisasi Sistem
- **Kesesuaian**: Logika aplikasi kita (Debit = Pemasukan, Kredit = Pengeluaran) sudah **100% selaras** dengan sheet BANK di spreadsheet.
- **Akurasi**: Karena sebagian besar transaksi simpan-pinjam masuk lewat BANK, maka saldo di aplikasi akan sangat akurat mencerminkan rekening bank riil jika bendahara rajin melakukan rekonsiliasi.

---

## 7. Analisis Detail Akun: TAGIHAN PINJAMAN (11013)

Berdasarkan analisis pada sheet **3. TAGIHAN PINJAMAN**, akun ini berfungsi sebagai catatan **Piutang Anggota** yang merupakan bagian dari Aset Koperasi.

### A. Logika Akuntansi (Sisi Aset)
Pencatatan piutang mengikuti standar saldo normal Aset (Debit):
- **DEBIT (Kolom E)**: Digunakan untuk **Penambahan Piutang**. Terjadi saat koperasi mengeluarkan uang untuk memberikan pinjaman kepada anggota (**Pencairan Pinjaman / Disbursement**).
- **KREDIT (Kolom F)**: Digunakan untuk **Pengurangan Piutang**. Terjadi saat koperasi menerima uang kembali dari anggota sebagai cicilan atau pelunasan (**Penerimaan Pinjaman / Repayment**).
- **Rumus Saldo**: `Saldo Akhir = Saldo Awal + Total DEBIT - Total KREDIT`.

### B. Jenis Transaksi yang Berkontribusi
1. **Pencairan Pinjaman (Debit)**:
   - Mencatat jumlah dana yang dipinjamkan kepada anggota secara individu.
   - Keterangan: `PINJAMAN UANG [NAMA ANGGOTA]`.
   - *Dampak di Arus Kas*: Mengurangi Kas/Bank (Kredit).

2. **Angsuran Bulanan (Kredit)**:
   - Mencatat penerimaan cicilan pokok pinjaman (kolektif maupun individu).
   - Keterangan: `PENERIMAAN PINJAMAN UANG [BULAN] [TAHUN]`.
   - *Dampak di Arus Kas*: Menambah Kas/Bank (Debit).

3. **Pelunasan Langsung (Kredit)**:
   - Mencatat pelunasan sisa hutang anggota secara penuh dalam satu waktu.
   - Keterangan: `PELUNASAN HUTANG [NAMA ANGGOTA]`.
   - *Dampak di Arus Kas*: Menambah Kas/Bank (Debit).

### C. Kesimpulan Sinkronisasi Sistem
- **Kesesuaian Kode**: Logika ini **selaras** dengan perhitungan di `neracaController.js` (Awal + Debit - Kredit).
- **Integritas Data**: Penting bagi Bendahara untuk memastikan bahwa setiap transaksi "Pencairan" diinput sebagai **Debit** pada kategori ini agar nilai Piutang di Neraca tidak minus. Sebaliknya, setiap "Angsuran" harus diinput sebagai **Kredit** pada kategori ini.
## 8. Analisis Detail Akun: PERSEDIAAN BARANG (11016)

Berdasarkan analisis pada sheet **6. PERSEDIAAN BARANG**, akun ini mencatat nilai kekayaan koperasi dalam bentuk stok barang dagangan (seperti barang konsumsi, sembako, atau stok barang kredit).

### A. Aturan Debit/Kredit (Sisi Aset)
Pencatatan persediaan mengikuti aturan saldo normal Aset Lancar:
- **DEBIT**: Digunakan untuk **Penambahan Stok**. Terjadi saat koperasi melakukan pembelian barang dari pemasok/vendor untuk disimpan sebagai persediaan.
- **KREDIT**: Digunakan untuk **Pengurangan Stok**. Terjadi saat barang tersebut keluar dari gudang (terjual secara tunai/kredit, atau digunakan untuk operasional).
- **Rumus Saldo**: `Saldo Akhir = Saldo Awal + Total DEBIT (Masuk) - Total KREDIT (Keluar)`.

### B. Hubungan dengan CASH/BANK
Setiap pergerakan pada akun Persediaan Barang hampir selalu memiliki lawan transaksi (Counterpart) pada akun Kas/Bank:

1. **Pembelian Stok (Restock)**:
   - **Persediaan Barang (DEBIT)**: Nilai aset barang di gudang bertambah.
   - **CASH/BANK (KREDIT)**: Uang tunai atau saldo bank berkurang untuk membayar pemasok.
   
2. **Penjualan Barang (Retail/Tunai)**:
   - **CASH/BANK (DEBIT)**: Uang hasil penjualan masuk ke kas koperasi.
   - **PERSEDIAAN BARANG (KREDIT)**: Nilai stok berkurang karena barang sudah berpindah tangan ke pembeli. (Sistem biasanya mencatat ini senilai harga modal/HPP).

3. **Pengambilan Barang oleh Anggota (Kredit Barang)**:
   - **TAGIHAN CREDIT BARANG (DEBIT)**: Piutang anggota bertambah.
   - **PERSEDIAAN BARANG (KREDIT)**: Stok berkurang karena barang diserahkan ke anggota tanpa pembayaran tunai langsung.

### C. Jenis Transaksi yang Berkontribusi
1. **Pembelian Barang Dagangan (Debit)**: Mencatat invoice pembelian stok baru dari vendor.
2. **HPP / Harga Pokok Penjualan (Kredit)**: Mencatat nilai barang yang terjual agar stok di neraca mencerminkan barang yang tersisa secara fisik.
3. **Adjustment Stok (Debit/Kredit)**: Digunakan saat terjadi opname gudang jika ditemukan selisih barang fisik vs catatan.

### D. Kesimpulan Sinkronisasi Sistem
- **Kesesuaian**: Logika aplikasi kita sudah mendukung pencatatan ini melalui kategori `PERSEDIAAN BARANG`.
- **Tips Operasional**: Jika koperasi melakukan pembelian barang stok secara tunai, pastikan Bendahara menginput dua sisi transaksi (atau satu transaksi Arus Kas dengan kategori Persediaan, yang secara otomatis akan memotong saldo Bank jika menggunakan metode pembayaran BANK).
## 9. Analisis Detail Akun: INCOME TAX (11019)

Berdasarkan analisis pada sheet **9. INCOME TAX**, akun ini berfungsi untuk mencatat akumulasi pajak yang telah dibayarkan atau dipotong oleh pihak lain (seperti PPh atas sewa rental). Akun ini merupakan bagian dari **Aset Koperasi**.

### **A. Aturan Penginputan (PENTING)**
Agar saldo Aset Pajak Anda bertambah di Neraca, Bendahara harus mengikuti aturan "Pembalikan Logika" (Inversion) yang sama dengan Piutang:

*   **Pilih KREDIT (Uang Keluar/Dipotong)**: Gunakan ini jika koperasi ingin **Menambah Saldo Aset Pajak**.
    *   *Logika*: Uang tersebut adalah hak koperasi yang "keluar" atau dipotong untuk negara, sehingga menjadi tabungan pajak (Aset).
    *   *Hasil di Neraca*: Saldo **INCOME TAX** akan naik di kolom **DEBIT** (Aset Bertambah).
*   **Pilih DEBIT (Uang Masuk/Restitusi)**: Gunakan ini jika koperasi menerima pengembalian pajak (restitusi).
    *   *Logika*: Uang pajak masuk kembali ke kas.
    *   *Hasil di Neraca*: Saldo **INCOME TAX** akan turun di kolom **KREDIT** (Aset Berkurang).

### **B. Contoh Kasus: Pajak Rental**
Jika koperasi menerima pembayaran sewa Rp 10.000.000 namun dipotong pajak Rp 1.000.000 (uang yang masuk ke bank hanya Rp 9.000.000):

1.  **Input Bank (Penerimaan Sewa)**: Rp 9.000.000 (Debit).
2.  **Input Income Tax (Pajak Dipotong)**: Rp 1.000.000 (**KREDIT**).
    *   *Hasil*: Di Neraca, saldo Bank Anda naik Rp 9 Juta, dan saldo Aset Pajak (Income Tax) Anda naik Rp 1 Juta. Total Aset tetap seimbang Rp 10 Juta.

### **C. Kesimpulan Operasional**
*   **INGAT**: Jika Bendahara ingin menambah saldo **INCOME TAX**, pilihlah jenis **KREDIT** di menu Update Kas.
*   Logika ini sudah tertanam di sistem (`isPiutang: true` pada mapping Neraca) sehingga saldo akhir akan terhitung otomatis dan tetap seimbang (Balanced).
## 10. Analisis Detail Akun: PROFIT/LOSS (Equity)

Berdasarkan analisis langsung pada sheet **28. LAPORAN LABA RUGI**, akun PROFIT/LOSS dihitung berdasarkan selisih antara item Pendapatan dan Beban berikut:

### **A. Sumber Data Perhitungan (Sesuai Spreadsheet)**

1.  **Kelompok PENDAPATAN (Income)**:
    *   **PENDAPATAN PINJAMAN**: Bunga dari pinjaman uang anggota.
    *   **PENJUALAN CREDIT**: Keuntungan dari kredit barang.
    *   **PENDAPATAN RENTAL**: Keuntungan dari penyewaan unit.
    *   **PENDAPATAN BUNGA**: Bunga dari rekening bank.
    *   **DP - PENERIMAAN DIMUKA**: Penerimaan uang muka yang diakui sebagai pendapatan pada periode berjalan.

2.  **Kelompok BEBAN (Expense)**:
    *   **BEBAN PINJAMAN**: Biaya-biaya terkait pengelolaan pinjaman.
    *   **BEBAN CREDIT BARANG**: Biaya-biaya terkait pengadaan/pengelolaan kredit barang.
    *   **BEBAN RENTAL**: Biaya operasional dan perawatan unit rental.
    *   **BEBAN OPERASIONAL**: Seluruh biaya kantor, administrasi, dan beban umum lainnya.

### **B. Logika Perhitungan di Sistem**
Sesuai dengan `neracaController.js`, sistem menghitung Profit/Loss secara otomatis dengan rumus:
**`PROFIT/LOSS = (Total Seluruh Transaksi Income) - (Total Seluruh Transaksi Expense)`**

*   **Kumulatif**: Perhitungan dimulai dari tanggal 1 Januari tahun berjalan sampai dengan tanggal akhir bulan yang dipilih.
*   **Akurasi**: Kategori seperti **Provisi** atau **Santunan** tidak muncul sebagai baris tersendiri di Laporan Laba Rugi utama, kemungkinan karena sudah digabung ke dalam kategori besar seperti **BEBAN OPERASIONAL** atau **PENDAPATAN PINJAMAN**.

### **C. Cara Memastikan Profit/Loss Akurat**
Bendahara harus memastikan transaksi diinput ke dalam 9 kategori di atas agar angka Profit/Loss di Neraca aplikasi sama persis dengan Laporan Laba Rugi di spreadsheet.

---

## **III. Analisis Detail Kelompok Pasiva (Liabilities & Equity)**

Berdasarkan struktur [Spreadsheet Neraca](https://docs.google.com/spreadsheets/d/1ZEMa6jd2uGcrv98lzT3n2Bb0ZkL8_6L29Aa-DvNb-TM/edit?usp=sharing), berikut adalah penjelasan mendalam mengenai akun-akun Pasiva yang digunakan dalam sistem:

### **Aturan Umum Pasiva di Neraca Aplikasi**
Dalam sistem ini, akun Pasiva menggunakan pendekatan **Net-to-Zero Balance**:
*   **Tanda Nilai**: Seluruh saldo Pasiva ditampilkan sebagai nilai **Negatif (-)** di database/controller agar ketika dijumlahkan dengan Aktiva (Positif), hasilnya menjadi **0 (Seimbang)**.
*   **Kolom KREDIT**: Digunakan untuk mencatat **Penambahan** kewajiban (misal: menerima hutang baru atau setoran simpanan). Di Neraca, nilai Kredit akan membuat saldo semakin negatif (bertambah besar secara absolut).
*   **Kolom DEBIT**: Digunakan untuk mencatat **Pengurangan** kewajiban (misal: membayar hutang atau penarikan simpanan).

---

### **1. DP - PENERIMAAN DIMUKA**
*   **Definisi**: Uang muka yang diterima dari pihak ketiga (anggota/pelanggan) atas barang atau jasa yang belum diserahkan sepenuhnya oleh koperasi. Ini adalah hutang prestasi.
*   **Data yang Dihitung**: Transaksi yang menggunakan kategori `DP - PENERIMAAN DIMUKA`.
*   **Aturan Debit/Kredit**:
    *   **Kredit (Pasiva Bertambah)**: Saat uang muka masuk ke koperasi.
    *   **Debit (Pasiva Berkurang)**: Saat barang/jasa diserahkan (DP diakui sebagai pendapatan) atau DP dikembalikan.
*   **Kenapa Saldo Awal/Akhir Sering Kosong?**
    Akun ini bersifat **transitori (sementara)**. Biasanya DP yang diterima di awal bulan akan langsung direalisasikan menjadi "Pendapatan" pada periode yang sama setelah barang diserahkan. Jika pada akhir bulan semua DP sudah dikerjakan, maka saldo akhir akan menjadi **0**.

### **2. HUTANG USAHA**
*   **Definisi**: Kewajiban jangka pendek koperasi kepada pemasok atau vendor atas pembelian stok barang kredit atau aset yang dilakukan secara tidak tunai.
*   **Data yang Dihitung**: Seluruh mutasi transaksi kategori `HUTANG USAHA`.
*   **Aturan Debit/Kredit**:
    *   **Kredit**: Muncul hutang baru karena pembelian barang belum dibayar.
    *   **Debit**: Pelunasan atau pembayaran cicilan kepada vendor.

### **3. HUTANG BIAYA**
*   **Definisi**: Biaya operasional yang sudah dinikmati koperasi namun pembayarannya masih ditangguhkan (misal: Gaji bulan berjalan yang baru dibayar bulan depan).
*   **Data yang Dihitung**: Transaksi kategori `HUTANG BIAYA`.
*   **Aturan Debit/Kredit**:
    *   **Kredit**: Pengakuan beban yang masih menunggak pada akhir periode.
    *   **Debit**: Saat pembayaran tunai dilakukan untuk melunasi tunggakan tersebut.

### **4. TAX LIABILITY**
*   **Definisi**: Kewajiban pajak koperasi (PPh, PPN, atau pajak lainnya) yang sudah dipotong/dipungut namun belum disetorkan ke kas negara.
*   **Data yang Dihitung**: Transaksi kategori `TAX LIABILITY`.
*   **Aturan Debit/Kredit**:
    *   **Kredit**: Saat koperasi memotong pajak dari transaksi atau mencatat kewajiban pajak.
    *   **Debit**: Saat koperasi melakukan penyetoran pajak ke kas negara.

### **5. LOAN**
*   **Definisi**: Pinjaman dana yang diterima koperasi dari pihak luar (Bank atau lembaga keuangan), biasanya digunakan untuk penambahan modal kerja.
*   **Data yang Dihitung**: Mutasi pada kategori `LOAN`.
*   **Aturan Debit/Kredit**:
    *   **Kredit**: Saat menerima pencairan dana pinjaman dari kreditur luar.
    *   **Debit**: Saat membayar angsuran pokok pinjaman kepada kreditur tersebut.
