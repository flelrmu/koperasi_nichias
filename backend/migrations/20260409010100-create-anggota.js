'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('anggota', {
      anggota_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      no_anggota: {
        type: Sequelize.STRING(20),
        unique: true,
        comment: 'Digenerate setelah status Aktif',
      },
      no_identitas: {
        type: Sequelize.STRING(20),
        unique: true,
        comment: 'Nomor NIK atau KTP anggota',
      },
      nama_lengkap: {
        type: Sequelize.STRING(100),
      },
      tempat_lahir: {
        type: Sequelize.STRING(100),
      },
      tanggal_lahir: {
        type: Sequelize.DATEONLY,
      },
      jabatan: {
        type: Sequelize.ENUM('Staff', 'Assistant_Manager', 'Manager'),
        allowNull: false,
        comment: 'Untuk menentukan Limit Potongan (Staff/Mgr)',
      },
      divisi: {
        type: Sequelize.ENUM('Marketing', 'Purchasing', 'HRD', 'Admin', 'Keuangan'),
        allowNull: false,
        comment: 'Departemen tempat anggota bekerja',
      },
      no_hp: {
        type: Sequelize.STRING(15),
      },
      no_rekening_bank: {
        type: Sequelize.STRING(50),
        comment: 'Nomor rekening untuk pencairan dana',
      },
      alamat: {
        type: Sequelize.TEXT,
      },
      tanggal_registrasi: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      tanggal_bergabung: {
        type: Sequelize.DATEONLY,
        comment: 'Diisi saat Sekretaris klik Approve',
      },
      status_keanggotaan: {
        type: Sequelize.ENUM('Pending', 'Aktif', 'Ditolak', 'Keluar'),
        defaultValue: 'Pending',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('anggota');
  },
};
