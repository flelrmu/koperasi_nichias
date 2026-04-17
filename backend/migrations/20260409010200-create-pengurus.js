'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pengurus', {
      pengurus_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      nama_lengkap: {
        type: Sequelize.STRING(100),
      },
      jabatan: {
        type: Sequelize.STRING(50),
        comment: 'Sekretaris/Bendahara/Koordinator SP',
      },
      no_hp: {
        type: Sequelize.STRING(15),
      },
      alamat: {
        type: Sequelize.TEXT,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pengurus');
  },
};
