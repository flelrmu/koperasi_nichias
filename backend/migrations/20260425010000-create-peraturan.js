'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('peraturan', {
      peraturan_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      judul: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      deskripsi: {
        type: Sequelize.TEXT,
      },
      kategori: {
        type: Sequelize.ENUM('Simpanan', 'Pinjaman', 'Keanggotaan'),
        allowNull: false,
      },
      ketentuan_utama: {
        type: Sequelize.STRING(100),
      },
      nilai_numerik: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        comment: 'Nilai angka untuk kalkulasi (ex: 1.00 = suku bunga 1%)',
      },
      tujuan: {
        type: Sequelize.TEXT,
      },
      syarat_ketentuan: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      prosedur: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      icon_name: {
        type: Sequelize.STRING(50),
        defaultValue: 'FileText',
      },
      icon_color: {
        type: Sequelize.STRING(30),
        defaultValue: 'text-blue-600',
      },
      icon_bg_color: {
        type: Sequelize.STRING(30),
        defaultValue: 'bg-blue-50',
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('peraturan');
  },
};
