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
      { email: 'citra.lestari@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() },  // ID 7
      
      { email: 'dian.sastro@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 8
      { email: 'eko.prasetyo@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 9
      { email: 'fajar.sidik@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 10
      { email: 'gita.gutawa@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 11
      { email: 'hendra.gunawan@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 12
      { email: 'indah.permatasari@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 13
      { email: 'joko.widodo@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 14
      { email: 'kurnia.mega@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 15
      { email: 'linda.sari@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 16
      { email: 'muhammad.ali@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 17
      { email: 'nina.zatulini@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 18
      { email: 'oscar.lawalata@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 19
      { email: 'putri.tanjung@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 20
      { email: 'qory.sandioriva@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 21
      { email: 'raffi.ahmad@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 22
      { email: 'siti.nurhaliza@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 23
      { email: 'tulus.widodo@koperasi-nichias.co.id', password: hashedPassword, role: 'Anggota', created_at: new Date() }, // ID 24
    ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('users', null, {});
  }
};