import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Plus, 
  FileText, 
  PieChart, 
  ArrowRightLeft,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/atoms/Button';
import StatusBadge from '../../components/atoms/StatusBadge';

// Mock Data
const MOCK_CASH_FLOW = [
  { id: 1, tanggal: '2026-04-15', kode: 'TRX001', kategori: 'Angsuran Pinjaman', jenis: 'Debit', keterangan: 'Angsuran ke-5 - Budi Santoso', nominal: 1500000, saldo: 45000000 },
  { id: 2, tanggal: '2026-04-16', kode: 'TRX002', kategori: 'Pencairan Pinjaman', jenis: 'Kredit', keterangan: 'Pinjaman Uang - Siti Aminah', nominal: 5000000, saldo: 40000000 },
  { id: 3, tanggal: '2026-04-17', kode: 'TRX003', kategori: 'Simpanan Sukarela', jenis: 'Debit', keterangan: 'Setoran - Ahmad Dahlan', nominal: 200000, saldo: 40200000 },
  { id: 4, tanggal: '2026-04-18', kode: 'TRX004', kategori: 'Biaya Operasional', jenis: 'Kredit', keterangan: 'Pembelian ATK Kantor', nominal: 150000, saldo: 40050000 },
  { id: 5, tanggal: '2026-04-19', kode: 'TRX005', kategori: 'Simpanan Wajib', jenis: 'Debit', keterangan: 'Potong Gaji All Members - April', nominal: 12500000, saldo: 52550000 },
];

const MOCK_LPHU = {
  periode: 'Januari - April 2026',
  pendapatan: [
    { label: 'Jasa Pinjaman (Bunga)', nominal: 15400000 },
    { label: 'Provisi & Administrasi', nominal: 2100000 },
    { label: 'Pendapatan Lain-lain', nominal: 500000 },
  ],
  beban: [
    { label: 'Beban Operasional', nominal: 3200000 },
    { label: 'Beban Honor Pengurus', nominal: 4000000 },
    { label: 'Beban Pajak', nominal: 450000 },
  ],
};

const MOCK_SHU = {
  totalShu: 10350000,
  pembagian: [
    { label: 'Cadangan Koperasi (40%)', nominal: 4140000, color: '#004A9C' },
    { label: 'Jasa Anggota (40%)', nominal: 4140000, color: '#27AE60' },
    { label: 'Dana Pengurus (10%)', nominal: 1035000, color: '#F2994A' },
    { label: 'Dana Pendidikan (5%)', nominal: 517500, color: '#EB5757' },
    { label: 'Dana Sosial (5%)', nominal: 517500, color: '#94a3b8' },
  ]
};

const MOCK_NERACA = {
  aktiva: [
    { label: 'Kas & Bank', nominal: 52550000 },
    { label: 'Piutang Pinjaman Anggota', nominal: 1104280000 },
    { label: 'Inventaris Kantor', nominal: 15000000 },
  ],
  passiva: [
    { label: 'Simpanan Pokok', nominal: 125000000 },
    { label: 'Simpanan Wajib', nominal: 450000000 },
    { label: 'Simpanan Sukarela', nominal: 89500000 },
    { label: 'Modal Cadangan', nominal: 450000000 },
    { label: 'SHU Berjalan', nominal: 57330000 },
  ]
};

export default function FinanceManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('arus-kas');
  const isBendahara = user?.role === 'Bendahara';

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const tabs = [
    { id: 'arus-kas', label: 'Arus Kas', icon: ArrowRightLeft },
    { id: 'lphu', label: 'LPHU', icon: BarChart3 },
    { id: 'shu', label: 'SHU', icon: PieChart },
    { id: 'neraca', label: 'Neraca', icon: FileText },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Manajemen Keuangan
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isBendahara 
              ? 'Kelola arus kas, generate laporan LPHU, SHU, dan Neraca akhir tahun.'
              : 'Pantau laporan keuangan dan posisi neraca koperasi (View Only).'}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {isBendahara && (
            <Button className="flex items-center gap-2 !px-6 text-sm">
              <Plus size={18} /> Update Kas
            </Button>
          )}
          <Button className="bg-[#DFEAF4] !text-[#004A9C] border border-[#004A9C]/20 flex items-center gap-2 !px-6 text-sm hover:bg-[#d0e1f0]">
            <Download size={18} /> Download Lap.
          </Button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto gap-1 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-[#004A9C] text-white shadow-lg shadow-blue-900/10' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          className="min-h-[500px]"
        >
          {activeTab === 'arus-kas' && (
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-lg font-bold text-gray-800">Riwayat Arus Kas</h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Cari transaksi..." 
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#004A9C]/20 focus:border-[#004A9C]"
                    />
                  </div>
                  <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <Filter size={18} className="text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Tanggal</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Kode</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Kategori</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Keterangan</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Debet/Kredit</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Saldo Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {MOCK_CASH_FLOW.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-700">{row.tanggal}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">{row.kode}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 font-medium">{row.kategori}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-400 line-clamp-1">{row.keterangan}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold ${row.jenis === 'Debit' ? 'text-green-600' : 'text-red-500'}`}>
                              {row.jenis === 'Debit' ? '+' : '-'} {formatCurrency(row.nominal)}
                            </span>
                            <StatusBadge status={row.jenis}>{row.jenis === 'Debit' ? 'Masuk' : 'Keluar'}</StatusBadge>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-extrabold text-[#1e293b]">{formatCurrency(row.saldo)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'lphu' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
                <h2 className="text-lg font-bold text-gray-800 mb-2">Pendapatan Operasional</h2>
                <p className="text-xs text-gray-400 mb-6">Periode: {MOCK_LPHU.periode}</p>
                <div className="space-y-4">
                  {MOCK_LPHU.pendapatan.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-green-50/30 border border-green-100/50 rounded-2xl">
                      <span className="text-sm font-bold text-green-800">{item.label}</span>
                      <span className="text-base font-extrabold text-green-900">{formatCurrency(item.nominal)}</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center px-4">
                    <span className="text-sm font-bold text-gray-800">Total Pendapatan</span>
                    <span className="text-xl font-black text-[#004A9C]">
                      {formatCurrency(MOCK_LPHU.pendapatan.reduce((a, b) => a + b.nominal, 0))}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
                <h2 className="text-lg font-bold text-gray-800 mb-2">Beban Operasional</h2>
                <p className="text-xs text-gray-400 mb-6">Segala biaya yang dikeluarkan koperasi</p>
                <div className="space-y-4">
                  {MOCK_LPHU.beban.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-red-50/30 border border-red-100/50 rounded-2xl">
                      <span className="text-sm font-bold text-red-800">{item.label}</span>
                      <span className="text-base font-extrabold text-red-900">({formatCurrency(item.nominal)})</span>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center px-4">
                    <span className="text-sm font-bold text-gray-800">Total Beban</span>
                    <span className="text-xl font-black text-red-600">
                      {formatCurrency(MOCK_LPHU.beban.reduce((a, b) => a + b.nominal, 0))}
                    </span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 bg-[#004A9C] rounded-[24px] p-8 text-white flex flex-col md:flex-row justify-between items-center shadow-xl shadow-blue-900/10">
                <div className="text-center md:text-left mb-4 md:mb-0">
                  <h3 className="text-2xl font-black">Laba Bersih (EAT)</h3>
                  <p className="text-blue-100/70 text-sm">Pendapatan dikurangi beban operasional & pajak</p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-4xl font-black text-white">
                    {formatCurrency(
                      MOCK_LPHU.pendapatan.reduce((a, b) => a + b.nominal, 0) - 
                      MOCK_LPHU.beban.reduce((a, b) => a + b.nominal, 0)
                    )}
                  </p>
                  {isBendahara && (
                    <button className="mt-2 text-xs font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
                      Update Jurnal Balik &rarr;
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shu' && (
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Pembagian SHU Tahunan</h2>
                    <p className="text-sm text-gray-400 mt-1">Estimasi pembagian sisa hasil usaha berdasarkan aturan AD/ART.</p>
                  </div>
                  <div className="space-y-3">
                    {MOCK_SHU.pembagian.map((item, idx) => (
                      <div key={idx} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-sm font-bold text-gray-600">{item.label}</span>
                        </div>
                        <span className="text-base font-extrabold text-gray-800">{formatCurrency(item.nominal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-full md:w-80 flex flex-col items-center justify-center text-center p-8 bg-[#DFEAF4]/30 rounded-[32px] border border-[#004A9C]/10">
                  <div className="w-20 h-20 bg-[#004A9C] rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-900/20">
                    <PieChart size={40} />
                  </div>
                  <p className="text-xs font-bold text-[#004A9C] uppercase tracking-wider mb-2">Total Dana SHU</p>
                  <p className="text-3xl font-black text-[#1e293b] leading-tight">
                    {formatCurrency(MOCK_SHU.totalShu)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-4 leading-relaxed">
                    Dana ini akan dikreditkan ke masing-masing saldo anggota sesuai dengan proporsi jasa modal dan jasa transaksi.
                  </p>
                  {isBendahara && (
                    <Button className="mt-8 !px-8 text-sm !rounded-2xl">Generate & Posting</Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'neraca' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 bg-blue-50 border-b border-blue-100">
                    <h2 className="text-lg font-bold text-[#004A9C] flex items-center gap-2">
                       <TrendingUp size={20} /> Aktiva (Harta)
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {MOCK_NERACA.aktiva.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600">{item.label}</span>
                        <span className="text-sm font-bold text-gray-800">{formatCurrency(item.nominal)}</span>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Total Aktiva</span>
                      <span className="text-lg font-black text-blue-700">
                        {formatCurrency(MOCK_NERACA.aktiva.reduce((a, b) => a + b.nominal, 0))}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 bg-orange-50 border-b border-orange-100">
                    <h2 className="text-lg font-bold text-orange-700 flex items-center gap-2">
                       <ArrowRightLeft size={20} /> Passiva (Kewajiban & Modal)
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {MOCK_NERACA.passiva.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2">
                        <span className="text-sm font-medium text-gray-600">{item.label}</span>
                        <span className="text-sm font-bold text-gray-800">{formatCurrency(item.nominal)}</span>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Total Passiva</span>
                      <span className="text-lg font-black text-orange-700">
                        {formatCurrency(MOCK_NERACA.passiva.reduce((a, b) => a + b.nominal, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balance Check */}
              <div className={`p-6 rounded-[24px] border ${
                MOCK_NERACA.aktiva.reduce((a, b) => a + b.nominal, 0) === MOCK_NERACA.passiva.reduce((a, b) => a + b.nominal, 0)
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              } flex items-center gap-4`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  MOCK_NERACA.aktiva.reduce((a, b) => a + b.nominal, 0) === MOCK_NERACA.passiva.reduce((a, b) => a + b.nominal, 0)
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {MOCK_NERACA.aktiva.reduce((a, b) => a + b.nominal, 0) === MOCK_NERACA.passiva.reduce((a, b) => a + b.nominal, 0)
                    ? <CheckCircle2 size={24} />
                    : <AlertCircle size={24} />
                  }
                </div>
                <div>
                  <h3 className={`font-bold ${
                    MOCK_NERACA.aktiva.reduce((a, b) => a + b.nominal, 0) === MOCK_NERACA.passiva.reduce((a, b) => a + b.nominal, 0)
                      ? 'text-green-800'
                      : 'text-red-800'
                  }`}>
                    {MOCK_NERACA.aktiva.reduce((a, b) => a + b.nominal, 0) === MOCK_NERACA.passiva.reduce((a, b) => a + b.nominal, 0)
                      ? 'Neraca Seimbang (Balanced)'
                      : 'Neraca Tidak Seimbang (Unbalanced)'
                    }
                  </h3>
                  <p className="text-xs opacity-70">Posisi keuangan koperasi dipastikan akurat berdasarkan pencatatan jurnal umum.</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer Info */}
      <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-gray-400" />
          <span className="text-sm text-gray-500">Terakhir Update: 19 April 2026, 16:45 WIB</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#27AE60]"></div>
            <span className="text-xs font-bold text-gray-600 uppercase">Live Sync</span>
          </div>
          <div className="flex items-center gap-2 font-poppins">
            <span className="text-xs text-gray-400">Dikelola oleh:</span>
            <span className="text-xs font-bold text-[#004A9C]">Sistem Keuangan Koperasi Nichias</span>
          </div>
        </div>
      </div>
    </div>
  );
}
