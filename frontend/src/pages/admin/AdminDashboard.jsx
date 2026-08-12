import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  UserPlus,
  LayoutDashboard
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Button from '../../components/atoms/Button';


const divisionData = [
  { name: 'Produksi', value: 45, color: '#004A9C' },
  { name: 'Logistik', value: 25, color: '#27AE60' },
  { name: 'Maintenance', value: 15, color: '#F2994A' },
  { name: 'Admin', value: 15, color: '#EB5757' },
];

const financeData = [
  { name: 'Jan', debit: 0, credit: 0 },
  { name: 'Feb', debit: 0, credit: 0 },
  { name: 'Mar', debit: 0, credit: 0 },
  { name: 'Apr', debit: 0, credit: 0 },
  { name: 'Mei', debit: 0, credit: 0 },
  { name: 'Jun', debit: 0, credit: 0 },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const socket = useSocket();
  const roleLabel = user?.role?.replace(/_/g, ' ') || 'Pengurus';

  const [dashboardData, setDashboardData] = useState({
    topStats: { totalAnggotaAktif: 0, pendaftaranPending: 0, pinjamanPending: 0, aktifitasHariIni: 0 },
    aliranDana: [],
    distribusiDivisi: [],
    ringkasanSimpanan: { pokok: 0, wajib: 0, sukarela: 0, total: 0 },
    nilaiPinjaman: { berjalan: 0, potensi: 0, total: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredStat, setHoveredStat] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    if (socket) {
      const handleUpdate = () => {
        console.log('🔄 Dashboard real-time update triggered');
        fetchDashboardData();
      };

      socket.on('dashboardUpdate', handleUpdate);
      socket.on('transaksi:created', handleUpdate);
      socket.on('transaksi:updated', handleUpdate);
      socket.on('simpanan:updated', handleUpdate);
      socket.on('simpanan:bulkUpdated', handleUpdate);
      socket.on('pinjaman:updated', handleUpdate);
      socket.on('pinjaman:created', handleUpdate);

      return () => {
        socket.off('dashboardUpdate', handleUpdate);
        socket.off('transaksi:created', handleUpdate);
        socket.off('transaksi:updated', handleUpdate);
        socket.off('simpanan:updated', handleUpdate);
        socket.off('simpanan:bulkUpdated', handleUpdate);
        socket.off('pinjaman:updated', handleUpdate);
        socket.off('pinjaman:created', handleUpdate);
      };
    }
  }, [socket, api]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.1,
        when: "beforeChildren"
      } 
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { duration: 0.5, ease: 'easeOut' } 
    },
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatCompactCurrency = (val) => {
    if (!val) return 'Rp 0';
    const num = parseFloat(val);
    if (num >= 1000000) {
      return `Rp ${(num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1)} Jt`;
    }
    if (num >= 1000) {
      return `Rp ${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)} Rb`;
    }
    return formatCurrency(num);
  };

  const topStats = [
    { label: 'Total Anggota Aktif', value: dashboardData.topStats.totalAnggotaAktif, icon: Users, color: '#004A9C', trend: 'Live', path: '/admin/users' },
    { label: 'Pendaftaran Pending', value: dashboardData.topStats.pendaftaranPending, icon: UserPlus, color: '#F2994A', trend: 'Perlu review', path: '/admin/users' },
    { label: 'Pinjaman Pending', value: dashboardData.topStats.pinjamanPending, icon: Clock, color: '#EB5757', trend: 'Segera proses', path: '/admin/simpan-pinjam' },
    { label: 'Aktivitas Hari Ini', value: dashboardData.topStats.aktifitasHariIni, icon: Activity, color: '#27AE60', trend: 'Normal', path: null },
  ];

  const savingsStats = [
    { label: 'Simpanan Pokok', rawValue: dashboardData.ringkasanSimpanan.pokok, color: '#004A9C' },
    { label: 'Simpanan Wajib', rawValue: dashboardData.ringkasanSimpanan.wajib, color: '#27AE60' },
    { label: 'Simpanan Sukarela', rawValue: dashboardData.ringkasanSimpanan.sukarela, color: '#F2994A' },
    { label: 'Total Dana Simpanan', rawValue: dashboardData.ringkasanSimpanan.total, color: '#1e293b', highlighted: true },
  ];

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants} 
      className="space-y-8 pb-10"
    >
      {}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-900/5 relative overflow-hidden"
      >
        {}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#DFEAF4] rounded-full -mr-32 -mt-32 opacity-40 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#004A9C]/5 rounded-full -ml-24 -mb-24 opacity-40 blur-3xl"></div>
        
        <div className="space-y-3 relative z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#DFEAF4] text-[#004A9C] rounded-full text-xs font-bold uppercase tracking-widest"
          >
            <LayoutDashboard size={14} />
            <span>Overview</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Ringkasan <span className="text-[#004A9C]">Dashboard</span>
          </h2>
          <p className="text-gray-500 text-lg">
            Selamat datang kembali, <span className="font-bold text-gray-700">{user?.nama_lengkap || 'Pengurus'}</span>. Berikut performa koperasi hari ini.
          </p>
        </div>
        
      </motion.div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {topStats.map((stat, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            onClick={() => stat.path && navigate(stat.path)}
            className={`bg-white rounded-[2.5rem] shadow-sm p-8 border border-gray-100 hover:shadow-2xl hover:shadow-blue-900/10 transition-all group relative overflow-hidden aspect-square flex flex-col items-center justify-center text-center ${stat.path ? 'cursor-pointer' : ''}`}
          >
            {}
            <div 
              className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 transition-transform duration-700 group-hover:scale-150"
              style={{ backgroundColor: stat.color }}
            />

            <div
              className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-sm transition-all group-hover:scale-110 group-hover:rotate-6 duration-500 mb-6 flex-shrink-0"
              style={{ backgroundColor: `${stat.color}10`, color: stat.color }}
            >
              <stat.icon size={28} />
            </div>

            <div className="space-y-2 relative z-10">
              <h3 className="text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] leading-tight px-2">{stat.label}</h3>
              <p className="text-4xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
            </div>
            
            {stat.path && (
              <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                <ArrowUpRight size={20} className="text-[#004A9C]" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500">
          <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-black text-gray-800 tracking-tight">Aliran Dana (Debit vs Kredit)</h3>
              <p className="text-sm text-gray-400">Analisis arus kas masuk dan keluar 6 bulan terakhir</p>
            </div>
            <div className="flex p-1.5 bg-gray-50 rounded-xl gap-1">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm">
                <div className="w-2 h-2 rounded-full bg-[#27AE60]"></div>
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Debit (Masuk)</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-[#EB5757]"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kredit (Keluar)</span>
              </div>
            </div>
          </div>
          <div className="flex-1 p-8 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.aliranDana.length > 0 ? dashboardData.aliranDana : financeData}>
                <defs>
                  <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#27AE60" stopOpacity={0.05}/>
                    <stop offset="95%" stopColor="#27AE60" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EB5757" stopOpacity={0.05}/>
                    <stop offset="95%" stopColor="#EB5757" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} 
                  tickFormatter={(val) => `Rp ${val/1000000}jt`}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 50px rgba(0,74,156,0.1)',
                    padding: '16px'
                  }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                  labelStyle={{ fontWeight: 'black', marginBottom: '8px', color: '#1e293b' }}
                  cursor={{ stroke: '#27AE60', strokeWidth: 1, strokeDasharray: '5 5' }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="debit" stroke="#27AE60" strokeWidth={4} fillOpacity={1} fill="url(#colorDebit)" animationDuration={1500} />
                <Area type="monotone" dataKey="credit" stroke="#EB5757" strokeWidth={4} fillOpacity={1} fill="url(#colorCredit)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500">
          <div className="p-8 border-b border-gray-50 text-center">
            <h3 className="text-xl font-black text-gray-800 tracking-tight">Distribusi Divisi</h3>
            <p className="text-sm text-gray-400">Persentase anggota aktif per unit kerja</p>
          </div>
          <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[350px]">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dashboardData.distribusiDivisi.length > 0 ? dashboardData.distribusiDivisi : divisionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {(dashboardData.distribusiDivisi.length > 0 ? dashboardData.distribusiDivisi : divisionData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <RechartsTooltip 
                   contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full mt-6">
              {(dashboardData.distribusiDivisi.length > 0 ? dashboardData.distribusiDivisi : divisionData).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-gray-700 truncate">{item.name}</span>
                    <span className="text-[10px] font-bold text-gray-400">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center bg-blue-50 text-[#004A9C] rounded-[1.5rem] shadow-inner flex-shrink-0">
                <Wallet size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800 tracking-tight">Ringkasan Simpanan</h3>
                <p className="text-sm text-gray-400">Total simpanan anggota koperasi</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/admin/simpan-pinjam')}
              className="px-4 py-2 bg-gray-50 text-[#004A9C] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#DFEAF4] transition-all"
            >
              Detail &rarr;
            </button>
          </div>

          <div className="space-y-4">
            {savingsStats.map((stat, idx) => (
              <motion.div 
                key={idx} 
                whileHover={{ x: 5 }}
                onMouseEnter={() => setHoveredStat(`savings-${idx}`)}
                onMouseLeave={() => setHoveredStat(null)}
                className={`flex items-center justify-between p-5 rounded-2xl transition-all border relative ${
                  stat.highlighted 
                  ? 'bg-[#004A9C] border-[#004A9C] text-white shadow-lg shadow-[#004A9C]/20' 
                  : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:border-blue-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-1.5 h-10 rounded-full ${stat.highlighted ? 'bg-white/30' : ''}`} style={{ backgroundColor: stat.highlighted ? undefined : stat.color }}></div>
                  <span className={`text-[13px] font-bold ${stat.highlighted ? 'text-white/80' : 'text-gray-500'} uppercase tracking-wider`}>{stat.label}</span>
                </div>
                
                <div className="relative">
                  <span className={`text-lg font-black transition-all duration-300 ${stat.highlighted ? 'text-white' : 'text-gray-800'} ${hoveredStat === `savings-${idx}` ? 'blur-sm opacity-20' : ''}`}>
                    {formatCompactCurrency(stat.rawValue)}
                  </span>
                  
                  <AnimatePresence>
                    {hoveredStat === `savings-${idx}` && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: -20, y: 0 }}
                        animate={{ opacity: 1, scale: 1, x: -10, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -20, y: 0 }}
                        className={`absolute inset-y-0 right-full mr-4 flex items-center z-50`}
                      >
                         <span className={`text-sm font-black whitespace-nowrap px-4 py-1.5 rounded-full border backdrop-blur-sm ${stat.highlighted ? 'bg-white/20 text-white border-white/30 shadow-xl' : 'bg-white/80 text-gray-900 border-gray-100 shadow-sm'}`}>
                           {formatCurrency(stat.rawValue)}
                         </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col justify-between hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center bg-red-50 text-[#EB5757] rounded-[1.5rem] shadow-inner flex-shrink-0">
                <CreditCard size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800 tracking-tight">Nilai Pinjaman (Exposure)</h3>
                <p className="text-sm text-gray-400">Total akumulasi pinjaman berjalan</p>
              </div>
            </div>
          </div>

          <div 
            className="flex-1 flex flex-col justify-center text-center p-6 relative"
            onMouseEnter={() => setHoveredStat('loan-total')}
            onMouseLeave={() => setHoveredStat(null)}
          >
            <div className="relative inline-block mx-auto">
              <motion.p 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`text-5xl font-black text-gray-900 mb-3 tracking-tighter transition-all duration-300 ${hoveredStat === 'loan-total' ? 'blur-md opacity-10' : ''}`}
              >
                {formatCompactCurrency(dashboardData.nilaiPinjaman.total)}
              </motion.p>
              
              <AnimatePresence>
                {hoveredStat === 'loan-total' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    className="absolute inset-0 flex items-center justify-center z-50"
                  >
                     <span className="text-2xl font-black text-gray-900 whitespace-nowrap px-8 py-3 bg-white/80 backdrop-blur-sm rounded-full border border-gray-100 shadow-sm">
                       {formatCurrency(dashboardData.nilaiPinjaman.total)}
                     </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto leading-relaxed">
              Total estimasi dana kas yang sedang dipinjam <span className="text-green-500">(Aktif)</span> dan potensi dana keluar <span className="text-orange-500">(Pending)</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-50">
            <div className="bg-orange-50/50 p-5 rounded-[2rem] text-center border border-orange-100 group hover:bg-orange-50 transition-all">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Potensi (Pending)</p>
              <p className="text-xl font-black text-orange-700">{formatCurrency(dashboardData.nilaiPinjaman.potensi)}</p>
            </div>
            <div className="bg-green-50/50 p-5 rounded-[2rem] text-center border border-green-100 group hover:bg-green-50 transition-all">
              <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">Berjalan (Aktif)</p>
              <p className="text-xl font-black text-green-700">{formatCurrency(dashboardData.nilaiPinjaman.berjalan)}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
