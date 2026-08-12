const {
  ArusKas,
  KategoriKas,
  Anggota,
  PembagianShu,
  RekapShu,
  Notifikasi,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");
const moment = require("moment");
const neracaController = require("../controllers/neracaController");
const ArusKasService = require("./ArusKasService");

class SHUService {
  




  async getAnnualProfit(tahun) {
    const startDate = `${tahun}-01-01`;
    const endDate = `${tahun}-12-31`;

    const plTrx = await ArusKas.findAll({
      include: [
        {
          model: KategoriKas,
          as: "kategoriKas",
          where: { tipe_neraca: { [Op.in]: ["Income", "Expense"] } },
          attributes: ["tipe_neraca"],
        },
      ],
      where: {
        tanggal: { [Op.between]: [startDate, endDate] },
      },
      attributes: [
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              "CASE WHEN `ArusKas`.`jenis` = 'Debit' THEN `nominal` ELSE 0 END",
            ),
          ),
          "totalDebit",
        ],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              "CASE WHEN `ArusKas`.`jenis` = 'Kredit' THEN `nominal` ELSE 0 END",
            ),
          ),
          "totalKredit",
        ],
      ],
      group: [sequelize.col("kategoriKas.tipe_neraca")],
      raw: true,
      nest: true,
    });

    let income = 0;
    let expense = 0;
    plTrx.forEach((t) => {
      const d = parseFloat(t.totalDebit || 0);
      const k = parseFloat(t.totalKredit || 0);
      const tipe = t.kategoriKas.tipe_neraca;
      if (tipe === "Income") income += d - k;
      else if (tipe === "Expense") expense += k - d;
    });

    // Incorporate the PROFIT/LOSS category's saldo_awal (set via Manajemen Saldo Awal)
    const plCat = await KategoriKas.findOne({
      where: { nama_kategori: "PROFIT/LOSS" },
    });
    const plBaseSaldo = plCat ? parseFloat(plCat.saldo_awal || 0) : 0;

    return (income - expense) + Math.abs(plBaseSaldo);
  }

  


  async getMemberSavingsProportions(tahun) {
    
    const members = await Anggota.findAll({
      where: { status_keanggotaan: "Aktif" },
    });

    const results = [];
    let totalAllMembersSavings = 0;

    for (const member of members) {
      const totalSaldo = (parseFloat(member.saldo_pokok) || 0) + 
                         (parseFloat(member.saldo_wajib) || 0) + 
                         (parseFloat(member.saldo_sukarela) || 0);
      totalAllMembersSavings += totalSaldo;

      results.push({
        anggota_id: member.anggota_id,
        nama_lengkap: member.nama_lengkap,
        no_anggota: member.no_anggota,
        total_simpanan: totalSaldo,
      });
    }

    return { members: results, totalAllMembersSavings };
  }

  


  async generatePreview(tahun) {
    const profit = await this.getAnnualProfit(tahun);
    const { members, totalAllMembersSavings } =
      await this.getMemberSavingsProportions(tahun);

    
    
    
    let recAnggota, recPengurus;
    if (profit >= 10000000) {
      recAnggota = Math.round((profit * 0.8) / 1000000) * 1000000;
      recPengurus = Math.round((profit * 0.15) / 1000000) * 1000000;
    } else {
      recAnggota = Math.round((profit * 0.8) / 1000) * 1000;
      recPengurus = Math.round((profit * 0.15) / 1000) * 1000;
    }
    const recLabaDitahan = profit - recAnggota - recPengurus;

    const existingRekap = await RekapShu.findOne({
      where: { tahun },
      include: [
        {
          model: PembagianShu,
          as: "details",
          include: [
            {
              model: Anggota,
              as: "anggota",
              attributes: ["nama_lengkap", "no_anggota"],
            },
          ],
        },
      ],
    });

    return {
      tahun,
      totalProfit: profit,
      rekomendasi: {
        jatah_anggota: recAnggota,
        jatah_pengurus: recPengurus,
        laba_ditahan: recLabaDitahan,
      },
      totalSimpananKoperasi: totalAllMembersSavings,
      memberCount: members.length,
      existingRekap: existingRekap
        ? {
            id: existingRekap.id,
            is_processed: existingRekap.is_processed,
            is_finalized: existingRekap.is_finalized,
            jatah_anggota: parseFloat(existingRekap.jatah_anggota),
            jatah_pengurus: parseFloat(existingRekap.jatah_pengurus),
            laba_ditahan: parseFloat(existingRekap.laba_ditahan),
            details: existingRekap.details.map((d) => {
              const raw = d.toJSON ? d.toJSON() : d;
              const rawShu = parseFloat(raw.shu_diterima || 0);
              return {
                ...raw,
                pembulatan: raw.pembulatan !== null && raw.pembulatan !== undefined
                  ? parseFloat(raw.pembulatan)
                  : Math.round(rawShu / 1000) * 1000,
              };
            }),
          }
        : null,
    };
  }

  


  async processSHU(
    tahun,
    jatahAnggota,
    jatahPengurus,
    labaDitahan,
    processedBy,
  ) {
    const transaction = await sequelize.transaction();
    try {
      const profit = await this.getAnnualProfit(tahun);
      const { members, totalAllMembersSavings } =
        await this.getMemberSavingsProportions(tahun);

      
      const rekap = await RekapShu.create(
        {
          tahun,
          total_profit: profit,
          jatah_anggota: jatahAnggota,
          jatah_pengurus: jatahPengurus,
          laba_ditahan: labaDitahan,
          is_processed: true,
          processed_at: new Date(),
          processed_by: processedBy,
        },
        { transaction },
      );

      
      let sumPembulatan = 0;
      for (const m of members) {
        if (totalAllMembersSavings > 0) {
          const p = m.total_simpanan / totalAllMembersSavings;
          const shuMember = p * jatahAnggota;
          const roundedMember = Math.round(shuMember / 1000) * 1000;
          sumPembulatan += roundedMember;

          await PembagianShu.create(
            {
              rekap_id: rekap.id,
              anggota_id: m.anggota_id,
              total_simpanan: m.total_simpanan,
              persentase: p,
              shu_diterima: shuMember,
              pembulatan: roundedMember,
            },
            { transaction },
          );
        }
      }

      
      const newLabaDitahan = profit - sumPembulatan - jatahPengurus;
      await rekap.update(
        {
          jatah_anggota: sumPembulatan,
          laba_ditahan: newLabaDitahan,
        },
        { transaction },
      );

      

      
      await Notifikasi.create(
        {
          user_id: processedBy,
          judul: "SHU Berhasil Diproses 📊",
          pesan: `Data SHU Tahun ${tahun} berhasil diproses.`,
          tipe: "sistem",
          link: "/admin/simpan-pinjam",
          is_read: false,
        },
        { transaction },
      );

      await transaction.commit();
      return rekap;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  


  async getEndingBankDec(tahun, transaction) {
    const startDate = `${tahun}-12-01`;
    const endDate = `${tahun}-12-31`;

    const catBank = await KategoriKas.findOne({
      where: { nama_kategori: "BANK" },
      transaction,
    });
    if (!catBank) return 0;

    
    const sAwalDec = await ArusKasService.getOpeningBalance(catBank, 12, tahun, { transaction });

    
    const currTrx = await ArusKas.findAll({
      where: { metode_pembayaran: "BANK", tanggal: { [Op.between]: [startDate, endDate] } },
      attributes: [
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Debit' THEN `nominal` ELSE 0 END")), 'totalDebit'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Kredit' THEN `nominal` ELSE 0 END")), 'totalKredit']
      ],
      transaction
    });
    const cDebit = parseFloat(currTrx[0]?.dataValues?.totalDebit || 0);
    const cKredit = parseFloat(currTrx[0]?.dataValues?.totalKredit || 0);

    return sAwalDec + cDebit - cKredit;
  }

  


  async getEndingLabaDitahanDec(catLabaDitahan, tahun, transaction) {
    const startDate = `${tahun}-12-01`;
    const endDate = `${tahun}-12-31`;

    
    const sAwalDec = await ArusKasService.getOpeningBalance(catLabaDitahan, 12, tahun, { transaction });

    const currTrx = await ArusKas.findAll({
      where: { kategori_id: catLabaDitahan.kategori_id, tanggal: { [Op.between]: [startDate, endDate] } },
      attributes: [
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Debit' THEN `nominal` ELSE 0 END")), 'totalDebit'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN `ArusKas`.`jenis` = 'Kredit' THEN `nominal` ELSE 0 END")), 'totalKredit']
      ],
      transaction
    });
    const cDebit = parseFloat(currTrx[0]?.dataValues?.totalDebit || 0);
    const cKredit = parseFloat(currTrx[0]?.dataValues?.totalKredit || 0);

    return sAwalDec + cDebit - cKredit;
  }

  


  async finalizeSHU(tahun, processedBy) {
    const transaction = await sequelize.transaction();
    try {
      const rekap = await RekapShu.findOne({ where: { tahun }, transaction });
      if (!rekap) throw new Error(`Data SHU tahun ${tahun} tidak ditemukan.`);
      if (rekap.is_finalized)
        throw new Error(`SHU tahun ${tahun} sudah difinalisasi.`);

      const totalProfit = parseFloat(rekap.total_profit);

      
      const [catLabaDitahan] = await KategoriKas.findOrCreate({
        where: { nama_kategori: "LABA DITAHAN" },
        defaults: { tipe_neraca: "Equity", kode_akun: "3-000", saldo_awal: 0 },
        transaction,
      });

      
      const [catAnggota] = await KategoriKas.findOrCreate({
        where: { nama_kategori: "PEMBAGIAN SHU ANGGOTA" },
        defaults: { tipe_neraca: "Equity", kode_akun: "3-200", saldo_awal: 0 },
        transaction,
      });

      const [catPengurus] = await KategoriKas.findOrCreate({
        where: { nama_kategori: "PEMBAGIAN SHU PENGURUS" },
        defaults: { tipe_neraca: "Equity", kode_akun: "3-201", saldo_awal: 0 },
        transaction,
      });

      
      const endingLabaDec = await this.getEndingLabaDitahanDec(catLabaDitahan, tahun, transaction);

      
      

      
      
      const tglBagi = moment().format('YYYY-MM-DD');

      if (rekap.jatah_anggota > 0) {
        await ArusKas.create(
          {
            kategori_id: catAnggota.kategori_id,
            tanggal: tglBagi,
            kode_transaksi: `SHU-${tahun}-ANGG`,
            keterangan: `Distribusi SHU Anggota Tahun ${tahun} (Auto-generated)`,
            jenis: "Kredit",
            nominal: rekap.jatah_anggota,
            metode_pembayaran: "BANK",
          },
          { transaction },
        );
      }

      if (rekap.jatah_pengurus > 0) {
        await ArusKas.create(
          {
            kategori_id: catPengurus.kategori_id,
            tanggal: tglBagi,
            kode_transaksi: `SHU-${tahun}-PENG`,
            keterangan: `Distribusi SHU Pengurus Tahun ${tahun} (Auto-generated)`,
            jenis: "Kredit",
            nominal: rekap.jatah_pengurus,
            metode_pembayaran: "BANK",
          },
          { transaction },
        );
      }

      await rekap.update({ is_finalized: true }, { transaction });

      
      await ArusKasService.recalculateSaldo({ transaction });

      
      const activeMembers = await Anggota.findAll({
        where: { status_keanggotaan: "Aktif" },
        attributes: ["user_id"],
        transaction,
      });

      for (const member of activeMembers) {
        if (member.user_id) {
          await Notifikasi.create(
            {
              user_id: member.user_id,
              judul: "SHU Telah Diterima 🎉",
              pesan: `Pembagian SHU Tahun ${tahun} telah dikalkulasi dan masuk ke akun Anda.`,
              tipe: "sistem",
              link: "/dashboard",
              is_read: false,
            },
            { transaction },
          );
        }
      }

      
      await Notifikasi.create(
        {
          user_id: processedBy,
          judul: "SHU Berhasil Dibagikan 🎉",
          pesan: `Distribusi SHU Tahun ${tahun} berhasil diselesaikan.`,
          tipe: "sistem",
          link: "/admin/simpan-pinjam",
          is_read: false,
        },
        { transaction },
      );

      await transaction.commit();
      return rekap;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  


  async cancelFinalizeSHU(tahun) {
    const transaction = await sequelize.transaction();
    try {
      const rekap = await RekapShu.findOne({ where: { tahun }, transaction });
      if (!rekap) throw new Error(`Data SHU tahun ${tahun} tidak ditemukan.`);
      if (!rekap.is_finalized)
        throw new Error(`SHU tahun ${tahun} belum difinalisasi.`);

      const catLabaDitahan = await KategoriKas.findOne({
        where: { nama_kategori: "LABA DITAHAN" },
        transaction,
      });

      
      // SaldoBulanan destroy removed as SaldoBulanan is no longer used.


      
      await ArusKas.destroy({
        where: {
          kode_transaksi: {
            [Op.in]: [`SHU-${tahun}-ANGG`, `SHU-${tahun}-PENG`],
          },
        },
        transaction,
      });

      
      const activeMembers = await Anggota.findAll({
        where: { status_keanggotaan: "Aktif" },
        attributes: ["user_id"],
        transaction,
      });
      const memberUserIds = activeMembers.map((m) => m.user_id).filter(Boolean);

      await Notifikasi.destroy({
        where: {
          user_id: { [Op.in]: memberUserIds },
          judul: "SHU Telah Diterima 🎉",
          pesan: { [Op.like]: `%Tahun ${tahun}%` },
        },
        transaction,
      });

      await rekap.update({ is_finalized: false }, { transaction });

      
      await ArusKasService.recalculateSaldo({ transaction });

      await transaction.commit();
      return rekap;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  


  async cancelSHU(tahun) {
    const transaction = await sequelize.transaction();
    try {
      const rekap = await RekapShu.findOne({ where: { tahun }, transaction });
      if (!rekap) throw new Error(`Data SHU tahun ${tahun} tidak ditemukan.`);
      if (rekap.is_finalized)
        throw new Error(`SHU yang sudah difinalisasi tidak dapat dibatalkan.`);

      
      await PembagianShu.destroy({
        where: { rekap_id: rekap.id },
        transaction,
      });
      
      await rekap.destroy({ transaction });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  


  async updateDetailPembulatan(id, pembulatanValue) {
    const transaction = await sequelize.transaction();
    try {
      const detail = await PembagianShu.findByPk(id, { transaction });
      if (!detail) throw new Error("Detail pembagian SHU tidak ditemukan.");

      const rekap = await RekapShu.findByPk(detail.rekap_id, { transaction });
      if (!rekap) throw new Error("Rekap SHU tidak ditemukan.");
      if (rekap.is_finalized) throw new Error("Data SHU yang sudah final tidak dapat diubah.");

      
      await detail.update({ pembulatan: pembulatanValue }, { transaction });

      
      const allDetails = await PembagianShu.findAll({
        where: { rekap_id: detail.rekap_id },
        transaction,
      });

      let sumPembulatan = 0;
      for (const d of allDetails) {
        const pVal = d.pembulatan !== null && d.pembulatan !== undefined
          ? parseFloat(d.pembulatan)
          : Math.round(parseFloat(d.shu_diterima || 0) / 1000) * 1000;
        sumPembulatan += pVal;
      }

      
      const newLabaDitahan = parseFloat(rekap.total_profit) - sumPembulatan - parseFloat(rekap.jatah_pengurus);

      await rekap.update(
        {
          jatah_anggota: sumPembulatan,
          laba_ditahan: newLabaDitahan,
        },
        { transaction },
      );

      await transaction.commit();
      return detail;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new SHUService();
