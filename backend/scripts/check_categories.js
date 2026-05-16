const db = require('../models');
(async () => {
  const cats = await db.KategoriKas.findAll();
  console.log(JSON.stringify(cats, null, 2));
  process.exit(0);
})();
