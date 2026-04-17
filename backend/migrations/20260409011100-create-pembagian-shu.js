'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pembagian_shu', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      lphu_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'lphu',
          key: 'lphu_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      total_simpanan: {
        type: Sequelize.DECIMAL(15, 2),
        comment: 'Basis Hitung',
      },
      persentase: {
        type: Sequelize.FLOAT,
        comment: 'Simpanan Anggota / Total Simpanan Koperasi',
      },
      shu_diterima: {
        type: Sequelize.DECIMAL(15, 2),
        comment: 'Persentase x Total SHU',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pembagian_shu');
  },
};
