const db = require('../models');
const Anggota = db.Anggota;
const { Op } = require('sequelize');





async function generateNoAnggota() {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `KOP-${currentYear}-`;

  try {
    
    const lastMember = await Anggota.findOne({
      where: {
        no_anggota: {
          [Op.like]: `${yearPrefix}%`
        }
      },
      order: [['no_anggota', 'DESC']],
      attributes: ['no_anggota']
    });

    let nextNumber = 1;
    if (lastMember && lastMember.no_anggota) {
      const parts = lastMember.no_anggota.split('-');
      const lastSequence = parseInt(parts[2], 10);
      if (!isNaN(lastSequence)) {
        nextNumber = lastSequence + 1;
      }
    }

    
    const sequence = nextNumber.toString().padStart(3, '0');
    return `${yearPrefix}${sequence}`;
  } catch (error) {
    console.error('❌ Error generating no_anggota:', error);
    throw new Error('Gagal menggenerate nomor anggota.');
  }
}

module.exports = { generateNoAnggota };
