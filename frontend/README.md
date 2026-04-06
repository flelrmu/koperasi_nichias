koperasi_nichias/
│
├── ⚙️ backend/                 # API, Database, & Logika Bisnis (Node.js/Express)
│   ├── config/               # Konfigurasi database MySQL (config.json)
│   ├── controllers/          # Logika utama (Approve pinjaman, hitung SHU, dll)
│   ├── middleware/           # Satpam rute (Cek Token JWT, Upload KTP)
│   ├── migrations/           # 🌟 BARU: Catatan sejarah perubahan tabel database
│   ├── models/               # Definisi tabel Sequelize (User, Anggota, Pinjaman)
│   ├── postman/              # Koleksi pengujian API
│   ├── routes/               # Alamat URL API (misal: /api/pinjaman, /api/login)
│   ├── seeders/              # Pengisi data awal otomatis (Akun Ketua, Kategori Kas)
│   ├── services/             # (Opsional) Logika rumit spt Auto-Generate No Invoice
│   ├── uploads/              # Tempat menyimpan file KTP/Bukti Transfer anggota
│   ├── utils/                # Fungsi bantuan backend (Pembuat PDF, Enkripsi Password)
│   ├── .env                  # Variabel rahasia (Password DB, Secret JWT)
│   ├── package.json          # Daftar modul backend
│   └── server.js             # Jantung/Entry point backend yang dijalankan
│
└── 💻 frontend/                # Antarmuka Pengguna / UI (React + Tailwind + Vite)
    ├── node_modules/         # Kumpulan modul NPM (Jangan pernah di-upload ke GitHub)
    ├── public/               # Icon web (favicon)
    ├── src/                  # 📍 Pusat Koding Frontend Anda
    │   ├── assets/           # Gambar statis (Logo Koperasi, Ilustrasi Login)
    │   ├── components/       # 🧱 Implementasi Atomic Design
    │   │   ├── atoms/        # Elemen dasar: Button.jsx, Input.jsx, Label.jsx
    │   │   ├── molecules/    # Gabungan: FormGroup.jsx, SearchBar.jsx
    │   │   └── organisms/    # Kompleks: Sidebar.jsx, Navbar.jsx, TabelPinjaman.jsx
    │   ├── context/          # 🌟 BARU: State Management (AuthContext.jsx utk Login)
    │   ├── pages/            # Halaman utuh: Login.jsx, Dashboard.jsx, Laporan.jsx
    │   ├── templates/        # Kerangka layout: AuthLayout.jsx, DashboardLayout.jsx
    │   ├── utils/            # Fungsi bantuan frontend: formatRupiah.js, formatDate.js
    │   ├── App.jsx           # Pengatur rute halaman (React Router DOM)
    │   ├── index.css         # 🌟 Import Tailwind CSS berada di sini
    │   └── main.jsx          # Entry point React (Menghubungkan React ke Browser)
    │
    ├── postcss.config.js     # Pengaturan PostCSS untuk Tailwind v4
    ├── tailwind.config.js    # Pengaturan tema Tailwind (Tambah custom warna di sini)
    ├── package.json          # Daftar modul frontend
    └── vite.config.js        # Konfigurasi server pembuat (bundler) Vite




fungsi masing-masing folder frontend:

1. Atoms (Atom)
Ini adalah blok bangunan paling dasar. Atom tidak bisa dipecah lagi tanpa menghilangkan fungsinya. Biasanya hanya terdiri dari satu tag HTML yang sudah diberi styling Tailwind.

Contoh di Koperasi Anda: <Button />, <InputText />, <Label />, <BadgeStatus /> (untuk warna Lunas/Pending).

Sifat: Sangat reusable (bisa dipakai di mana saja) dan tidak tahu menahu soal database atau logika bisnis.

2. Molecules (Molekul)
Molekul adalah gabungan dari dua atau lebih Atom yang bekerja sama untuk melakukan satu hal sederhana.

Contoh di Koperasi Anda: * <InputGroup /> (Gabungan dari atom <Label />, <InputText />, dan pesan error kecil di bawahnya).

<SearchBar /> (Gabungan dari atom <InputText /> dan <Button /> ikon kaca pembesar).

3. Organisms (Organisme)
Organisme adalah komponen UI yang relatif kompleks, merupakan gabungan dari Molekul dan Atom. Organisme membentuk bagian yang jelas dari sebuah layar (biasanya berdiri sendiri).

Contoh di Koperasi Anda: * <Sidebar /> (Berisi banyak link navigasi).

<FormPengajuanPinjaman /> (Gabungan dari banyak molekul <InputGroup /> dan atom <Button />).

<TabelAnggota />.

4. Templates (Kerangka Layout)
Template adalah struktur rangka rumah Anda. Template tidak mengambil data dari database, melainkan hanya mengatur di mana komponen diletakkan (Grid/Flexbox).

Contoh di Koperasi Anda: * <DashboardLayout />: Mengatur agar <Sidebar> ada di kiri, Header di atas, dan ruang kosong besar di tengah untuk diisi konten utama.

<AuthLayout />: Mengatur agar form login berada tepat di tengah layar dengan background warna/gambar Koperasi Nichias.

5. Pages (Halaman)
Inilah hasil akhirnya. Pages adalah Template yang sudah diisi dengan data asli (dari API/Node.js) dan dipasangkan ke dalam App.jsx sebagai Router.

Contoh di Koperasi Anda: * Login.jsx

DashboardSekretaris.jsx

DetailPinjaman.jsx