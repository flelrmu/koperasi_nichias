'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Password default diubah agar lolos validasi regex: Koperasi@2026
    const hashedPassword = await bcrypt.hash('Koperasi@2026', 10);
    
    return queryInterface.bulkInsert('users', [
      { email: 'ketua@koperasi-nichias.co.id', password: hashedPassword, role: 'Ketua', created_at: new Date() }, // ID 1
      { email: 'sekretaris@koperasi-nichias.co.id', password: hashedPassword, role: 'Sekretaris', created_at: new Date() }, // ID 2
      { email: 'bendahara@koperasi-nichias.co.id', password: hashedPassword, role: 'Bendahara', created_at: new Date() }, // ID 3
      { email: 'koordinator@koperasi-nichias.co.id', password: hashedPassword, role: 'Koordinator_Simpan_Pinjam', created_at: new Date() }, // ID 4
      { email: 'agus.pratama@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 5
      { email: 'bambang.h@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 6
      { email: 'citra.lestari@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }  // ID 7
    ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('users', null, {});
  }
};