'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('anggota', [
      { 
        user_id: 5, 
        no_anggota: 'KOP-2026-001', 
        no_identitas: '1371012304950001', 
        nama_lengkap: 'Agus Pratama',
        tempat_lahir: 'Bukittinggi',
        tanggal_lahir: '1995-04-23', 
        jabatan: 'Staff', 
        divisi: 'HRD', 
        no_hp: '085211223344', 
        no_rekening_bank: 'BCA - 1122334455', 
        alamat: 'Bukittinggi', 
        tanggal_registrasi: new Date(),
        tanggal_bergabung: '2026-01-10',
        status_keanggotaan: 'Aktif'
      },
      { 
        user_id: 6, 
        no_anggota: 'KOP-2026-002', 
        no_identitas: '1371021508880002',
        nama_lengkap: 'Bambang Hermawan', 
        tempat_lahir: 'Solok',
        tanggal_lahir: '1988-08-15',
        jabatan: 'Manager', 
        divisi: 'Keuangan', 
        no_hp: '085211223355', 
        no_rekening_bank: 'Mandiri - 1112223334445',
        alamat: 'Solok', 
        tanggal_registrasi: new Date(),
        tanggal_bergabung: '2026-01-15',
        status_keanggotaan: 'Aktif'
      },
      { 
        user_id: 7, 
        no_anggota: 'KOP-2026-003', 
        no_identitas: '1371031212920003',
        nama_lengkap: 'Citra Lestari', 
        tempat_lahir: 'Pariaman',
        tanggal_lahir: '1992-12-12',
        jabatan: 'Assistant_Manager', 
        divisi: 'Marketing', 
        no_hp: '085211223366', 
        no_rekening_bank: 'BNI - 0099887766',
        alamat: 'Pariaman', 
        tanggal_registrasi: new Date(),
        tanggal_bergabung: '2026-02-01',
        status_keanggotaan: 'Aktif'
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('anggota', null, {});
  }
};