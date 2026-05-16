/**
 * Fix: Repair empty jenis values from ENUM constraint issue during swap
 * Then recalculate all saldo_akhir
 */
const db = require('../models');
const { ArusKas, sequelize } = db;

async function fixSwap() {
  const transaction = await sequelize.transaction();
  try {
    console.log('🔧 Fixing empty jenis values...');
    
    // The 40 records that were originally Kredit → should now be Debit (masuk)
    await sequelize.query(
      "UPDATE arus_kas SET jenis = 'Debit' WHERE jenis = '' OR jenis IS NULL",
      { transaction }
    );

    // Verify
    const counts = await sequelize.query(
      'SELECT jenis, COUNT(*) as cnt FROM arus_kas GROUP BY jenis',
      { type: 'SELECT', transaction }
    );
    console.log('After fix:', JSON.stringify(counts));

    // Recalculate saldo
    console.log('💰 Recalculating saldo_akhir...');
    const allTrx = await ArusKas.findAll({ order: [['kas_id', 'ASC']], transaction });
    let currentSaldo = 0;
    for (const r of allTrx) {
      const nom = parseFloat(r.nominal);
      if (r.jenis === 'Debit') currentSaldo += nom;
      else currentSaldo -= nom;
      
      if (parseFloat(r.saldo_akhir) !== currentSaldo) {
        await ArusKas.update({ saldo_akhir: currentSaldo }, { where: { kas_id: r.kas_id }, transaction });
      }
    }
    console.log('Saldo akhir:', currentSaldo);

    await transaction.commit();
    console.log('✅ Done!');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

fixSwap();
