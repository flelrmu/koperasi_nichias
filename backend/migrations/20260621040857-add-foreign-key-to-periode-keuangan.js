'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addConstraint('PeriodeKeuangan', {
      fields: ['closed_by'],
      type: 'foreign key',
      name: 'fk_periode_keuangan_closed_by_user',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('PeriodeKeuangan', 'fk_periode_keuangan_closed_by_user');
  }
};
