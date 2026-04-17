'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('angsuran', {
      angsuran_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      pinjaman_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'pinjaman',
          key: 'pinjaman_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      angsuran_ke: {
        type: Sequelize.INTEGER,
      },
      jumlah_bayar: {
        type: Sequelize.DECIMAL(15, 2),
      },
      tanggal_jatuh_tempo: {
        type: Sequelize.DATEONLY,
      },
      tanggal_bayar: {
        type: Sequelize.DATEONLY,
      },
      status_bayar: {
        type: Sequelize.ENUM('Belum', 'Lunas'),
        defaultValue: 'Belum',
      },
      nomor_invoice: {
        type: Sequelize.STRING(50),
        unique: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('angsuran');
  },
};
