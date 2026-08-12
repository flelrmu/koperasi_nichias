'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    // Drop foreign key first if it exists
    try {
      await queryInterface.removeConstraint('SaldoBulanan', 'fk_saldo_bulanan_kategori_kas');
    } catch (e) {
      console.log('Constraint fk_saldo_bulanan_kategori_kas not found or already removed');
    }
    
    // Drop table SaldoBulanan
    await queryInterface.dropTable('SaldoBulanan');
  },

  async down (queryInterface, Sequelize) {
    // Recreate the table
    await queryInterface.createTable('SaldoBulanan', {
      saldo_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      kategori_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      bulan: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      tahun: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      saldo_awal: {
        type: Sequelize.DECIMAL(20, 2),
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add constraint back
    await queryInterface.addConstraint('SaldoBulanan', {
      fields: ['kategori_id'],
      type: 'foreign key',
      name: 'fk_saldo_bulanan_kategori_kas',
      references: {
        table: 'kategori_kas',
        field: 'kategori_id'
      },
      onDelete: 'restrict',
      onUpdate: 'cascade'
    });
  }
};
