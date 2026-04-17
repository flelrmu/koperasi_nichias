'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transaksi_simpanan', {
      transaksi_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      anggota_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'anggota',
          key: 'anggota_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      jenis_simpanan: {
        type: Sequelize.ENUM('Pokok', 'Wajib', 'Sukarela'),
      },
      jenis_transaksi: {
        type: Sequelize.ENUM('Setor', 'Tarik'),
      },
      nominal: {
        type: Sequelize.DECIMAL(15, 2),
      },
      tanggal: {
        type: Sequelize.DATEONLY,
      },
      keterangan: {
        type: Sequelize.TEXT,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('transaksi_simpanan');
  },
};
