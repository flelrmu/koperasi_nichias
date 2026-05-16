/**
 * Migration Script: Swap Debit ↔ Kredit di tabel arus_kas
 * 
 * Perubahan logic:
 * - LAMA: Kredit = Masuk, Debit = Keluar
 * - BARU: Debit = Masuk, Kredit = Keluar
 * 
 * Script ini men-swap semua nilai jenis di arus_kas dan kategori_kas,
 * lalu recalculate seluruh saldo_akhir.
 */

const db = require('../models');
const { ArusKas, KategoriKas, sequelize } = db;

async function swapDebitKredit() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔄 Memulai swap Debit ↔ Kredit...\n');

    // ========== 1. Swap di tabel arus_kas ==========
    console.log('📊 Step 1: Swap jenis di tabel arus_kas...');
    
    const countKredit = await ArusKas.count({ where: { jenis: 'Kredit' }, transaction });
    const countDebit = await ArusKas.count({ where: { jenis: 'Debit' }, transaction });
    console.log(`   Sebelum: ${countKredit} Kredit, ${countDebit} Debit`);

    // Step 1a: Kredit → TEMP
    await sequelize.query(
      "UPDATE arus_kas SET jenis = 'TEMP' WHERE jenis = 'Kredit'",
      { transaction }
    );
    
    // Step 1b: Debit → Kredit
    await sequelize.query(
      "UPDATE arus_kas SET jenis = 'Kredit' WHERE jenis = 'Debit'",
      { transaction }
    );
    
    // Step 1c: TEMP → Debit
    await sequelize.query(
      "UPDATE arus_kas SET jenis = 'Debit' WHERE jenis = 'TEMP'",
      { transaction }
    );

    const newCountKredit = await ArusKas.count({ where: { jenis: 'Kredit' }, transaction });
    const newCountDebit = await ArusKas.count({ where: { jenis: 'Debit' }, transaction });
    console.log(`   Sesudah: ${newCountKredit} Kredit, ${newCountDebit} Debit`);

    // ========== 2. Swap default jenis di tabel kategori_kas ==========
    console.log('\n📂 Step 2: Swap jenis default di tabel kategori_kas...');
    
    await sequelize.query(
      "UPDATE kategori_kas SET jenis = 'TEMP' WHERE jenis = 'Kredit'",
      { transaction }
    );
    await sequelize.query(
      "UPDATE kategori_kas SET jenis = 'Kredit' WHERE jenis = 'Debit'",
      { transaction }
    );
    await sequelize.query(
      "UPDATE kategori_kas SET jenis = 'Debit' WHERE jenis = 'TEMP'",
      { transaction }
    );

    console.log('   ✅ Kategori kas jenis berhasil di-swap.');

    // ========== 3. Recalculate saldo_akhir ==========
    console.log('\n💰 Step 3: Recalculate saldo_akhir (Debit = Masuk, Kredit = Keluar)...');
    
    const allTrx = await ArusKas.findAll({
      order: [['kas_id', 'ASC']],
      transaction
    });

    let currentSaldo = 0;
    let recalcCount = 0;
    
    for (const r of allTrx) {
      const nom = parseFloat(r.nominal);
      if (r.jenis === 'Debit') {
        currentSaldo += nom; // Debit = Masuk
      } else {
        currentSaldo -= nom; // Kredit = Keluar
      }
      
      if (parseFloat(r.saldo_akhir) !== currentSaldo) {
        await ArusKas.update(
          { saldo_akhir: currentSaldo },
          { where: { kas_id: r.kas_id }, transaction }
        );
        recalcCount++;
      }
    }

    console.log(`   ✅ ${recalcCount} dari ${allTrx.length} record saldo diperbarui.`);
    console.log(`   💰 Saldo akhir terkini: Rp ${new Intl.NumberFormat('id-ID').format(currentSaldo)}`);

    await transaction.commit();
    console.log('\n🎉 Migration selesai! Debit = Masuk, Kredit = Keluar.');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Migration gagal, rollback dilakukan:', error.message);
  } finally {
    process.exit(0);
  }
}

swapDebitKredit();
