const db = require('../models');
(async () => {
  try {
    await db.sequelize.query("ALTER TABLE arus_kas ADD COLUMN metode_pembayaran ENUM('CASH', 'BANK') DEFAULT 'CASH'");
    console.log('Kolom metode_pembayaran berhasil ditambahkan.');
    process.exit(0);
  } catch (e) {
    console.error('Info:', e.message);
    process.exit(0); // Exit gracefully if column exists
  }
})();
