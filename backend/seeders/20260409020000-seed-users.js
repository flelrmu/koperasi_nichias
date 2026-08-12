'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Password default diubah agar lolos validasi regex: Koperasi@2026
    const hashedPassword = await bcrypt.hash('Koperasi@2026', 10);
    
    const users = [
      { email: 'ketua@koperasi-nichias.co.id', password: hashedPassword, role: 'Ketua', created_at: new Date() }, // ID 1
      { email: 'sekretaris@koperasi-nichias.co.id', password: hashedPassword, role: 'Sekretaris', created_at: new Date() }, // ID 2
      { email: 'bendahara@koperasi-nichias.co.id', password: hashedPassword, role: 'Bendahara', created_at: new Date() }, // ID 3
      { email: 'koordinator@koperasi-nichias.co.id', password: hashedPassword, role: 'Koordinator_Simpan_Pinjam', created_at: new Date() }, // ID 4
    ];

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

    for (let i = 0; i < memberNames.length; i++) {
      const cleaned = cleanName(memberNames[i]);
      const emailPrefix = cleaned.toLowerCase().replace(/[^a-z0-9]/g, '.');
      const email = `${emailPrefix}.${i + 1}@koperasi-nichias.co.id`;
      users.push({
        email,
        password: hashedPassword,
        role: 'Anggota',
        created_at: new Date()
      });
    }

    return queryInterface.bulkInsert('users', users);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('users', null, {});
  }
};