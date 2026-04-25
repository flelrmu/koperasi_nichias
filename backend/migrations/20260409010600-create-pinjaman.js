'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pinjaman', {
      pinjaman_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      anggota_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'anggota',
          key: 'anggota_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      jenis_pinjaman: {
        type: Sequelize.ENUM('Uang', 'Barang'),
      },
      nama_barang: {
        type: Sequelize.STRING(100),
        comment: 'Diisi jika jenis=Barang',
      },
      keperluan: {
        type: Sequelize.TEXT,
        comment: 'Alasan atau tujuan pengajuan pinjaman',
      },
      jumlah_pinjaman: {
        type: Sequelize.DECIMAL(15, 2),
        comment: 'Nominal Uang/Harga Barang yang DIAJUKAN',
      },
      terbilang: {
        type: Sequelize.TEXT,
        comment: 'Jumlah pinjaman diajukan dalam bentuk tulisan/huruf',
      },
      tenor: {
        type: Sequelize.INTEGER,
        comment: 'Bulan (10/15/20) yang diajukan',
      },
      tanggal_pengajuan: {
        type: Sequelize.DATEONLY,
      },
      pinjaman_disetujui: {
        type: Sequelize.DECIMAL(15, 2),
        comment: 'Nominal yang DI-ACC (Bisa lebih kecil dari pengajuan)',
      },
      total_bunga: {
        type: Sequelize.DECIMAL(15, 2),
        comment: 'Jasa Pinjaman atau Margin Profit',
      },
      total_angsuran: {
        type: Sequelize.DECIMAL(15, 2),
        comment: 'Pokok Disetujui + Bunga',
      },
      angsuran_per_bulan: {
        type: Sequelize.DECIMAL(15, 2),
        comment: 'Limit Potongan Gaji dicek berdasarkan Jabatan',
      },
      acc_koordinator_id: {
        type: Sequelize.INTEGER,
        comment: 'User ID Koordinator SP',
        references: {
          model: 'users',
          key: 'user_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tgl_acc_koordinator: {
        type: Sequelize.DATE,
      },
      catatan_pengurus: {
        type: Sequelize.TEXT,
        comment: 'Alasan penolakan atau catatan kondisi persetujuan',
      },
      status: {
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected', 'Lunas'),
        defaultValue: 'Pending',
      },
      sisa_tagihan: {
        type: Sequelize.DECIMAL(15, 2),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pinjaman');
  },
};
