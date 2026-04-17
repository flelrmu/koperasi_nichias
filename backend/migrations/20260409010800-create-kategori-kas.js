'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('kategori_kas', {
      kategori_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nama_kategori: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      jenis: {
        type: Sequelize.ENUM('Debit', 'Kredit'),
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('kategori_kas');
  },
};
