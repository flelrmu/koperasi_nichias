const { Pinjaman, Anggota, User } = require('../models');

async function test() {
  try {
    const loan = await Pinjaman.findOne({
      include: [
        {
          model: Anggota,
          as: 'anggota',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });
    console.log('Loan Data:', JSON.stringify(loan, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();
