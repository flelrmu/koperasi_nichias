import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  Clock, 
  Activity, 
  LayoutDashboard,
  ArrowUpRight,
  ChevronRight,
  Info,
  Calendar,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/atoms/StatusBadge';

export default function Dashboard() {
  const { api, user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/user/profile');
      if (response.data.success) {
        setProfileData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004A9C]"></div>
      </div>
    );
  }

  const totalSimpanan = (parseFloat(profileData?.simpanan?.saldo_pokok || 0) + 
                         parseFloat(profileData?.simpanan?.saldo_wajib || 0) + 
                         parseFloat(profileData?.simpanan?.saldo_sukarela || 0));
  
  const sisaPinjaman = profileData?.pinjaman?.reduce((acc, curr) => acc + parseFloat(curr.sisa_tagihan || 0), 0) || 0;
  const totalSHU = profileData?.pembagianShu?.reduce((acc, curr) => acc + parseFloat(curr.nominal_shu || 0), 0) || 0;

  const stats = [
    { 
      label: 'Total Simpanan', 
      value: formatCurrency(totalSimpanan), 
      icon: Wallet, 
      color: '#004A9C', 
      detail: 'Akumulasi saldo Anda' 
    },
    { 
      label: 'Sisa Pinjaman', 
      value: formatCurrency(sisaPinjaman), 
      icon: CreditCard, 
      color: '#EB5757', 
      detail: 'Total tagihan berjalan' 
    },
    { 
      label: 'Total SHU Diterima', 
      value: formatCurrency(totalSHU), 
      icon: TrendingUp, 
      color: '#27AE60', 
      detail: 'Sisa Hasil Usaha' 
    },
  ];

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants} 
      className="space-y-8 pb-10"
    >
      {/* Premium Header Section */}
      <motion.div 
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-900/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#DFEAF4] rounded-full -mr-32 -mt-32 opacity-40 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#004A9C]/5 rounded-full -ml-24 -mb-24 opacity-40 blur-3xl"></div>
        
        <div className="space-y-3 relative z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#DFEAF4] text-[#004A9C] rounded-full text-xs font-bold uppercase tracking-widest"
          >
            <LayoutDashboard size={14} />
            <span>Member Overview</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Selamat Datang, <span className="text-[#004A9C]">{profileData?.nama_lengkap?.split(' ')[0]}</span>!
          </h2>
          <p className="text-gray-500 text-lg font-medium">
            Pantau pertumbuhan simpanan dan status pinjaman Anda secara real-time.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-[#004A9C] text-white flex items-center justify-center shadow-lg shadow-[#004A9C]/20">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Anggota</p>
            <p className="text-lg font-black text-[#004A9C]">{profileData?.no_anggota || 'PROSES...'}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            variants={itemVariants}
            className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-gray-100 hover:shadow-2xl hover:shadow-blue-900/10 transition-all group relative overflow-hidden flex flex-col items-center justify-center text-center"
          >
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
              <p className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
              <p className="text-[10px] text-gray-400 font-medium italic">{stat.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions Table */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-[#004A9C] rounded-2xl">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800 tracking-tight">Aktifitas Terakhir</h3>
                <p className="text-sm text-gray-400 font-medium">Riwayat transaksi simpanan terbaru</p>
              </div>
            </div>
            <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="py-5 px-8">Tanggal</th>
                  <th className="py-5 px-8">Keterangan</th>
                  <th className="py-5 px-8 text-right">Nominal</th>
                  <th className="py-5 px-8">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profileData?.transaksiSimpanan?.length > 0 ? (
                  profileData.transaksiSimpanan.map((trx, idx) => (
                    <motion.tr 
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-[#DFEAF4]/20 transition-all duration-300 group"
                    >
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-3">
                          <Calendar size={14} className="text-gray-300" />
                          <span className="text-xs font-bold text-gray-600">{formatDate(trx.tanggal)}</span>
                        </div>
                      </td>
                      <td className="py-5 px-8 text-sm font-bold text-gray-700 tracking-tight">
                        {trx.jenis_transaksi}
                      </td>
                      <td className="py-5 px-8 text-right">
                        <span className={`text-sm font-black ${trx.jenis_transaksi?.toLowerCase().includes('tarik') ? 'text-red-500' : 'text-[#27AE60]'}`}>
                          {trx.jenis_transaksi?.toLowerCase().includes('tarik') ? '-' : '+'}{formatCurrency(trx.nominal)}
                        </span>
                      </td>
                      <td className="py-5 px-8">
                        <StatusBadge status="Success" />
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-gray-400 italic font-medium uppercase tracking-widest text-[10px]">
                      Belum ada transaksi simpanan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Member Info / Rules Card */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-gradient-to-br from-[#004A9C] via-[#004A9C] to-[#0a56ad] rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-blue-900/20">
             {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="grid-member" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-member)" />
              </svg>
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-black mb-4">Informasi Keanggotaan</h3>
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Divisi / Unit Kerja</p>
                  <p className="font-black">{profileData?.divisi || '-'}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Tanggal Bergabung</p>
                  <p className="font-black">{formatDate(profileData?.tanggal_bergabung)}</p>
                </div>
              </div>
              <button className="mt-8 w-full py-4 bg-white text-[#004A9C] font-black rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10">
                Detail Profil <ArrowUpRight size={18} />
              </button>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-100 rounded-[2.5rem] p-8 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-inner">
              <Info size={24} />
            </div>
            <div>
              <h4 className="font-black text-orange-800 tracking-tight">Butuh Pinjaman?</h4>
              <p className="text-sm text-orange-600 font-medium leading-relaxed mt-1">
                Gunakan fasilitas pinjaman koperasi untuk kebutuhan mendesak atau modal usaha Anda.
              </p>
            </div>
            <button className="mt-2 text-orange-700 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
              Pelajari Aturan <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
