Link file arus kas:
https://docs.google.com/spreadsheets/d/1LItal53xfpQV47NQ827E9Btg659Lv79aFsnBn0wLsws/edit?usp=sharing

Link laporan keuangan (neraca):
https://docs.google.com/spreadsheets/d/1ZEMa6jd2uGcrv98lzT3n2Bb0ZkL8_6L29Aa-DvNb-TM/edit?usp=sharing


RENCANA IMPLEMENTASI Neraca (role bendahara):
analisis spreadsheet neraca di atas.
Buat laporan keuangan neraca yang otomatis terintegrasi dengan modul yang sudah ada:
- modul pinjaman
- modul angsuran
- modul simpanan pokok
- modul simpanan wajib
- modul simpanan sukarela
- modul tarik tunai
- modul lain lain yang terkait dengan keuangan














<!-- analisis link spreadsheet di atas.

RENCANA IMPLEMENTASI ARUS KAS (role bendahara):

1. Tabel arus kas otomatis terintegrasi dengan modul yang sudah ada:
Modul pinjaman (saat pinjaman di setujui uang pada arus kas menjadi debit/pengeluaran)
Modul angsuran (saat pembayaran cicilan pada arus kas menjadi kredit/pemasukan)
Modul simpanan pokok (saat pembayaran simpanan pokok pada arus kas menjadi kredit/pemasukan)
Modul simpanan wajib (saat pembayaran simpanan wajib pada arus kas menjadi kredit/pemasukan)
Modul simpanan sukarela (saat pembayaran simpanan sukarela pada arus kas menjadi kredit/pemasukan)
modul tarik tunai (saat tarik tunai pada arus kas menjadi debit/pengeluaran)
modul setoran lain lain (saat setoran lain lain pada arus kas menjadi kredit/pemasukan, atau sebaliknya)

2. Logic Hitung Saldo Otomatis:
Saat bendahara memasukkan data baru (misal: input pengeluaran/debit, kredit/pemasukan),
Sistem harus ambil saldo terakhir sebelum transaksi ini,
Kurangi jumlah transaksi tersebut dari saldo terakhir,
Dan masukkan hasil ke kolom saldo_akhir.

3. untuk kategori seperti biaya operasional, admin, dan lain lain. jika bendahara ingin menambah kategori maka bendahara tinggal menambahkannya di menu kategori kas.
saat menambah kategori baru, bendahara harus memilih apakah kategori tersebut termasuk kategori debit atau kredit.
saat bendahara ingin mengedit atau menghapus kategori, bendahara harus memastikan bahwa kategori tersebut tidak digunakan di modul arus kas.

4. Untuk data arus kas ditampilkan per bulan dan per tahun.

5. Hak Akses:
Pastikan fitur arus kas hanya bisa diakses oleh user dengan roleBendahara

6. buat design tabel arus kas seperti design tabel yang sudah ada seperti tabel pada halaman pinjaman.

7. jika ada data kategori di bawah yang belum ada di tabel kategori kas, maka tambahkan kategori tersebut ke dalam tabel kategori kas.

BANK
TAGIHAN PNJIAMAN
TAGIHAN CREDIT BARANG
TAGIHAN RENTAL
PERSEDIAAN BARANG
ALAT KANTOR
INVESTASI
INCOME TAX 
TOTAL ASSET
DP - PENERIMAAN DIMUKA
HUTANG USAHA
HUTANG BIAYA
TAX LIABILITY
LOAN
PROFIT/LOSS
SIMPANAN ANGGOTA

8. ketika bendahara input arus kas, bendahara dapat mengubah jenis debit atau kredit sesuai dengan transaksi. karena ada beberapa transaksi yang mungkin berbeda dengan defaultnya, contoh:
- tagihan pinjaman biasanya masuk ke dalam debit/pengeluaran, namun jika ada kelebihan pembayaran maka menjadi kredit/pemasukan -->