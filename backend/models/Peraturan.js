'use strict';

module.exports = (sequelize, DataTypes) => {
  const Peraturan = sequelize.define('Peraturan', {
    peraturan_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    judul: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: 'Nama peraturan (ex: Simpanan Pokok)',
    },
    deskripsi: {
      type: DataTypes.TEXT,
      comment: 'Deskripsi singkat peraturan',
    },
    kategori: {
      type: DataTypes.ENUM('Simpanan', 'Pinjaman', 'Keanggotaan'),
      allowNull: false,
    },
    ketentuan_utama: {
      type: DataTypes.STRING(100),
      comment: 'Value highlight (ex: Rp 100.000)',
    },
    nilai_numerik: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Nilai angka yang bisa dipakai di kode (ex: 1.00 untuk suku bunga 1%)',
    },
    tujuan: {
      type: DataTypes.TEXT,
      comment: 'Tujuan/purpose kebijakan',
    },
    syarat_ketentuan: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array of strings — syarat & ketentuan',
      get() {
        const val = this.getDataValue('syarat_ketentuan');
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch { return []; }
        }
        return val || [];
      },
    },
    prosedur: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array of strings — prosedur pengajuan',
      get() {
        const val = this.getDataValue('prosedur');
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch { return []; }
        }
        return val || [];
      },
    },
    icon_name: {
      type: DataTypes.STRING(50),
      defaultValue: 'FileText',
      comment: 'Nama icon Lucide (ex: Wallet, CreditCard)',
    },
    icon_color: {
      type: DataTypes.STRING(30),
      defaultValue: 'text-blue-600',
      comment: 'Class warna icon Tailwind',
    },
    icon_bg_color: {
      type: DataTypes.STRING(30),
      defaultValue: 'bg-blue-50',
      comment: 'Class background icon Tailwind',
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID Sekretaris yang terakhir edit',
      references: {
        model: 'users',
        key: 'user_id',
      },
    },
  }, {
    tableName: 'peraturan',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  Peraturan.associate = (models) => {
    Peraturan.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
  };

  return Peraturan;
};
