'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('konfigurasi', {
      config_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nama_config: {
        type: Sequelize.STRING(100),
        unique: true,
      },
      nilai: {
        type: Sequelize.STRING(255),
      },
      keterangan: {
        type: Sequelize.TEXT,
      },
      updated_by: {
        type: Sequelize.INTEGER,
        comment: 'User ID Sekretaris/Ketua yg edit',
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'Waktu terakhir diedit',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('konfigurasi');
  },
};
