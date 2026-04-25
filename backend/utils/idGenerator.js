const db = require('../models');
const Anggota = db.Anggota;
const { Op } = require('sequelize');

/**
 * Generates a unique member number (no_anggota)
 * Format: KOP-[Year]-[Sequence] (e.g., KOP-2026-001)
 */
async function generateNoAnggota() {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `KOP-${currentYear}-`;

  try {
    // Find the latest member number for this year
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

    // Format to 3 digits (e.g., 001)
    const sequence = nextNumber.toString().padStart(3, '0');
    return `${yearPrefix}${sequence}`;
  } catch (error) {
    console.error('❌ Error generating no_anggota:', error);
    throw new Error('Gagal menggenerate nomor anggota.');
  }
}

module.exports = { generateNoAnggota };
