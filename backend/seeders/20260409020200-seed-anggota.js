'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const memberNames = [
      "Chaerul Baharuddin",
      "Turimin",
      "Hari Setiawan",
      "Sapto Yuhartono",
      "Elizabeth DS Pardede",
      "Bonita Nursanti",
      "Didit Juhdi",
      "Dede Komarudin",
      "Dedi Haryadi",
      "Murnita",
      "Yayah Sunaiyah",
      "Wiwiek",
      "Rossy Bestuty",
      "Said Muinuddin",
      "Riza Mauilidi",
      "Riyadi",
      "SYARIF TAUFIK",
      "Wilson",
      "Dadang Ahmad Dasuki",
      "Heru Kurniawan",
      "Sandri M",
      "Denny Angga Setiawan",
      "Wiwit Wiguna",
      "Novita Handayani",
      "Rahmat Hidayat",
      "Ardi",
      "Asroni",
      "Zainal Arifin",
      "Alex setiawan",
      "Arsudin",
      "Sri meriyana",
      "M.Soleh",
      "Suwandi",
      "Titis Noritasari",
      "Maman Suherman",
      "FIRMAN WAREHOUSE",
      "Slamet Supriyadi",
      "Nur Soleh",
      "Fani Arizka",
      "Abdul Hakim",
      "Hanafi Autopart",
      "Nadiyah",
      "Syarif Hidayat",
      "Totok Hariyono",
      "HENDRA",
      "Muhamad Toha",
      "SUHANDI",
      "Iman",
      "DWI ARIANTY SUMA",
      "John Kennedy",
      "Yahya",
      "Firmansyah",
      "Mirza Noviyanto Aji",
      "SITI NURASIAH ROHMAH",
      "JOHAN WAHYUDI",
      "Yusli",
      "Hadil Umam",
      "Pinta Yulia",
      "Very Setyowanto",
      "Teddy Permadhi",
      "Ari Hikmah Fitriyadi",
      "Arland Asra",
      "Perdana Raya Tambunan",
      "Inke Riris Kurniati",
      "Muhammad Ilham",
      "Rini Agustina",
      "Rya Casriyah",
      "Adyansyah",
      "Eko susanto",
      "Ratna Puspita Dewi",
      "WIWIT ARNIA",
      "Indra Jaya Merkurius",
      "Apriliana",
      "Arif Maulana",
      "Mustaqim",
      "Eri Makmur",
      "DIMAS OKTAVIANTO PUTRA",
      "Ady Sulaiman",
      "Berliana Mulya Casmita",
      "Bintang Pertiwi",
      "RIDWAN",
      "Irma Oktaviana",
      "SOFYAN"
    ];

    function cleanName(rawName) {
      let name = rawName.trim();
      const parts = name.split(/\s+/);
      if (parts.length > 2 && parts.every(part => part.length <= 2)) {
        name = name.replace(/\s+/g, '');
      } else {
        name = name.replace(/\s+/g, ' ');
      }
      return name;
    }

    const divisions = ['Marketing', 'Purchasing', 'HRD', 'Admin', 'Keuangan', 'Lainnya'];
    const cities = ['Padang', 'Jakarta', 'Bukittinggi', 'Solo', 'Malang', 'Batam', 'Medan', 'Bandung', 'Surabaya', 'Yogyakarta'];
    const bankNames = ['BCA', 'Mandiri', 'BNI', 'BRI'];
    const streets = ['Jl. Universitas Andalas', 'Jl. Jenderal Sudirman', 'Jl. H.R. Rasuna Said', 'Jl. MH Thamrin', 'Jl. Ahmad Yani', 'Jl. Gatot Subroto'];

    const targetTotal = 1012853600;
    const memberCount = memberNames.length; // 83
    const pokokPerMember = 100000;
    const totalPokok = memberCount * pokokPerMember;
    const targetRemainder = targetTotal - totalPokok; // 1,004,553,600

    let totalWajibSum = 0;
    let totalSukarelaSum = 0;

    const members = [];
    for (let i = 0; i < memberCount; i++) {
      const cleaned = cleanName(memberNames[i]);
      const noAnggota = `KOP-2026-${String(i + 1).padStart(3, '0')}`;
      const noIdentitas = `137101${String(Math.floor(1000000000 + Math.random() * 9000000000))}`;
      const tempatLahir = cities[i % cities.length];
      
      const birthYear = 1975 + (i % 28);
      const birthMonth = String(1 + (i % 12)).padStart(2, '0');
      const birthDay = String(1 + (i % 28)).padStart(2, '0');
      const tanggalLahir = `${birthYear}-${birthMonth}-${birthDay}`;

      let jabatan = 'Staff';
      if (i % 10 === 0) {
        jabatan = 'Manager';
      } else if (i % 5 === 0) {
        jabatan = 'Assistant_Manager';
      }
      const divisi = divisions[i % divisions.length];

      const noHp = `0812${String(Math.floor(10000000 + Math.random() * 90000000))}`;
      const noRekeningBank = `${bankNames[i % bankNames.length]} - ${String(Math.floor(100000000 + Math.random() * 900000000))}`;
      const alamat = `${streets[i % streets.length]} No. ${1 + (i % 50)}, ${tempatLahir}`;

      let saldoWajib = 0;
      let saldoSukarela = 0;

      if (i < memberCount - 1) {
        saldoWajib = 6000000 + ((i % 15) * 110000); 
        saldoSukarela = 4500000 + ((i % 17) * 80000) + ((i % 5) * 30000);

        saldoWajib = Math.round(saldoWajib / 10000) * 10000;
        saldoSukarela = Math.round(saldoSukarela / 10000) * 10000;
      } else {
        const currentSum = totalWajibSum + totalSukarelaSum;
        const finalRemainder = targetRemainder - currentSum;
        saldoWajib = Math.round((finalRemainder * 0.55) / 10000) * 10000;
        saldoSukarela = finalRemainder - saldoWajib;
      }

      totalWajibSum += saldoWajib;
      totalSukarelaSum += saldoSukarela;

      members.push({
        user_id: i + 5, // user_id starts at 5 (Ketua=1, Sekretaris=2, Bendahara=3, Koordinator=4)
        no_anggota: noAnggota,
        no_identitas: noIdentitas,
        nama_lengkap: cleaned,
        tempat_lahir: tempatLahir,
        tanggal_lahir: tanggalLahir,
        jabatan,
        divisi,
        no_hp: noHp,
        no_rekening_bank: noRekeningBank,
        alamat,
        tanggal_registrasi: new Date(),
        tanggal_bergabung: '2026-01-10',
        status_keanggotaan: 'Aktif',
        saldo_pokok: pokokPerMember,
        saldo_wajib: saldoWajib,
        saldo_sukarela: saldoSukarela,
        last_updated: new Date()
      });
    }

    return queryInterface.bulkInsert('anggota', members);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('anggota', null, {});
  }
};