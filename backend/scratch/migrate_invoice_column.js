const { sequelize } = require('../models');

async function migrate() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // 1. Check Angsuran table
    const angsuranInfo = await queryInterface.describeTable('angsuran');
    if (angsuranInfo.nomor_invoice) {
      console.log('Removing nomor_invoice from angsuran table...');
      await queryInterface.removeColumn('angsuran', 'nomor_invoice');
      console.log('✅ Column removed from angsuran.');
    } else {
      console.log('Column nomor_invoice NOT found in angsuran table.');
    }

    // 2. Check Pinjaman table
    const pinjamanInfo = await queryInterface.describeTable('pinjaman');
    if (!pinjamanInfo.nomor_invoice) {
      console.log('Adding nomor_invoice to pinjaman table...');
      await queryInterface.addColumn('pinjaman', 'nomor_invoice', {
        type: require('sequelize').DataTypes.STRING,
        allowNull: true,
        comment: 'Nomor Invoice unik (INV/PNJ/...)'
      });
      console.log('✅ Column added to pinjaman.');
    } else {
      console.log('Column nomor_invoice already exists in pinjaman table.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrate();
