import { useState, useEffect, useCallback } from 'react';
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
  AlertCircle,
  Tags,
  User,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Printer,
  Settings2,
  Edit2,
  Trash2,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/atoms/Button';
import StatusBadge from '../../components/atoms/StatusBadge';
import { io } from 'socket.io-client';

export default function FinanceManagement() {
  const { api, user } = useAuth();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('arus-kas');
  const isBendahara = user?.role === 'Bendahara';

  // Helper for current date
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYear = String(now.getFullYear());

  // --- Arus Kas State ---
  const [arusKasData, setArusKasData] = useState([]);
  const [loadingKas, setLoadingKas] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulan, setBulan] = useState(currentMonth);
  const [tahun, setTahun] = useState(currentYear);
  const [showModalKas, setShowModalKas] = useState(false);
  const [currentKasBalance, setCurrentKasBalance] = useState(0);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // --- Kategori State ---
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [formDataKas, setFormDataKas] = useState({ user_id: '', nama_kategori: '', nominal: '', keterangan: '', jenis: '' });
  
  // --- Category Modal State ---
  const [showModalCat, setShowModalCat] = useState(false);
  const [editCatData, setEditCatData] = useState(null);
  const [formDataCat, setFormDataCat] = useState({ nama_kategori: '', jenis: 'Debit' });
  const [showConfirmDelete, setShowConfirmDelete] = useState({ isOpen: false, id: null, name: '', type: 'category' });
  
  // --- Edit Kas State ---
  const [editKasData, setEditKasData] = useState(null);

  const fetchArusKas = useCallback(async () => {
    setLoadingKas(true);
    try {
      const res = await api.get(`/keuangan/arus-kas?bulan=${bulan}&tahun=${tahun}`);
      if (res.data.success) {
        setArusKasData(res.data.data);
        if (res.data.currentBalance !== undefined) {
          setCurrentKasBalance(res.data.currentBalance);
        }
      }
    } catch (error) {
      console.error('Error fetching arus kas:', error);
    } finally {
      setLoadingKas(false);
    }
  }, [api, bulan, tahun]);

  const fetchSetupData = useCallback(async () => {
    try {
      const [catRes, userRes] = await Promise.all([
        api.get('/keuangan/kategori'),
        api.get('/user/anggota')
      ]);
      setCategories(catRes.data.data);
      setUsers(userRes.data.data || []);
    } catch (error) {
      console.error('Error fetching setup data:', error);
    }
  }, [api]);

  useEffect(() => {
    setCurrentPage(1);
  }, [bulan, tahun, searchTerm]);

  useEffect(() => {
    if (activeTab === 'arus-kas' || activeTab === 'kategori') {
      fetchArusKas();
      fetchSetupData();
    }
    
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    socket.on('arus-kas-updated', () => {
      fetchArusKas();
    });
    return () => socket.disconnect();
  }, [activeTab, fetchArusKas, fetchSetupData]);

  const handleCategoryChange = (catName) => {
    const cat = categories.find(c => c.nama_kategori === catName);
    setFormDataKas({
      ...formDataKas,
      nama_kategori: catName,
      jenis: cat ? cat.jenis : ''
    });
  };

  const handleSubmitKas = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editKasData) {
        res = await api.put(`/keuangan/arus-kas/${editKasData.kas_id}`, formDataKas);
      } else {
        res = await api.post('/keuangan/arus-kas', formDataKas);
      }
      
      if (res.data.success) {
        setShowModalKas(false);
        setEditKasData(null);
        setFormDataKas({ user_id: '', nama_kategori: '', nominal: '', keterangan: '', jenis: '' });
        fetchArusKas();
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal menyimpan transaksi', 'error');
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCatData) {
        await api.put(`/keuangan/kategori/${editCatData.kategori_id}`, formDataCat);
      } else {
        await api.post('/keuangan/kategori', formDataCat);
      }
      setShowModalCat(false);
      setEditCatData(null);
      setFormDataCat({ nama_kategori: '', jenis: 'Debit' });
      fetchSetupData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Terjadi kesalahan', 'error');
    }
  };

  const deleteCategory = async () => {
    try {
      await api.delete(`/keuangan/kategori/${showConfirmDelete.id}`);
      setShowConfirmDelete({ isOpen: false, id: null, name: '', type: 'category' });
      fetchSetupData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal menghapus', 'error');
    }
  };

  const deleteArusKas = async () => {
    try {
      await api.delete(`/keuangan/arus-kas/${showConfirmDelete.id}`);
      setShowConfirmDelete({ isOpen: false, id: null, name: '', type: 'category' });
      fetchArusKas();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal menghapus arus kas', 'error');
    }
  };

  const handleDeleteConfirm = () => {
    if (showConfirmDelete.type === 'kas') {
      deleteArusKas();
    } else {
      deleteCategory();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

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

  const filteredKas = arusKasData.filter(item => 
    item.keterangan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kode_transaksi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user?.anggota?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredKas.length / itemsPerPage);
  const paginatedKas = filteredKas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
              ? 'Kelola arus kas, kategori, dan pantau laporan keuangan real-time.'
              : 'Pantau laporan keuangan dan posisi neraca koperasi.'}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {activeTab === 'arus-kas' && isBendahara && (
            <Button onClick={() => setShowModalKas(true)} className="flex items-center gap-2 !px-6 text-sm">
              <Plus size={18} /> Update Kas
            </Button>
          )}
          <Button className="bg-[#DFEAF4] !text-[#004A9C] border border-[#004A9C]/20 flex items-center gap-2 !px-6 text-sm hover:bg-[#d0e1f0]">
            <Download size={18} /> Export Laporan
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
            <div className="space-y-6">
              {/* Real-time Balance Card */}
              <div className="bg-gradient-to-br from-[#004A9C] to-[#003B7D] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400 opacity-10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <Wallet size={28} className="text-white" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Saldo Kas Saat Ini (Real-time)</p>
                    <h2 className="text-3xl font-black tracking-tight">
                      {formatCurrency(currentKasBalance)}
                    </h2>
                  </div>
                </div>
                
                <div className="relative z-10 hidden md:flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-xs font-bold tracking-widest uppercase text-blue-50">Live Sync</span>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Cari transaksi..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <select 
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none"
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                  >
                    {months.map((m, i) => <option key={i} value={String(i+1).padStart(2, '0')}>{m}</option>)}
                  </select>
                  <select 
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none"
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                  >
                    {Array.from({ length: now.getFullYear() - 2024 + 2 }, (_, i) => 2024 + i).reverse().map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal</th>
                        <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kode & Kategori</th>
                        <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Keterangan</th>
                        <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jenis</th>
                        <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Nominal</th>
                        <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Saldo Akhir</th>
                        <th className="py-5 px-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Manajemen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loadingKas ? (
                        Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan="7" className="py-5 px-8 text-center">Loading...</td></tr>)
                      ) : paginatedKas.length === 0 ? (
                        <tr><td colSpan="7" className="py-5 px-8 text-center text-gray-400">Tidak ada data transaksi.</td></tr>
                      ) : (
                        paginatedKas.map((row) => (
                          <tr key={row.kas_id} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="py-5 px-8 text-xs font-bold text-gray-700">
                              {formatDate(row.tanggal)}
                            </td>
                            <td className="py-5 px-8">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-mono font-bold text-[#004A9C] bg-blue-50 px-1.5 py-0.5 rounded w-fit">{row.kode_transaksi}</span>
                                <span className="text-xs font-bold text-gray-600 mt-0.5">{row.kategoriKas?.nama_kategori}</span>
                              </div>
                            </td>
                            <td className="py-5 px-8">
                              <div className="flex flex-col">
                                {row.user?.anggota && <span className="text-xs font-bold text-gray-700 flex items-center gap-1"><User size={12}/> {row.user.anggota.nama_lengkap}</span>}
                                <span className="text-xs text-gray-400 line-clamp-1">{row.keterangan}</span>
                              </div>
                            </td>
                            <td className="py-5 px-8">
                              <StatusBadge status={row.jenis}>{row.jenis === 'Kredit' ? 'Masuk' : 'Keluar'}</StatusBadge>
                            </td>
                            <td className="py-5 px-8 text-right">
                              <span className={`text-xs font-black ${row.jenis === 'Kredit' ? 'text-green-600' : 'text-red-500'}`}>
                                {row.jenis === 'Kredit' ? '+' : '-'} {formatCurrency(row.nominal)}
                              </span>
                            </td>
                            <td className="py-5 px-8 text-right">
                              <span className="text-xs font-extrabold text-gray-800">{formatCurrency(row.saldo_akhir)}</span>
                            </td>
                            <td className="py-5 px-8 text-right">
                              {isBendahara ? (
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => {
                                      setEditKasData(row);
                                      setFormDataKas({
                                        user_id: row.user_id || '',
                                        nama_kategori: row.kategoriKas?.nama_kategori || '',
                                        nominal: row.nominal,
                                        keterangan: row.keterangan || '',
                                        jenis: row.jenis
                                      });
                                      setShowModalKas(true);
                                    }}
                                    className="p-2 text-gray-400 hover:text-[#004A9C] hover:bg-blue-50 rounded-lg transition-all"
                                    title="Edit Transaksi"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => setShowConfirmDelete({ isOpen: true, id: row.kas_id, name: row.keterangan || row.kode_transaksi, type: 'kas' })}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    title="Hapus Transaksi"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[9px] font-bold text-gray-300 uppercase italic">View Only</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer - Simplified & More Visible */}
                {filteredKas.length > 0 && (
                  <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between bg-[#F8FAFC]">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 sm:mb-0">
                      Menampilkan <span className="text-[#004A9C]">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-[#004A9C]">{Math.min(filteredKas.length, currentPage * itemsPerPage)}</span> dari <span className="text-gray-600">{filteredKas.length}</span> Data
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#004A9C] hover:bg-white hover:border-[#004A9C]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} />
                        Sebelumnya
                      </button>
                      
                      <div className="flex gap-1.5 mx-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                            if (Math.abs(page - currentPage) === 2) return <span key={page} className="px-1 text-gray-300">...</span>;
                            return null;
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                                currentPage === page 
                                  ? 'bg-[#004A9C] text-white shadow-lg shadow-blue-900/20' 
                                  : 'border border-gray-200 text-gray-400 hover:bg-white hover:text-[#004A9C] hover:border-[#004A9C]/20'
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
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#004A9C] hover:bg-white hover:border-[#004A9C]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Selanjutnya
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Kelola Kategori Button - Only for Bendahara */}
              {isBendahara && (
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setActiveTab('kategori')}
                    className="flex items-center gap-2 px-6 py-3 bg-[#004A9C] hover:bg-[#003d82] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 active:scale-95"
                  >
                    <Tags size={16} />
                    Kelola Kategori Kas
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'kategori' && (
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
               <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3">
                   <button onClick={() => setActiveTab('arus-kas')} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronLeft size={20}/></button>
                   <h2 className="text-xl font-bold">Daftar Kategori Kas</h2>
                 </div>
                 <Button className="!px-4 !py-2 text-xs" onClick={() => { setEditCatData(null); setFormDataCat({nama_kategori: '', jenis: 'Debit'}); setShowModalCat(true); }}>
                   <Plus size={14}/> Kategori Baru
                 </Button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {categories.map(c => (
                   <div key={c.kategori_id} className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center hover:shadow-md transition-all">
                     <div>
                       <p className="font-bold text-gray-700">{c.nama_kategori}</p>
                       <p className={`text-[10px] font-bold uppercase tracking-wider ${c.jenis === 'Kredit' ? 'text-green-500' : 'text-red-500'}`}>{c.jenis === 'Kredit' ? 'Pemasukan' : 'Pengeluaran'}</p>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => { setEditCatData(c); setFormDataCat({nama_kategori: c.nama_kategori, jenis: c.jenis}); setShowModalCat(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={14}/></button>
                        <button onClick={() => setShowConfirmDelete({ isOpen: true, id: c.kategori_id, name: c.nama_kategori })} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {activeTab === 'lphu' && (
             <div className="p-20 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
               <BarChart3 size={48} className="mx-auto mb-4 opacity-20"/>
               <p className="font-bold">Laporan Perhitungan Hasil Usaha</p>
               <p className="text-sm mt-1">Data sedang disinkronisasi dari jurnal umum.</p>
             </div>
          )}
          {activeTab === 'shu' && (
             <div className="p-20 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
               <PieChart size={48} className="mx-auto mb-4 opacity-20"/>
               <p className="font-bold">Sisa Hasil Usaha</p>
               <p className="text-sm mt-1">Pembagian SHU akan tersedia di akhir periode akuntansi.</p>
             </div>
          )}
          {activeTab === 'neraca' && (
             <div className="p-20 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
               <FileText size={48} className="mx-auto mb-4 opacity-20"/>
               <p className="font-bold">Neraca Koperasi</p>
               <p className="text-sm mt-1">Laporan posisi keuangan aset, kewajiban, dan ekuitas.</p>
             </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modal Arus Kas */}
      <AnimatePresence>
        {showModalKas && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModalKas(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl p-8">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-2xl font-bold text-gray-800">{editKasData ? 'Edit Transaksi' : 'Catat Transaksi'}</h2>
                 <button onClick={() => setShowModalKas(false)} className="text-gray-400 hover:text-gray-600"><Plus size={24} className="rotate-45" /></button>
               </div>
               <form onSubmit={handleSubmitKas} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Kategori</label>
                      <select 
                        required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#004A9C]/20"
                        value={formDataKas.nama_kategori}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map(c => <option key={c.kategori_id} value={c.nama_kategori}>{c.nama_kategori}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nominal (Rp)</label>
                      <input 
                        type="number" required placeholder="0" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#004A9C]/20"
                        value={formDataKas.nominal}
                        onChange={(e) => setFormDataKas({...formDataKas, nominal: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Jenis Transaksi</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setFormDataKas({...formDataKas, jenis: 'Kredit'})}
                        className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${formDataKas.jenis === 'Kredit' ? 'border-[#27AE60] bg-[#27AE60]/5 text-[#27AE60]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                      >
                        Kredit (Masuk)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormDataKas({...formDataKas, jenis: 'Debit'})}
                        className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${formDataKas.jenis === 'Debit' ? 'border-[#EB5757] bg-[#EB5757]/5 text-[#EB5757]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                      >
                        Debit (Keluar)
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Keterangan</label>
                    <textarea 
                      required rows="3" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#004A9C]/20"
                      placeholder="Detail transaksi..."
                      value={formDataKas.keterangan}
                      onChange={(e) => setFormDataKas({...formDataKas, keterangan: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" onClick={() => setShowModalKas(false)} className="flex-1 !bg-gray-100 !text-gray-500">Batal</Button>
                    <Button type="submit" className="flex-1">Simpan</Button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Kategori */}
      <AnimatePresence>
        {showModalCat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModalCat(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{editCatData ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
                  <button onClick={() => setShowModalCat(false)} className="text-gray-400 hover:text-gray-600"><Plus size={24} className="rotate-45" /></button>
                </div>
                <form onSubmit={handleCategorySubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nama Kategori</label>
                    <input 
                      type="text" required placeholder="Contoh: Biaya Operasional"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none"
                      value={formDataCat.nama_kategori}
                      onChange={(e) => setFormDataCat({...formDataCat, nama_kategori: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Jenis Default</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setFormDataCat({...formDataCat, jenis: 'Kredit'})}
                        className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${formDataCat.jenis === 'Kredit' ? 'border-[#27AE60] bg-[#27AE60]/5 text-[#27AE60]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                      >
                        Kredit (In)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormDataCat({...formDataCat, jenis: 'Debit'})}
                        className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${formDataCat.jenis === 'Debit' ? 'border-[#EB5757] bg-[#EB5757]/5 text-[#EB5757]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                      >
                        Debit (Out)
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" onClick={() => setShowModalCat(false)} className="flex-1 !bg-gray-100 !text-gray-500">Batal</Button>
                    <Button type="submit" className="flex-1">Simpan</Button>
                  </div>
                </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal Konfirmasi Hapus */}
      <AnimatePresence>
        {showConfirmDelete.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmDelete({ isOpen: false, id: null, name: '' })} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm bg-white rounded-[32px] shadow-2xl p-8 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{showConfirmDelete.type === 'kas' ? 'Hapus Transaksi?' : 'Hapus Kategori?'}</h3>
                <p className="text-gray-500 text-sm mb-8">
                  {showConfirmDelete.type === 'kas' 
                    ? <>Apakah Anda yakin ingin menghapus transaksi <span className="font-bold text-gray-700">"{showConfirmDelete.name}"</span>? Saldo akhir akan dihitung ulang secara otomatis.</>
                    : <>Apakah Anda yakin ingin menghapus kategori <span className="font-bold text-gray-700">"{showConfirmDelete.name}"</span>? Transaksi yang sudah ada tidak akan hilang, namun kategori ini tidak bisa dipilih lagi.</>
                  }
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowConfirmDelete({ isOpen: false, id: null, name: '' })}
                    className="flex-1 px-6 py-3 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-6 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                  >
                    Ya, Hapus
                  </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
