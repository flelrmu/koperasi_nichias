import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  Activity,
  ArrowUpRight,
  UserPlus
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/atoms/StatusBadge';

// Mock data for charts
const divisionData = [
  { name: 'Produksi', value: 45, color: '#004A9C' },
  { name: 'Logistik', value: 25, color: '#27AE60' },
  { name: 'Maintenance', value: 15, color: '#F2994A' },
  { name: 'Admin', value: 15, color: '#EB5757' },
];

const financeData = [
  { name: 'Jan', debit: 4000, credit: 2400 },
  { name: 'Feb', debit: 3000, credit: 1398 },
  { name: 'Mar', debit: 2000, credit: 9800 },
  { name: 'Apr', debit: 2780, credit: 3908 },
  { name: 'Mei', debit: 1890, credit: 4800 },
  { name: 'Jun', debit: 2390, credit: 3800 },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const roleLabel = user?.role?.replace(/_/g, ' ') || 'Pengurus';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  // Stats for Member & Pending
  const topStats = [
    { label: 'Total Anggota Aktif', value: '1,248', icon: Users, color: '#004A9C', trend: '+12% bln ini' },
    { label: 'Pendaftaran Pending', value: '18', icon: UserPlus, color: '#F2994A', trend: 'Perlu review' },
    { label: 'Pinjaman Pending', value: '7', icon: Clock, color: '#EB5757', trend: 'Segera proses' },
    { label: 'Aktivitas Hari Ini', value: '42', icon: Activity, color: '#27AE60', trend: 'Normal' },
  ];

  // Savings Stats
  const savingsStats = [
    { label: 'Simpanan Pokok', value: 'Rp 125.000.000', color: '#004A9C' },
    { label: 'Simpanan Wajib', value: 'Rp 450.000.000', color: '#27AE60' },
    { label: 'Simpanan Sukarela', value: 'Rp 89.500.000', color: '#F2994A' },
    { label: 'Total Dana Simpanan', value: 'Rp 664.500.000', color: '#1e293b', highlighted: true },
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants} 
      className="space-y-8 pb-10"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Dashboard Overview
          </h2>
          <p className="text-gray-500 mt-1">
            Selamat datang kembali, <strong>{user?.nama_lengkap || 'Pengurus'}</strong>. Berikut adalah ringkasan hari ini.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status="Online" />
          <span className="text-xs font-medium text-gray-400">Role: {roleLabel}</span>
        </div>
      </motion.div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {topStats.map((stat, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="bg-white rounded-[20px] shadow-sm p-6 border border-gray-100/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
              >
                <stat.icon size={24} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md uppercase tracking-wider">
                Live
              </span>
            </div>
            <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-tight">{stat.label}</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-extrabold text-[#111827]">{stat.value}</p>
            </div>
            <p className="text-[11px] font-medium text-gray-400 mt-2 flex items-center gap-1">
              <TrendingUp size={12} className={stat.color === '#EB5757' ? 'text-red-400 rotate-180' : 'text-green-400'} />
              {stat.trend}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Finance Comparison Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Aliran Dana (Debit vs Kredit)</h3>
              <p className="text-xs text-gray-400">Perbandingan uang masuk dan keluar 6 bulan terakhir</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#004A9C]"></div>
                <span className="text-xs font-semibold text-gray-600">Debit</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#27AE60]"></div>
                <span className="text-xs font-semibold text-gray-600">Kredit</span>
              </div>
            </div>
          </div>
          <div className="flex-1 p-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financeData}>
                <defs>
                  <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004A9C" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#004A9C" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#27AE60" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#27AE60" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ stroke: '#004A9C', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Area type="monotone" dataKey="debit" stroke="#004A9C" strokeWidth={3} fillOpacity={1} fill="url(#colorDebit)" />
                <Area type="monotone" dataKey="credit" stroke="#27AE60" strokeWidth={3} fillOpacity={1} fill="url(#colorCredit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Member Distribution Chart */}
        <motion.div variants={itemVariants} className="bg-white rounded-[24px] shadow-sm border border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-50 text-center lg:text-left">
            <h3 className="text-lg font-bold text-gray-800">Distribusi Divisi</h3>
            <p className="text-xs text-gray-400">Persentase anggota berdasarkan unit kerja</p>
          </div>
          <div className="flex-1 p-6 flex flex-col items-center justify-center min-h-[300px]">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={divisionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {divisionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              {divisionData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[11px] font-bold text-gray-600 truncate">{item.name}</span>
                  <span className="text-[11px] font-medium text-gray-400 ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Savings & Financials Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Savings Summary */}
        <motion.div variants={itemVariants} className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-[#004A9C] rounded-2xl">
                <Wallet size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Ringkasan Simpanan</h3>
            </div>
            <button className="text-xs font-bold text-[#004A9C] hover:underline">Detail Keuangan &rarr;</button>
          </div>

          <div className="space-y-4">
            {savingsStats.map((stat, idx) => (
              <div 
                key={idx} 
                className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                  stat.highlighted ? 'bg-[#004A9C] text-white' : 'bg-gray-50/50 border border-gray-100 hover:bg-white hover:border-blue-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-8 rounded-full ${stat.highlighted ? 'bg-white/30' : ''}`} style={{ backgroundColor: stat.highlighted ? undefined : stat.color }}></div>
                  <span className={`text-sm font-bold ${stat.highlighted ? 'text-white' : 'text-gray-600'}`}>{stat.label}</span>
                </div>
                <span className={`text-base font-extrabold ${stat.highlighted ? 'text-white' : 'text-gray-800'}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Loan Exposure */}
        <motion.div variants={itemVariants} className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 text-[#EB5757] rounded-2xl">
                <CreditCard size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Nilai Pinjaman (Exposure)</h3>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center text-center">
            <p className="text-5xl font-black text-[#111827] mb-2">Rp 1.104.280.000</p>
            <p className="text-sm font-semibold text-gray-400 max-w-xs mx-auto">
              Total estimasi dana kas yang sedang dipinjam (Aktif) dan potensi dana keluar (Pending).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-50">
            <div className="bg-orange-50/30 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">Potensi (Pending)</p>
              <p className="text-lg font-black text-orange-800">Rp 45.5M</p>
            </div>
            <div className="bg-green-50/30 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Berjalan (Aktif)</p>
              <p className="text-lg font-black text-green-800">Rp 1.05M</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Action Footer */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-[#004A9C] to-[#0d4c9e] rounded-[24px] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-900/10">
        <div>
          <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
            Punya tugas mendesak? <ArrowUpRight size={20} />
          </h3>
          <p className="text-white/70 text-sm">Akses menu manajemen untuk memproses pendaftaran atau pinjaman baru.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white text-[#004A9C] font-bold rounded-xl text-sm transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-black/10">
            Manajemen Anggota
          </button>
          <button className="px-6 py-3 bg-[#ffffff20] text-white border border-white/30 backdrop-blur-sm font-bold rounded-xl text-sm transition-transform hover:scale-105 active:scale-95">
            Laporan Keuangan
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
