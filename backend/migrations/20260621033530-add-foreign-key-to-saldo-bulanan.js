'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
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
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('SaldoBulanan', 'fk_saldo_bulanan_kategori_kas');
  }
};
