'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add Konfigurasi if not exists
    const configs = [
      { nama_config: 'BANK_KOPERASI', nilai: 'Bank BCA', keterangan: 'Nama bank resmi koperasi untuk transfer simpanan pokok', updated_by: null },
      { nama_config: 'NOREK_KOPERASI', nilai: '123-456-7890', keterangan: 'Nomor rekening resmi koperasi untuk transfer simpanan pokok', updated_by: null },
      { nama_config: 'ATAS_NAMA_KOPERASI', nilai: 'Koperasi Nichias Sunijaya', keterangan: 'Atas nama rekening resmi koperasi untuk transfer simpanan pokok', updated_by: null }
    ];

    for (const config of configs) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT config_id FROM konfigurasi WHERE nama_config = '${config.nama_config}'`
      );
      if (existing.length === 0) {
        await queryInterface.bulkInsert('konfigurasi', [{
          ...config,
          updated_at: new Date()
        }]);
      }
    }

    // 2. Add Peraturan if not exists
    const regulations = [
      {
        judul: 'Bank Koperasi',
        deskripsi: 'Nama bank resmi koperasi untuk penerimaan transfer simpanan pokok dari anggota baru.',
        kategori: 'Simpanan',
        ketentuan_utama: 'Bank BCA',
        nilai_numerik: null,
        tujuan: 'Memudahkan anggota baru mengetahui bank tujuan transfer simpanan pokok.',
        syarat_ketentuan: JSON.stringify(['Harus sesuai dengan bank yang didukung oleh sistem']),
        prosedur: JSON.stringify(['Diubah oleh Sekretaris jika rekening bank koperasi berubah']),
        icon_name: 'Building2',
        icon_color: 'text-blue-600',
        icon_bg_color: 'bg-blue-50',
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        judul: 'No Rekening Koperasi',
        deskripsi: 'Nomor rekening resmi koperasi untuk penerimaan transfer simpanan pokok dari anggota baru.',
        kategori: 'Simpanan',
        ketentuan_utama: '123-456-7890',
        nilai_numerik: null,
        tujuan: 'Menyediakan nomor rekening tujuan transfer bagi anggota baru.',
        syarat_ketentuan: JSON.stringify(['Diisi dengan nomor rekening yang valid']),
        prosedur: JSON.stringify(['Diubah oleh Sekretaris jika nomor rekening koperasi berubah']),
        icon_name: 'CreditCard',
        icon_color: 'text-indigo-600',
        icon_bg_color: 'bg-indigo-50',
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        judul: 'Atas Nama Koperasi',
        deskripsi: 'Nama pemilik rekening bank resmi koperasi untuk penerimaan transfer simpanan pokok.',
        kategori: 'Simpanan',
        ketentuan_utama: 'Koperasi Nichias Sunijaya',
        nilai_numerik: null,
        tujuan: 'Memastikan penerima transfer sesuai atas nama koperasi untuk menghindari salah transfer.',
        syarat_ketentuan: JSON.stringify(['Nama harus persis sama dengan yang terdaftar di bank']),
        prosedur: JSON.stringify(['Diubah oleh Sekretaris jika nama pemilik rekening berubah']),
        icon_name: 'User',
        icon_color: 'text-purple-600',
        icon_bg_color: 'bg-purple-50',
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const rule of regulations) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT peraturan_id FROM peraturan WHERE judul = '${rule.judul}'`
      );
      if (existing.length === 0) {
        await queryInterface.bulkInsert('peraturan', [rule]);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('konfigurasi', {
      nama_config: ['BANK_KOPERASI', 'NOREK_KOPERASI', 'ATAS_NAMA_KOPERASI']
    });
    await queryInterface.bulkDelete('peraturan', {
      judul: ['Bank Koperasi', 'No Rekening Koperasi', 'Atas Nama Koperasi']
    });
  }
};
