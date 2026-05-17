# Analisis dan Alur Proses SHU Koperasi Nichias

Dokumen ini menjelaskan alur kerja, rumus, dan logika distribusi Sisa Hasil Usaha (SHU) yang diimplementasikan dalam sistem, disesuaikan dengan standar spreadsheet koperasi.

## 1. Alur Proses Pengolahan SHU

Proses pengolahan SHU dibagi menjadi dua tahap utama untuk memastikan akurasi dan memberikan kesempatan bagi pengurus untuk melakukan review sebelum data difinalisasi ke Neraca.

### Tahap 1: Kalkulasi & Drafting (Proses Sementara)
1.  **Pengambilan Profit:** Sistem menarik data `Total Profit` tahun berjalan (Januari - Desember) dari Arus Kas.
2.  **Input Konfigurasi:** Pengurus menentukan alokasi persentase atau nominal untuk:
    *   **Jatah Anggota:** Bagian profit yang akan dibagikan ke seluruh anggota (Standar: 80%).
    *   **Jatah Pengurus:** Bagian profit untuk pengurus (Standar: 15%).
    *   **Laba Ditahan:** Sisa profit yang akan disimpan koperasi untuk modal tahun depan (Standar: 5%).
3.  **Kalkulasi Proporsional:** Sistem menghitung jatah SHU setiap anggota berdasarkan total simpanan mereka dibandingkan dengan total simpanan seluruh anggota.
4.  **Penyimpanan Draft:** Data disimpan di tabel `RekapShu` dan `PembagianShu` dengan status `is_finalized = false`.

### Tahap 2: Finalisasi (Simpan ke Neraca)
1.  **Review:** Pengurus melihat tabel rincian pembagian per anggota di dashboard.
2.  **Validasi:** Jika data sudah benar, pengurus menekan tombol "Simpan Data SHU".
3.  **Update Neraca:** Sistem mengambil nilai `Laba Ditahan` dari rekap SHU dan menambahkannya ke saldo awal akun **Laba Ditahan** di Neraca bulan Januari tahun berikutnya.
4.  **Lock Data:** Status diubah menjadi `is_finalized = true` dan data tidak dapat diubah kembali.

---

## 2. Rumus-Rumus Utama

Berikut adalah rumus yang digunakan dalam sistem (berdasarkan analisis spreadsheet):

### A. Alokasi Global
*   **Total Profit** = $\sum (Income) - \sum (Expense)$ selama 1 tahun buku.
*   **Jatah Anggota** = $Profit \times 80\%$
*   **Jatah Pengurus** = $Profit \times 15\%$
*   **Laba Ditahan** = $Profit - Jatah Anggota - Jatah Pengurus$

### B. Distribusi Per Anggota
Setiap anggota menerima SHU berdasarkan kontribusi modalnya (total simpanan).

1.  **Total Simpanan Anggota (i)** = $Pokok + Wajib + Sukarela$ (per anggota).
2.  **Proporsi (%)** = $\frac{\text{Total Simpanan Anggota (i)}}{\text{Total Seluruh Simpanan Koperasi}} \times 100$
3.  **SHU Dibagikan (i)** = $Proporsi (i) \times \text{Total Jatah Anggota}$
4.  **Pembulatan (i)** = $SHU Dibagikan (i)$ dibulatkan ke bawah (Floor) ke kelipatan Rp 100 atau Rp 1.000 untuk kemudahan disbursement.
5.  **Yield (%)** = $\frac{\text{SHU Dibagikan (i)}}{\text{Total Simpanan Anggota (i)}} \times 100$
    *   *Yield menunjukkan tingkat pengembalian investasi anggota dalam setahun.*

---

## 3. Struktur Tabel SHU (Dashboard)

Sesuai dengan format spreadsheet, tabel di sistem menampilkan kolom berikut:

| No | Anggota | Total Simpanan | Proporsi (%) | SHU Dibagikan | Pembulatan | Yield (%) |
|:---:|:--- |:---:|:---:|:---:|:---:|:---:|
| 1 | Nama (No Anggota) | Rp XXX | X.XXXX% | Rp XXX | Rp XXX | XX.XX% |

---

## 4. Ketentuan Teknis
*   **Periode:** SHU dihitung per tahun buku (1 Januari s/d 31 Desember).
*   **Audit Trail:** Setiap proses SHU mencatat siapa yang memproses dan waktu eksekusinya di kolom `processed_by` dan `processed_at`.
*   **Integritas Data:** Tombol "Cancel" akan menghapus seluruh draft perhitungan jika terjadi kesalahan sebelum finalisasi.
