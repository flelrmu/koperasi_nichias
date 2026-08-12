'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addConstraint('RekapShu', {
      fields: ['processed_by'],
      type: 'foreign key',
      name: 'fk_rekap_shu_processed_by_user',
      references: {
        table: 'users',
        field: 'user_id'
      },
      onDelete: 'set null',
      onUpdate: 'cascade'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('RekapShu', 'fk_rekap_shu_processed_by_user');
  }
};
