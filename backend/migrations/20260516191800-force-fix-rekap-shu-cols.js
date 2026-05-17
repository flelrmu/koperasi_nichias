'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('RekapShu');
    
    if (!tableDesc.is_finalized) {
      await queryInterface.addColumn('RekapShu', 'is_finalized', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    }

    if (!tableDesc.is_processed) {
      await queryInterface.addColumn('RekapShu', 'is_processed', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // No need to revert these minor column fixes
  }
};
