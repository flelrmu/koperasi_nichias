'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('simpanan', {
      simpanan_id: {
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
      saldo_pokok: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      saldo_wajib: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      saldo_sukarela: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0,
      },
      last_updated: {
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('simpanan');
  },
};
