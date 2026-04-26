const { Anggota, Pinjaman, Simpanan, TransaksiSimpanan, ArusKas, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = moment().startOf('day');

    // 1. Total Anggota Aktif
    const totalAnggotaAktif = await Anggota.count({ where: { status_keanggotaan: 'Aktif' } });

    // 2. Pendaftaran Pending
    const pendaftaranPending = await Anggota.count({ where: { status_keanggotaan: 'Pending' } });

    // 3. Pinjaman Pending
    const pinjamanPending = await Pinjaman.count({ where: { status: 'Pending' } });

    // 4. Aktifitas Hari Ini (Anggota baru, Pinjaman baru/update, Transaksi Simpanan, Arus Kas)
    const anggotaHariIni = await Anggota.count({ where: { tanggal_registrasi: { [Op.gte]: today.toDate() } } });
    const pinjamanHariIni = await Pinjaman.count({ where: { tanggal_pengajuan: { [Op.gte]: today.format('YYYY-MM-DD') } } });
    const transaksiSimpananHariIni = await TransaksiSimpanan.count({ where: { tanggal: { [Op.gte]: today.format('YYYY-MM-DD') } } });
    const arusKasHariIni = await ArusKas.count({ where: { tanggal: { [Op.gte]: today.format('YYYY-MM-DD') } } });
    
    const aktifitasHariIni = anggotaHariIni + pinjamanHariIni + transaksiSimpananHariIni + arusKasHariIni;

    // 5. Aliran Dana (Debit Kredit 6 bulan terakhir dari Arus Kas)
    const sixMonthsAgo = moment().subtract(5, 'months').startOf('month');
    
    const aliranDanaRaw = await ArusKas.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('tanggal'), '%Y-%m'), 'month'],
        'jenis',
        [sequelize.fn('SUM', sequelize.col('nominal')), 'total']
      ],
      where: {
        tanggal: { [Op.gte]: sixMonthsAgo.format('YYYY-MM-DD') }
      },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('tanggal'), '%Y-%m'), 'jenis'],
      raw: true
    });

    // Format for recharts: { name: 'Jan', debit: 4000, credit: 2400 }
    const months = [];
    for(let i=5; i>=0; i--) {
      months.push(moment().subtract(i, 'months').format('YYYY-MM'));
    }

    const formatMonthName = (YYYYMM) => {
      const date = moment(YYYYMM, 'YYYY-MM');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return monthNames[date.month()];
    };

    const aliranDana = months.map(month => {
      const monthData = { name: formatMonthName(month), debit: 0, credit: 0 };
      aliranDanaRaw.forEach(item => {
        if (item.month === month) {
          if (item.jenis === 'Debit') monthData.debit = parseFloat(item.total);
          if (item.jenis === 'Kredit') monthData.credit = parseFloat(item.total);
        }
      });
      return monthData;
    });

    // 6. Distribusi Divisi
    const divisiRaw = await Anggota.findAll({
      attributes: [
        'divisi',
        [sequelize.fn('COUNT', sequelize.col('anggota_id')), 'count']
      ],
      where: { status_keanggotaan: 'Aktif' },
      group: ['divisi'],
      raw: true
    });

    const colors = ['#004A9C', '#27AE60', '#F2994A', '#EB5757', '#9B51E0', '#2D9CDB'];
    const totalDivisiMembers = divisiRaw.reduce((sum, item) => sum + parseInt(item.count), 0);
    
    const distribusiDivisi = divisiRaw.map((item, index) => ({
      name: item.divisi,
      value: totalDivisiMembers > 0 ? Math.round((parseInt(item.count) / totalDivisiMembers) * 100) : 0,
      count: parseInt(item.count),
      color: colors[index % colors.length]
    }));

    // 7. Ringkasan Simpanan
    const simpananData = await Simpanan.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('saldo_pokok')), 'total_pokok'],
        [sequelize.fn('SUM', sequelize.col('saldo_wajib')), 'total_wajib'],
        [sequelize.fn('SUM', sequelize.col('saldo_sukarela')), 'total_sukarela'],
      ],
      raw: true
    });

    const totalPokok = parseFloat(simpananData[0]?.total_pokok || 0);
    const totalWajib = parseFloat(simpananData[0]?.total_wajib || 0);
    const totalSukarela = parseFloat(simpananData[0]?.total_sukarela || 0);
    const totalDanaSimpanan = totalPokok + totalWajib + totalSukarela;

    const ringkasanSimpanan = {
      pokok: totalPokok,
      wajib: totalWajib,
      sukarela: totalSukarela,
      total: totalDanaSimpanan
    };

    // 8. Nilai Pinjaman (Pending & Aktif/Berjalan)
    const pinjamanAktifData = await Pinjaman.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('sisa_tagihan')), 'total_berjalan']
      ],
      where: {
        status: {
          [Op.in]: ['Approved', 'Berjalan'] // Adjust depending on exact statuses in your DB, sometimes it's 'Approved' with sisa_tagihan > 0
        },
        sisa_tagihan: { [Op.gt]: 0 }
      },
      raw: true
    });

    const pinjamanPendingData = await Pinjaman.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('jumlah_pinjaman')), 'total_potensi']
      ],
      where: { status: 'Pending' },
      raw: true
    });

    const nilaiPinjaman = {
      berjalan: parseFloat(pinjamanAktifData[0]?.total_berjalan || 0),
      potensi: parseFloat(pinjamanPendingData[0]?.total_potensi || 0),
      total: parseFloat(pinjamanAktifData[0]?.total_berjalan || 0) + parseFloat(pinjamanPendingData[0]?.total_potensi || 0)
    };

    res.json({
      success: true,
      data: {
        topStats: {
          totalAnggotaAktif,
          pendaftaranPending,
          pinjamanPending,
          aktifitasHariIni
        },
        aliranDana,
        distribusiDivisi,
        ringkasanSimpanan,
        nilaiPinjaman
      }
    });

  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching dashboard stats.' });
  }
};
