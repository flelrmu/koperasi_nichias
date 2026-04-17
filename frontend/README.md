📋 RINGKASAN PROYEK: Sistem Manajemen Koperasi Nichias
1. Gambaran Umum Proyek 
Saya sedang membangun "Sistem Informasi Manajemen Keuangan dan Keanggotaan" berbasis web untuk koperasi simpan pinjam (Koperasi PT Nichias Sunijaya). Tujuan utamanya adalah untuk mendigitalisasi proses spreadsheet manual, menerapkan aturan bisnis tertentu, dan memberikan pengalaman responsif secara real-time menggunakan WebSockets.

2. Tumpukan Teknologi (Varian MERN)Arsitektur Frontend:Kerangka kerja: React.js.Penataan gaya: Tailwind CSS(Pendekatan berbasis utilitas untuk UI responsif).Manajemen State: Context API (atau Redux Toolkit jika diminta secara khusus).Pengaturan rute: React Router DOM.Pola Desain: Metodologi Desain Atomik (Atom, Molekul, Organisme, Templat, Halaman).Arsitektur Backend (Server API):Lingkungan Eksekusi/Kerangka Kerja: Node.js dengan Express.js.Basis data: MySQL(Basis data relasional untuk integritas keuangan).ORM: Sequelize (Untuk mendefinisikan model dan menangani migrasi basis data).Komunikasi Waktu Nyata: WebSocket (melalui Socket.IO)untuk notifikasi push instan.Pola Arsitektur: MVC (Model-View-Controller) yang diadaptasi untuk API-only (Controller, Route, Model, dan Middleware yang terpisah).

3. Entitas Kunci & Konsep Skema Basis Data 

4. Aturan Bisnis Inti (Sangat Penting untuk Logika Backend) 

5. Aktor Sistem & Hak Akses (Otorisasi)Calon Anggota (Tamu): 

6. Instruksi Asisten AI 
Saat saya meminta Anda untuk menghasilkan kode:Selalu hormati arsitektur yang terpisah (kode Frontend React terpisah dari kode Backend Node.js).Gunakan sintaks ES6+ standar dan komponen React fungsional dengan Hooks.Pastikan kode tersebut menyertakan penanganan kesalahan yang kuat, terutama untuk perhitungan matematis yang melibatkan mata uang (Rupiah).


⚙️ BACKEND (Sisi Server / Node.js & Express)
Area ini bertugas mengolah data, menghitung logika bisnis (seperti bunga atau SHU), dan berbicara dengan database MySQL. Pola yang digunakan di sini adalah MVC (Model-View-Controller) tanpa View, karena View-nya diurus oleh React.

config/: Jantung koneksi. Di sinilah Anda menyimpan file config.json atau database.js yang berisi pengaturan agar Node.js bisa tersambung ke MySQL (seperti nama host, username root, dan nama database).

models/: Representasi tabel database di dalam kode. File di sini (misal: Anggota.js, Pinjaman.js) ditulis menggunakan Sequelize. Jadi, Anda tidak perlu menulis perintah SQL manual (seperti SELECT * FROM), melainkan cukup memanggil fungsi seperti Anggota.findAll().

migrations/: Buku catatan sejarah struktur database. Jika bulan depan Anda ingin menambah kolom nomor_rekening di tabel anggota, Anda tidak mengubahnya di PhpMyAdmin, melainkan menulis instruksinya di folder ini. Ini mencegah error saat sistem dipindahkan ke server asli.

seeders/: Pemasok data awal. Saat aplikasi baru diinstal dan database masih kosong, seeder akan otomatis membuatkan akun "Ketua/Super Admin" agar Anda bisa langsung login.

routes/: Papan petunjuk jalan (Router). File ini menentukan alamat URL (Endpoint). Misalnya, mengatur bahwa jika ada permintaan ke POST /api/anggota, maka permintaan tersebut akan diarahkan ke Controller bagian anggota.

controllers/: Otak dari aplikasi. Di sini logika utama terjadi. Contoh: saat menerima permintaan pinjaman, Controller akan mengecek sisa saldo, menghitung bunga berdasarkan tenor, lalu menyimpannya ke tabel pinjaman menggunakan models/.

middleware/: Satpam pemeriksa. Sebelum permintaan masuk ke Controller, ia akan dicek di sini. Contoh: auth.js mengecek apakah yang sedang menekan tombol "Setujui Pinjaman" benar-benar memiliki token akses role Koordinator.

services/ (Opsional): Untuk kode logika yang sangat panjang. Jika perhitungan SHU akhir tahun memakan ratusan baris kode, kodenya diletakkan di sini agar Controller tetap bersih dan mudah dibaca.

uploads/: Gudang penyimpanan file. Jika Sekretaris mengunggah pas foto anggota atau KTP, file fisiknya akan disimpan di folder ini, sementara nama filenya saja yang masuk ke database.

utils/: Kotak perkakas. Berisi fungsi bantuan kecil yang dipakai berulang kali oleh sistem backend, seperti fungsi untuk mengekspor data ke PDF atau fungsi mengenkripsi password menggunakan bcrypt.

.env: Brankas rahasia. File ini tidak akan masuk ke GitHub. Berisi variabel sensitif seperti password database dan kunci rahasia untuk membuat token keamanan (JWT).

server.js: Tombol daya (Power Button). File utama yang menyatukan rute, middleware, dan database, lalu menyalakannya agar aplikasi berjalan di port tertentu (misal: 5000).



💻 FRONTEND (Sisi Pengguna / React.js)
Area ini sepenuhnya berjalan di browser pengguna (Chrome/Edge). Bertugas menampilkan antarmuka yang cantik menggunakan Tailwind CSS dan berinteraksi dengan API dari backend. Arsitekturnya menggunakan Atomic Design.

public/: Tempat menaruh aset statis yang tidak perlu diproses oleh sistem. Biasanya hanya berisi favicon.ico (logo kecil di tab browser).

src/: Pusat kegiatan coding Anda. Hampir 99% waktu Anda untuk Frontend akan dihabiskan di dalam folder ini.

assets/: Berbeda dengan public, gambar (seperti logo koperasi untuk form login) yang diletakkan di sini akan dioptimalkan ukurannya secara otomatis oleh sistem saat aplikasi siap rilis.

components/: Dapur perakitan UI (Atomic Design).

atoms/: Komponen tunggal terkecil. Contoh: Button, Input, Label. Jika Anda mengubah warna hijau di atom Button, seluruh tombol di aplikasi berubah.

molecules/: Gabungan beberapa atom. Contoh: InputGroup (gabungan Label + Input + Pesan Error merah di bawahnya).

organisms/: Bagian antarmuka yang besar dan mandiri. Contoh: Sidebar (menu navigasi kiri) atau TabelRiwayatPinjaman.

context/: Pengelola ingatan global (State Management). Berisi logika seperti AuthContext yang mengingat data "Siapa yang sedang login saat ini" sehingga data tersebut bisa diakses oleh halaman mana saja tanpa perlu bertanya ke backend terus-menerus.

pages/: Halaman utuh. File di sini (misal Login.jsx atau Dashboard.jsx) adalah hasil rakitan dari berbagai organism dan molecule, lalu dihubungkan ke data dari API backend.

templates/: Kerangka susunan. Mengatur posisi konten. Misalnya, DashboardLayout mengatur agar Sidebar selalu ada di kiri dan Header di atas, sedangkan konten utamanya ada di tengah.

utils/: Berisi fungsi bantuan ringan khusus tampilan. Contoh: formatRupiah.js untuk mengubah angka 15000000 menjadi teks "Rp 15.000.000" sebelum ditampilkan ke layar.

App.jsx: Peta jalan halaman (Router). Menentukan bahwa URL /dashboard akan membuka halaman Dashboard.jsx, dan /login akan membuka Login.jsx.

main.jsx: Titik temu. File yang memerintahkan React untuk mengambil semua kode UI di App.jsx dan menempelkannya ke layar browser.

index.css: Rumah bagi Tailwind CSS.

tailwind.config.js: Buku manual Tailwind. Jika koperasi memiliki warna khas/branding (misalnya Biru Koperasi), Anda mendaftarkan kode warnanya (hex code) di sini.

vite.config.js: Mesin kompilasi. Pengaturan internal agar proses perubahan kode yang Anda lakukan bisa langsung muncul seketika di browser tanpa perlu menekan tombol refresh (Hot Module Replacement).