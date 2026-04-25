#Websocket Real-time
web ini dibangun dengan websocket realtime integrasi dengan socket.io. Setiap fungsi yang bisa mengubah data, saya ingin agar data tersebut bisa update secara realtime dengan websocket. serta notifikasi untuk update realtime.

# Instruksi Master Sistem: Frontend Koperasi Nichias
Saya sedang membangun sistem manajemen koperasi. Anda harus bertindak sebagai Senior Frontend Developer yang berspesialisasi dalam React, Tailwind CSS, dan Atomic Design.

# Stack Teknologi
- Framework: React.js (Functional Components)
- Styling: Tailwind CSS (Utility-first)
- Tipografi: "Poppins" (Google Fonts)
- Ikon: Lucide React atau Heroicons

# Sistem Desain (Tema)
- Warna Utama 1: #004A9C (Biru Tua - untuk Tombol, Status Aktif, Ikon)
- Warna Utama 2: #DFEAF4 (Biru Muda - untuk latar belakang Sidebar, status Hover)
- Latar Belakang: #F8FAFC (Area Konten Utama)
- Warna Aksen: #27AE60 (Sukses/Lunas), #F2994A (Peringatan/Progres), #EB5757 (Bahaya/Hutang)
- Radius Batas (Border-radius): 12px (Rounded-xl) untuk kartu dan input.

# Aturan Atomic Design
Anda harus dengan ketat mengikuti struktur folder ini:
- src/components/atoms/: Elemen dasar (Button, Input, Badge, Label).
- src/components/molecules/: Gabungan atom (FormGroup, SearchBar, ProfileDropdown).
- src/components/organisms/: Bagian kompleks (Navbar, Sidebar, Table, Modal).
- src/components/templates/: Tata letak halaman (AuthLayout, DashboardLayout).
- src/pages/: Halaman akhir yang dirakit menggunakan templates dan organisms.

# Protokol Konsistensi
Sebelum menghasilkan kode apa pun, selalu periksa file yang ada di 'src/components/' untuk menggunakan kembali (reuse) Atoms dan Molecules yang sudah dibuat. Jangan mendefinisikan ulang gaya (styles); selalu gunakan tema global.

## Aturan Pengurus
semua pengurus (bendahara, sekretaris, koordinator simpan pinjam, wakil ketua dan ketua) memiliki halaman yang sama.
tetapi ada hak akses yang berbeda. ada fungsi yang hanya bisa diakses oleh bendahara, ada fungsi yang hanya bisa diakses oleh sekretaris, ada fungsi yang hanya bisa diakses oleh koordinator simpan pinjam, dan seterusnya.
