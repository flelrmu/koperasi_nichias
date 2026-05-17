'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create RekapShu table (just in case sync() didn't handle it or to be explicit)
    await queryInterface.createTable('RekapShu', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tahun: {
        type: Sequelize.INTEGER,
        unique: true,
        allowNull: false
      },
      total_profit: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false
      },
      jatah_anggota: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false
      },
      jatah_pengurus: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false
      },
      laba_ditahan: {
        type: Sequelize.DECIMAL(20, 2),
        allowNull: false
      },
      is_processed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_finalized: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      processed_at: {
        type: Sequelize.DATE
      },
      processed_by: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 2. Fix pembagian_shu table
    // Remove lphu_id if exists
    const tableDesc = await queryInterface.describeTable('pembagian_shu');
    if (tableDesc.lphu_id) {
      await queryInterface.removeColumn('pembagian_shu', 'lphu_id');
    }

    // Add rekap_id if not exists
    if (!tableDesc.rekap_id) {
      await queryInterface.addColumn('pembagian_shu', 'rekap_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'RekapShu',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('RekapShu');
    // We don't necessarily want to drop pembagian_shu as it existed before, 
    // but we can't easily revert the column changes without knowing original state perfectly.
  }
};
