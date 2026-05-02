const { sequelize } = require('../models');

async function addColumn() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('pinjaman');
    
    if (!tableInfo.nomor_invoice) {
      console.log('Adding nomor_invoice column to pinjaman table...');
      await queryInterface.addColumn('pinjaman', 'nomor_invoice', {
        type: require('sequelize').DataTypes.STRING,
        allowNull: true,
        comment: 'Nomor Invoice unik (INV/PNJ/...)'
      });
      console.log('✅ Column added successfully!');
    } else {
      console.log('Column nomor_invoice already exists.');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding column:', error);
    process.exit(1);
  }
}

addColumn();
