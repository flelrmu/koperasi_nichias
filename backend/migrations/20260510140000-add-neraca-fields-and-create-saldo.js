'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Update kategori_kas
    await queryInterface.addColumn('kategori_kas', 'kode_akun', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn('kategori_kas', 'tipe_neraca', {
      type: Sequelize.ENUM('Asset', 'Liability', 'Equity', 'Income', 'Expense'),
      allowNull: false,
      defaultValue: 'Asset'
    });
    await queryInterface.addColumn('kategori_kas', 'saldo_awal', {
      type: Sequelize.DECIMAL(15, 2),
      defaultValue: 0,
    });

    // 2. Create neraca_saldo table
    await queryInterface.createTable('neraca_saldo', {
      saldo_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      kategori_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'kategori_kas',
          key: 'kategori_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      bulan: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tahun: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      saldo_awal: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_debit: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      total_kredit: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      saldo_akhir: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      status_tutup_buku: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      tgl_tutup_buku: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      bendahara_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('neraca_saldo');
    await queryInterface.removeColumn('kategori_kas', 'kode_akun');
    await queryInterface.removeColumn('kategori_kas', 'tipe_neraca');
    await queryInterface.removeColumn('kategori_kas', 'saldo_awal');
    // Note: To truly revert the ENUM, you might need more complex SQL if supported by the DB
  },
};
