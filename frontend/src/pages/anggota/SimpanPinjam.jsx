import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PiggyBank, 
  Wallet, 
  CreditCard, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  Info, 
  Activity,
  Search,
  ChevronRight,
  TrendingUp,
  ArrowLeft,
  FileText,
  AlertCircle
} from 'lucide-react';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Select from '../../components/atoms/Select';
import Textarea from '../../components/atoms/Textarea';
import StatusBadge from '../../components/atoms/StatusBadge';
import Modal from '../../components/molecules/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function SimpanPinjam() {
  const { api, user } = useAuth();
  const socket = useSocket();
  const [activeTab, setActiveTab] = useState('simpanan');
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    jenis_pinjaman: 'Uang',
    nama_barang: '',
    jumlah_pinjaman: '',
    terbilang: '',
    keperluan: '',
    tenor: '10'
  });

  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/user/profile');
      if (response.data.success) {
        setProfileData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchData();
    };

    socket.on('simpanan:updated', handleUpdate);
    socket.on('transaksi:created', handleUpdate);
    socket.on('transaksi:updated', handleUpdate);
    socket.on('pinjaman:updated', handleUpdate);
    socket.on('pinjaman:created', handleUpdate);

    return () => {
      socket.off('simpanan:updated', handleUpdate);
      socket.off('transaksi:created', handleUpdate);
      socket.off('transaksi:updated', handleUpdate);
      socket.off('pinjaman:updated', handleUpdate);
      socket.off('pinjaman:created', handleUpdate);
    };
  }, [socket]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredTransactions = useMemo(() => {
    if (!profileData?.transaksiSimpanan) return [];
    return profileData.transaksiSimpanan
      .filter(trx => 
        trx.jenis_transaksi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trx.keterangan?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const dateA = new Date(a.tanggal);
        const dateB = new Date(b.tanggal);
        if (dateB - dateA !== 0) return dateB - dateA;
        return (b.transaksi_id || 0) - (a.transaksi_id || 0);
      });
  }, [profileData, searchQuery]);

  const filteredLoans = useMemo(() => {
    if (!profileData?.pinjaman) return [];
    return profileData.pinjaman
      .filter(loan => 
        loan.jenis_pinjaman?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.keperluan?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const dateA = new Date(a.tanggal_pengajuan);
        const dateB = new Date(b.tanggal_pengajuan);
        if (dateB - dateA !== 0) return dateB - dateA;
        return (b.pinjaman_id || 0) - (a.pinjaman_id || 0);
      });
  }, [profileData, searchQuery]);

  const activeData = activeTab === 'simpanan' ? filteredTransactions : filteredLoans;
  const totalPages = Math.ceil(activeData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return activeData.slice(start, start + itemsPerPage);
  }, [activeData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'jumlah_pinjaman') {
      const val = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: val }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitLoan = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/simpan-pinjam/pinjaman', formData);
      if (response.data.success) {
        setIsFormOpen(false);
        setFormData({
          jenis_pinjaman: 'Uang',
          nama_barang: '',
          jumlah_pinjaman: '',
          terbilang: '',
          keperluan: '',
          tenor: '10'
        });
        setStatusModal({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: 'Pengajuan pinjaman Anda telah berhasil dikirim dan sedang menunggu review.'
        });
      }
    } catch (error) {
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan saat mengirim pengajuan.'
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
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

  const Pagination = () => {
    if (activeData.length === 0) return null;
    return (
      <div className="p-8 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between bg-gray-50/20 gap-4">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest order-2 sm:order-1">
           Menampilkan <span className="text-[#004A9C]">{Math.min(activeData.length, (currentPage-1)*itemsPerPage + 1)} - {Math.min(activeData.length, currentPage*itemsPerPage)}</span> dari {activeData.length} Data
        </span>
        <div className="flex items-center gap-2 order-1 sm:order-2">
           <button 
             onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
             disabled={currentPage === 1}
             className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#004A9C] hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
           >
             <BiChevronLeft size={18} />
             <span>Sebelumnya</span>
           </button>
           <div className="flex gap-1.5 mx-1">
             {[...Array(totalPages)].map((_, i) => {
               const page = i + 1;
               return (
                 <button
                   key={page}
                   onClick={() => setCurrentPage(page)}
                   className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                     currentPage === page ? 'bg-[#004A9C] text-white shadow-lg shadow-[#004A9C]/20' : 'border border-gray-100 text-gray-400 hover:bg-white hover:text-[#004A9C]'
                   }`}
                 >
                   {page}
                 </button>
               );
             })}
           </div>
           <button 
             onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
             disabled={currentPage === totalPages}
             className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#004A9C] hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
           >
             <span>Selanjutnya</span>
             <BiChevronRight size={18} />
           </button>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants} 
      className="space-y-6 pb-10"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-900/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#DFEAF4] rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#004A9C]/5 rounded-full -ml-24 -mb-24 opacity-40 blur-3xl"></div>
        
        <div className="space-y-3 relative z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#DFEAF4] text-[#004A9C] rounded-full text-xs font-bold uppercase tracking-widest"
          >
            <PiggyBank size={14} />
            <span>Financial Services</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Simpan <span className="text-[#004A9C]">Pinjam</span></h2>
          <p className="text-gray-500 text-lg font-medium">Kelola simpanan dan ajukan pinjaman Anda dengan mudah.</p>
        </div>

        {!isFormOpen && activeTab === 'pinjaman' && (
          <Button 
            className="relative z-10 flex items-center gap-2 !px-8 !py-4 shadow-xl shadow-[#004A9C]/20"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus size={20} />
            Ajukan Pinjaman
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isFormOpen ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 p-10 border border-gray-100"
          >
            <div className="flex items-center gap-4 mb-10">
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-3 bg-gray-50 text-gray-400 hover:text-[#004A9C] hover:bg-[#DFEAF4] rounded-2xl transition-all"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Formulir Pengajuan Pinjaman</h3>
                <p className="text-gray-400 font-medium">Lengkapi data di bawah ini untuk mengajukan pinjaman.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitLoan} className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Jenis Pinjaman</label>
                  <Select 
                    name="jenis_pinjaman"
                    value={formData.jenis_pinjaman}
                    onChange={handleInputChange}
                    options={[
                      { value: 'Uang', label: 'Pinjaman Uang' },
                      { value: 'Barang', label: 'Kredit Barang' }
                    ]}
                  />
                </div>

                {formData.jenis_pinjaman === 'Barang' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Nama Barang</label>
                    <Input 
                      name="nama_barang"
                      value={formData.nama_barang}
                      onChange={handleInputChange}
                      placeholder="Contoh: Honda Vario 160"
                      required
                    />
                  </motion.div>
                )}

                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Jumlah {formData.jenis_pinjaman === 'Barang' ? 'Harga' : 'Pinjaman'}</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black group-focus-within:text-[#004A9C] transition-colors">Rp</div>
                    <Input 
                      name="jumlah_pinjaman"
                      value={formData.jumlah_pinjaman}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="!pl-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Terbilang</label>
                  <Input 
                    name="terbilang"
                    value={formData.terbilang}
                    onChange={handleInputChange}
                    placeholder="Contoh: Lima Juta Rupiah"
                    required
                  />
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Lama Angsuran (Tenor)</label>
                  <Select 
                    name="tenor"
                    value={formData.tenor}
                    onChange={handleInputChange}
                    options={[
                      { value: '10', label: '10 Bulan' },
                      { value: '15', label: '15 Bulan' },
                      { value: '20', label: '20 Bulan' }
                    ]}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Keperluan</label>
                  <Textarea 
                    name="keperluan"
                    value={formData.keperluan}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="Jelaskan tujuan pengajuan pinjaman Anda..."
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" onClick={() => setIsFormOpen(false)} variant="secondary" className="flex-1 !bg-gray-50 !text-gray-400 hover:!bg-gray-100">
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1 shadow-lg shadow-[#004A9C]/20">
                    Kirim Pengajuan
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        ) : (
          <>
            {/* Tabs & Search */}
            <motion.div variants={itemVariants} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="flex p-1.5 bg-gray-50 rounded-2xl w-full lg:w-auto">
                <button
                  onClick={() => setActiveTab('simpanan')}
                  className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'simpanan' ? 'bg-[#004A9C] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
                  }`}
                >
                  <Wallet size={16} />
                  <span>Simpanan</span>
                </button>
                <button
                  onClick={() => setActiveTab('pinjaman')}
                  className={`flex-1 lg:flex-none px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'pinjaman' ? 'bg-[#004A9C] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
                  }`}
                >
                  <CreditCard size={16} />
                  <span>Pinjaman</span>
                </button>
              </div>

              <div className="relative w-full lg:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004A9C] transition-colors" size={20} />
                <input
                  type="text"
                  placeholder={activeTab === 'simpanan' ? "Cari transaksi..." : "Cari pengajuan..."}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#004A9C]/20 transition-all font-medium text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(activeTab === 'simpanan' 
                ? [
                    { id: 'sp', label: 'Simpanan Pokok', value: profileData?.simpanan?.saldo_pokok, icon: Wallet, color: '#004A9C' },
                    { id: 'sw', label: 'Simpanan Wajib', value: profileData?.simpanan?.saldo_wajib, icon: TrendingUp, color: '#27AE60' },
                    { id: 'ss', label: 'Simpanan Sukarela', value: profileData?.simpanan?.saldo_sukarela, icon: PiggyBank, color: '#F2994A' },
                    { id: 'ts', label: 'Total Saldo', value: (parseFloat(profileData?.simpanan?.saldo_pokok || 0) + parseFloat(profileData?.simpanan?.saldo_wajib || 0) + parseFloat(profileData?.simpanan?.saldo_sukarela || 0)), icon: Wallet, color: '#EB5757', highlighted: true },
                  ]
                : [
                    { id: 'lk', label: 'Limit Kredit', value: user?.jabatan === 'Manager' ? 50000000 : 20000000, icon: TrendingUp, color: '#27AE60', detail: 'Plafon maksimal' },
                    { id: 'pa', label: 'Pinjaman Aktif', value: profileData?.pinjaman?.reduce((acc, curr) => acc + (curr.status === 'Approved' ? parseFloat(curr.sisa_tagihan || 0) : 0), 0), icon: CreditCard, color: '#004A9C' },
                    { id: 'mr', label: 'Menunggu Review', value: profileData?.pinjaman?.filter(p => p.status === 'Pending').length, icon: Clock, color: '#F2994A', isCount: true },
                    { id: 'tp', label: 'Total Pinjaman', value: profileData?.pinjaman?.length, icon: FileText, color: '#EB5757', isCount: true },
                  ]
              ).map((stat) => (
                <motion.div 
                  key={stat.id} 
                  variants={itemVariants} 
                  onMouseEnter={() => setHoveredCard(stat.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-gray-100 hover:shadow-2xl hover:shadow-blue-900/10 transition-all group relative overflow-hidden aspect-square flex flex-col items-center justify-center text-center cursor-help"
                >
                  {/* Clipping container for decorative background effects */}
                  <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
                    <div 
                      className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 transition-transform duration-700 group-hover:scale-150"
                      style={{ backgroundColor: stat.color }}
                    />
                  </div>
                  
                  <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 transition-all group-hover:scale-110 group-hover:rotate-6 duration-500 relative z-10" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                    <stat.icon size={28} />
                  </div>
                  <div className="space-y-2 relative z-10 w-full">
                    <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">{stat.label}</h3>
                    
                    <div className="relative inline-block w-full">
                      <p className={`text-2xl font-black transition-all duration-300 ${stat.highlighted ? 'text-[#004A9C]' : 'text-gray-900'} ${hoveredCard === stat.id && !stat.isCount ? 'blur-sm opacity-20' : ''}`}>
                        {stat.isCount ? stat.value : formatCompactCurrency(stat.value)}
                        {stat.isCount && <span className="text-[10px] ml-1 opacity-50 font-bold uppercase tracking-widest">Data</span>}
                      </p>

                      <AnimatePresence>
                        {hoveredCard === stat.id && !stat.isCount && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className="absolute inset-0 flex items-center justify-center z-50"
                          >
                            <span className="text-sm font-black text-gray-900 whitespace-nowrap bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
                              {formatCurrency(stat.value)}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {stat.detail && <p className="text-[10px] text-gray-400 font-medium italic">{stat.detail}</p>}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Table Section */}
            <motion.div variants={itemVariants} className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#004A9C] text-white rounded-2xl shadow-lg shadow-[#004A9C]/20">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-800 tracking-tight">
                      {activeTab === 'simpanan' ? 'Riwayat Transaksi' : 'Daftar Pengajuan Pinjaman'}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium">
                      {activeTab === 'simpanan' ? 'Data simpanan dan penarikan saldo' : 'Status dan riwayat pinjaman Anda'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-100">
                      {activeTab === 'simpanan' ? (
                        <>
                          <th className="py-5 px-8">Tanggal</th>
                          <th className="py-5 px-8">Keterangan</th>
                          <th className="py-5 px-8 text-right">Nominal</th>
                          <th className="py-5 px-8 text-center">Status</th>
                        </>
                      ) : (
                        <>
                          <th className="py-5 px-8">Tanggal</th>
                          <th className="py-5 px-8">Tipe & Keperluan</th>
                          <th className="py-5 px-8 text-right">Diajukan</th>
                          <th className="py-5 px-8 text-center">Tenor</th>
                          <th className="py-5 px-8 text-right">Sisa Tagihan</th>
                          <th className="py-5 px-8 text-center">Status</th>
                          <th className="py-5 px-8 text-center">Aksi</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      <tr><td colSpan={7} className="py-20 text-center text-gray-400 italic uppercase tracking-widest text-xs font-bold">Memuat data...</td></tr>
                    ) : paginatedData.length > 0 ? (
                      paginatedData.map((item, idx) => (
                        <motion.tr 
                          key={idx} 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-[#DFEAF4]/20 transition-all duration-300 group"
                        >
                          {activeTab === 'simpanan' ? (
                            <>
                              <td className="py-5 px-8">
                                <span className="text-xs font-bold text-gray-600">{formatDate(item.tanggal)}</span>
                              </td>
                              <td className="py-5 px-8">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-800 tracking-tight">{item.jenis_transaksi?.replace(/Setoran/g, 'Simpanan')}</span>
                                  {item.keterangan && <span className="text-[10px] text-gray-400 font-medium">{item.keterangan.replace(/Setoran/g, 'Simpanan')}</span>}
                                </div>
                              </td>
                              <td className="py-5 px-8 text-right">
                                <span className={`text-sm font-black ${item.jenis_transaksi?.toLowerCase().includes('tarik') ? 'text-red-500' : 'text-[#27AE60]'}`}>
                                  {item.jenis_transaksi?.toLowerCase().includes('tarik') ? '-' : '+'}{formatCurrency(item.nominal)}
                                </span>
                              </td>
                              <td className="py-5 px-8 text-center">
                                <StatusBadge status="Success" />
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-5 px-8">
                                <span className="text-xs font-bold text-gray-600">{formatDate(item.tanggal_pengajuan)}</span>
                              </td>
                              <td className="py-5 px-8">
                                <div className="flex flex-col gap-1">
                                  <span className={`text-[9px] w-fit font-bold px-2 py-0.5 rounded uppercase ${item.jenis_pinjaman === 'Barang' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-[#004A9C]'}`}>
                                    {item.jenis_pinjaman} {item.nama_barang && `- ${item.nama_barang}`}
                                  </span>
                                  <span className="text-xs text-gray-500 font-medium truncate max-w-[200px]">{item.keperluan}</span>
                                </div>
                              </td>
                              <td className="py-5 px-8 text-right text-xs font-bold text-gray-600">{formatCurrency(item.jumlah_pinjaman)}</td>
                              <td className="py-5 px-8 text-center text-xs font-bold text-gray-600">{item.tenor} <span className="text-[9px] text-gray-400">Bln</span></td>
                              <td className="py-5 px-8 text-right text-xs font-bold text-[#EB5757]">
                                {item.status === 'Approved' || item.status === 'Lunas' ? formatCurrency(item.sisa_tagihan) : '-'}
                              </td>
                              <td className="py-5 px-8 text-center">
                                <StatusBadge status={item.status} />
                              </td>
                              <td className="py-5 px-8 text-center">
                                {item.status === 'Approved' || item.status === 'Lunas' ? (
                                  <Link to={`/pinjaman/invoice/${item.pinjaman_id}`} className="p-2 text-blue-600 hover:text-[#004A9C] hover:bg-blue-50 rounded-lg transition-all inline-flex items-center gap-1 text-[11px] font-bold">
                                    <FileText size={16} />
                                    <span>Invoice</span>
                                  </Link>
                                ) : (
                                  <span className="text-[9px] text-gray-300 uppercase font-black italic">No Actions</span>
                                )}
                              </td>
                            </>
                          )}
                        </motion.tr>
                      ))
                    ) : (
                      <tr><td colSpan={activeTab === 'simpanan' ? 4 : 7} className="py-24 text-center text-gray-400 italic font-medium uppercase tracking-widest text-[10px]">Data tidak ditemukan.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Info Card */}
      <motion.div variants={itemVariants} className="bg-orange-50 border border-orange-100 rounded-[2.5rem] p-8 flex items-start gap-6">
        <div className="p-4 bg-white rounded-2xl text-orange-500 shadow-sm">
          <AlertCircle size={28} />
        </div>
        <div>
          <h4 className="text-lg font-black text-orange-800 tracking-tight">Catatan Penting</h4>
          <p className="text-sm text-orange-600 font-medium leading-relaxed mt-2">
            Seluruh transaksi simpanan akan divalidasi oleh bendahara secara otomatis setiap bulannya. 
            Untuk pengajuan pinjaman, pastikan sisa plafon Anda masih mencukupi dan lampirkan alasan yang jelas pada kolom keperluan.
          </p>
        </div>
      </motion.div>

      <Modal 
        isOpen={statusModal.isOpen} 
        onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
      />
    </motion.div>
  );
}
