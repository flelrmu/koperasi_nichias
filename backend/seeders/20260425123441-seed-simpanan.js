'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const simpanan = [];
    for (let i = 1; i <= 20; i++) {
      simpanan.push({
        anggota_id: i,
        saldo_pokok: 1000000,
        saldo_wajib: 2500000,
        saldo_sukarela: Math.floor(Math.random() * 50) * 100000,
        last_updated: new Date()
      });
    }
    return queryInterface.bulkInsert('simpanan', simpanan);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('simpanan', null, {});
  }
};
