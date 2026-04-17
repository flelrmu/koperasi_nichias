'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('arus_kas', {
      kas_id: {
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
      kategori_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'kategori_kas',
          key: 'kategori_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tanggal: {
        type: Sequelize.DATEONLY,
      },
      kode_transaksi: {
        type: Sequelize.STRING(20),
      },
      jenis: {
        type: Sequelize.ENUM('Debit', 'Kredit'),
      },
      keterangan: {
        type: Sequelize.TEXT,
      },
      nominal: {
        type: Sequelize.DECIMAL(15, 2),
      },
      saldo_akhir: {
        type: Sequelize.DECIMAL(15, 2),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('arus_kas');
  },
};
