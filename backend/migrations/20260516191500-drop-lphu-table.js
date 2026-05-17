'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop table lphu because it is replaced by RekapShu
    await queryInterface.dropTable('lphu');
  },

  async down(queryInterface, Sequelize) {
    // Re-create it if needed, but it's obsolete anyway
    await queryInterface.createTable('lphu', {
      lphu_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tahun: {
        type: Sequelize.INTEGER,
      }
      // ... simplified for down migration
    });
  }
};
