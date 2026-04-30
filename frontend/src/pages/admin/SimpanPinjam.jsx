import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PiggyBank, 
  Search, 
  Plus, 
  Edit2, 
  Wallet, 
  TrendingUp, 
  Download, 
  Filter,
  User,
  ArrowRight,
  TrendingDown,
  Info,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  FileText,
  PlusCircle,
  Settings,
  ChevronRight,
  Eye
} from 'lucide-react';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import StatusBadge from '../../components/atoms/StatusBadge';
import Modal from '../../components/molecules/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { isKoordinatorSP } from '../../utils/roles';

export default function SimpanPinjam() {
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const socket = useSocket();
  const canEdit = isKoordinatorSP(user?.role);
  const highlightRef = useRef(null);

  const [activeTab, setActiveTab] = useState('simpanan'); // 'simpanan' or 'pinjaman'
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLoanFilter, setActiveLoanFilter] = useState('Semua');

  const [isLoading, setIsLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isLoanActionModalOpen, setIsLoanActionModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanActionType, setLoanActionType] = useState('review');
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [hoveredStat, setHoveredStat] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'success' });



  const [updateLoan, setUpdateLoan] = useState({
    jumlah_disetujui: 0,
    tenor: 0,
    status: 'Pending'
  });

  // Data states
  const [savingsData, setSavingsData] = useState([]);
  const [loansData, setLoansData] = useState([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoints = ['/simpan-pinjam/simpanan', '/simpan-pinjam/pinjaman'];
      const [resSimpanan, resPinjaman] = await Promise.all(endpoints.map(e => api.get(e)));
      
      if (resSimpanan.data.success) setSavingsData(resSimpanan.data.data);
      if (resPinjaman.data.success) setLoansData(resPinjaman.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleSimpananUpdated = (data) => {
      console.log('📥 WebSocket Received simpanan:updated:', data);
      setSavingsData(prev => prev.map(s => s.simpanan_id === data.simpanan_id ? data : s));
      
      // Highlight updated row
      if (activeTab === 'simpanan') {
        setHighlightedId(data.simpanan_id);
        setTimeout(() => setHighlightedId(null), 3000);
      }
    };

    const handlePinjamanUpdated = (data) => {
      console.log('📥 WebSocket Received pinjaman:updated:', data);
      setLoansData(prev => prev.map(l => l.pinjaman_id === data.pinjaman_id ? data : l));
      
      // Highlight updated row
      if (activeTab === 'pinjaman') {
        setHighlightedId(data.pinjaman_id);
        setTimeout(() => setHighlightedId(null), 3000);
      }
    };

    const handleSimpananCreated = (data) => {
      console.log('📥 WebSocket Received simpanan:created:', data);
      setSavingsData(prev => [data, ...prev]);
    };

    const handleSimpananBulkUpdated = () => {
      console.log('📥 WebSocket Received simpanan:bulkUpdated');
      fetchData();
    };

    socket.on('simpanan:updated', handleSimpananUpdated);
    socket.on('simpanan:created', handleSimpananCreated);
    socket.on('simpanan:bulkUpdated', handleSimpananBulkUpdated);
    socket.on('pinjaman:updated', handlePinjamanUpdated);

    return () => {
      socket.off('simpanan:updated', handleSimpananUpdated);
      socket.off('simpanan:created', handleSimpananCreated);
      socket.off('simpanan:bulkUpdated', handleSimpananBulkUpdated);
      socket.off('pinjaman:updated', handlePinjamanUpdated);
    };
  }, [socket, activeTab]);

  // --- LOGIC ---
  const savingsStats = useMemo(() => {
    return savingsData.reduce((acc, curr) => ({
      pokok: acc.pokok + parseFloat(curr.saldo_pokok || 0),
      wajib: acc.wajib + parseFloat(curr.saldo_wajib || 0),
      sukarela: acc.sukarela + parseFloat(curr.saldo_sukarela || 0),
      total: acc.total + (parseFloat(curr.saldo_pokok || 0) + parseFloat(curr.saldo_wajib || 0) + parseFloat(curr.saldo_sukarela || 0))
    }), { pokok: 0, wajib: 0, sukarela: 0, total: 0 });
  }, [savingsData]);

  const filteredSavings = useMemo(() => {
    return savingsData
      .filter(item => 
        (item.anggota?.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.anggota?.no_anggota || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => (a.anggota?.no_anggota || '').localeCompare(b.anggota?.no_anggota || '', undefined, { numeric: true, sensitivity: 'base' }));
  }, [savingsData, searchQuery]);

  const loanStats = useMemo(() => {
    return {
      outstanding: loansData.reduce((acc, curr) => acc + parseFloat(curr.sisa_tagihan || 0), 0),
      pending: loansData.filter(l => l.status === 'Pending').length,
      active: loansData.filter(l => l.status === 'Approved').length,
      total_disbursed: loansData.reduce((acc, curr) => acc + parseFloat(curr.pinjaman_disetujui || 0), 0)
    };
  }, [loansData]);

  const filteredLoans = useMemo(() => {
    return loansData.filter(item => {
      const matchesSearch = (item.anggota?.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.anggota?.no_anggota || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeLoanFilter === 'Semua' || item.status === activeLoanFilter;
      return matchesSearch && matchesFilter;
    });
  }, [loansData, searchQuery, activeLoanFilter]);

  // Pagination logic
  const activeData = activeTab === 'simpanan' ? filteredSavings : filteredLoans;
  const totalPages = Math.ceil(activeData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return activeData.slice(start, start + itemsPerPage);
  }, [activeData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedItems([]);
  }, [activeTab, searchQuery, activeLoanFilter]);

  const formatCurrency = (val, compact = false) => {
    if (compact) {
      if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1).replace('.0', '')} M`;
      if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1).replace('.0', '')} Jt`;
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleUpdateSavingsClick = (item) => {
    navigate(`/admin/simpan-pinjam/manajemen-saldo/${item.simpanan_id}`, { 
      state: { 
        member: item,
        saldo: {
          pokok: item.saldo_pokok,
          wajib: item.saldo_wajib,
          sukarela: item.saldo_sukarela
        }
      } 
    });
  };



  const handleLoanActionClick = (loan, type) => {
    setSelectedLoan(loan);
    setLoanActionType(type);
    setUpdateLoan({
      jumlah_disetujui: loan.pinjaman_disetujui || loan.jumlah_pinjaman,
      tenor: loan.tenor,
      status: loan.status
    });
    setIsLoanActionModalOpen(true);
  };

  const handleBulkWajib = async (scope = 'all') => {
    try {
      // If scope is 'selected' and nothing is selected, return
      if (scope === 'selected' && selectedItems.length === 0) {
        setStatusModal({
          isOpen: true,
          type: 'error',
          title: 'Peringatan',
          message: 'Pilih anggota terlebih dahulu menggunakan checkbox.'
        });
        return;
      }

      setIsLoading(true);
      const payload = {
        selected_anggota_ids: scope === 'selected' ? selectedItems : []
      };
      
      const response = await api.post('/simpan-pinjam/simpanan/transaksi/bulk-wajib', payload);
      
      if (response.data.success) {
        setStatusModal({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: response.data.message
        });
        setSelectedItems([]);
        fetchData();
      }
    } catch (error) {
      console.error(error);
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan sistem saat memproses simpanan wajib.'
      });
      setIsLoading(false);
    }
  };

  const submitUpdateLoan = async (forcedStatus = null) => {
    try {
      const targetStatus = forcedStatus || updateLoan.status;
      await api.put(`/simpan-pinjam/pinjaman/${selectedLoan.pinjaman_id}`, {
        pinjaman_disetujui: updateLoan.jumlah_disetujui,
        tenor: updateLoan.tenor,
        status: targetStatus
      });
      setIsLoanActionModalOpen(false);
      setStatusModal({ isOpen: true, type: 'success', title: 'Berhasil', message: 'Status pinjaman berhasil diperbarui.' });
    } catch (error) {
      console.error(error);
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: 'Terjadi kesalahan sistem saat memperbarui data.' });
    }
  };

  const handleInputBaruClick = (member) => {
    navigate(`/admin/simpan-pinjam/input-baru/${member.anggota_id}`, { state: { member: member.anggota } });
  };

  const handleSelectAll = () => {
    const idField = activeTab === 'simpanan' ? 'anggota_id' : 'pinjaman_id';
    const currentDataIds = paginatedData.map(item => activeTab === 'simpanan' ? item.anggota_id : item[idField]);
    const allSelected = currentDataIds.every(id => selectedItems.includes(id));

    if (allSelected) {
      setSelectedItems(prev => prev.filter(id => !currentDataIds.includes(id)));
    } else {
      setSelectedItems(prev => [...new Set([...prev, ...currentDataIds])]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

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

  const tabContentVariants = {
    hidden: { opacity: 0, x: 10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -10, transition: { duration: 0.2 } }
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
               if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                  if (Math.abs(page - currentPage) === 2) return <span key={page} className="px-1 text-gray-300 font-bold">...</span>;
                  return null;
               }
               return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                      currentPage === page 
                      ? 'bg-[#004A9C] text-white shadow-lg shadow-[#004A9C]/20' 
                      : 'border border-gray-100 text-gray-400 hover:bg-white hover:text-[#004A9C]'
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
      className="space-y-6 pb-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Premium Header Section */}
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
            <span>Manajemen</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Manajemen <span className="text-[#004A9C]">Simpan Pinjam</span></h2>
          <p className="text-gray-500 text-lg">Kelola riwayat simpanan dan pengajuan pinjaman anggota.</p>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="flex p-1.5 bg-gray-50 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveTab('simpanan'); setSearchQuery(''); }}
            className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'simpanan' 
              ? 'bg-[#004A9C] text-white shadow-lg shadow-blue-900/20' 
              : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            <Wallet size={16} />
            <span>Data Simpanan</span>
          </button>
          <button
            onClick={() => { setActiveTab('pinjaman'); setSearchQuery(''); }}
            className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pinjaman' 
              ? 'bg-[#004A9C] text-white shadow-lg shadow-blue-900/20' 
              : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            <CreditCard size={16} />
            <span>Data Pinjaman</span>
          </button>
        </div>

        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004A9C] transition-colors" size={20} />
          <input
            type="text"
            placeholder="Cari anggota atau ID..."
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#004A9C]/20 transition-all font-medium text-sm placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'simpanan' ? (
          <motion.div key="simpanan-tab" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
            {/* Savings Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total S. Pokok', value: savingsStats.pokok, icon: Wallet, color: '#004A9C', bg: '#DFEAF4' },
                { label: 'Total S. Wajib', value: savingsStats.wajib, icon: TrendingUp, color: '#27AE60', bg: '#e8f5e9' },
                { label: 'Total S. Sukarela', value: savingsStats.sukarela, icon: PiggyBank, color: '#F2994A', bg: '#fff3e0' },
                { label: 'Akumulasi Dana', value: savingsStats.total, icon: Wallet, color: '#EB5757', bg: '#ffebee', highlighted: true },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  onMouseEnter={() => setHoveredStat(`savings-${idx}`)}
                  onMouseLeave={() => setHoveredStat(null)}
                  className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-gray-100 hover:shadow-2xl hover:shadow-blue-900/10 transition-all group relative aspect-square flex flex-col items-center justify-center text-center"
                >
                  {/* Clipping container for decorative background effects */}
                  <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
                    <div 
                      className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 transition-transform duration-700 group-hover:scale-150"
                      style={{ backgroundColor: stat.color }}
                    />
                  </div>

                  <div
                    className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-sm transition-all group-hover:scale-110 group-hover:rotate-6 duration-500 mb-6 relative z-10"
                    style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                  >
                    <stat.icon size={28} />
                  </div>

                  <div className="space-y-2 relative z-10">
                    <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] leading-tight px-2">{stat.label}</h3>
                    <div className="relative">
                      <p className={`text-2xl font-black tracking-tighter ${stat.highlighted ? 'text-[#004A9C]' : 'text-gray-900'}`}>
                        {formatCurrency(stat.value, true)}
                      </p>
                      
                      {/* Hover Tooltip for Full Amount */}
                      <AnimatePresence>
                        {hoveredStat === `savings-${idx}` && (
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
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden min-h-[500px] flex flex-col">
               <div className="flex-1 overflow-x-auto">
                 <AnimatePresence mode="wait">
                   <motion.table 
                     key="simpanan-table"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="w-full text-left border-collapse"
                   >
                     <thead>
                       <tr className="bg-gray-50/80 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-100">
                         <th className="py-5 px-8 w-10">
                           <div className="flex items-center justify-center">
                             <input 
                               type="checkbox" 
                               className="w-4 h-4 rounded border-gray-300 text-[#004A9C] focus:ring-[#004A9C]/20 transition-all cursor-pointer"
                               checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.includes(activeTab === 'simpanan' ? item.anggota_id : item.pinjaman_id))}
                               onChange={handleSelectAll}
                             />
                           </div>
                         </th>
                         <th className="py-5 px-8">Identitas Anggota</th>
                         <th className="py-5 px-8 text-right">Simpanan Pokok</th>
                         <th className="py-5 px-8 text-right">Simpanan Wajib</th>
                         <th className="py-5 px-8 text-right">Simpanan Sukarela</th>
                         <th className="py-5 px-8 text-right">Total Saldo</th>
                         <th className="py-5 px-8 text-right">Manajemen</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {isLoading ? (
                         <tr><td colSpan={7} className="py-20 text-center text-gray-400 italic uppercase tracking-widest text-xs font-bold">Loading data...</td></tr>
                       ) : paginatedData.length > 0 ? (
                         paginatedData.map((item) => {
                           const rowId = activeTab === 'simpanan' ? item.anggota_id : item.pinjaman_id;
                           const isHighlighted = item.simpanan_id === highlightedId;
                           const totalSaldo = parseFloat(item.saldo_pokok) + parseFloat(item.saldo_wajib) + parseFloat(item.saldo_sukarela);
                           return (
                             <motion.tr 
                               key={item.simpanan_id} 
                               ref={isHighlighted ? highlightRef : null}
                               layout
                               initial={{ opacity: 0 }}
                               animate={{ 
                                 opacity: 1,
                                 backgroundColor: isHighlighted ? ['rgba(0,74,156,0.15)', 'rgba(0,74,156,0.05)', 'rgba(0,74,156,0.15)'] : 'rgba(0,0,0,0)',
                               }}
                               transition={isHighlighted ? { backgroundColor: { repeat: Infinity, duration: 1.5 } } : {}}
                               className={`hover:bg-[#DFEAF4]/20 transition-all duration-300 group ${isHighlighted ? 'ring-2 ring-[#004A9C]/30 ring-inset rounded-lg' : ''} ${selectedItems.includes(rowId) ? 'bg-[#004A9C]/5' : ''}`}
                             >
                               <td className="py-5 px-8">
                                 <div className="flex items-center justify-center">
                                   <input 
                                     type="checkbox" 
                                     className="w-4 h-4 rounded border-gray-300 text-[#004A9C] focus:ring-[#004A9C]/20 transition-all cursor-pointer"
                                     checked={selectedItems.includes(rowId)}
                                     onChange={() => handleSelectItem(rowId)}
                                   />
                                 </div>
                               </td>
                               <td className="py-5 px-8">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DFEAF4] to-white flex items-center justify-center text-[#004A9C] font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                                     {item.anggota?.nama_lengkap?.charAt(0)}
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-sm font-bold text-gray-800 tracking-tight">{item.anggota?.nama_lengkap}</span>
                                      <span className="text-[11px] text-gray-400 font-mono tracking-wider">ID: {item.anggota?.no_anggota}</span>
                                   </div>
                                 </div>
                               </td>
                               <td className="py-5 px-8 text-right text-xs font-bold text-gray-600">{formatCurrency(item.saldo_pokok)}</td>
                               <td className="py-5 px-8 text-right text-xs font-bold text-gray-600">{formatCurrency(item.saldo_wajib)}</td>
                               <td className="py-5 px-8 text-right text-xs font-bold text-[#F2994A]">{formatCurrency(item.saldo_sukarela)}</td>
                               <td className="py-5 px-8 text-right text-sm font-black text-[#004A9C]">{formatCurrency(totalSaldo)}</td>
                               <td className="py-5 px-8 text-right">
                                 {canEdit ? (
                                   <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button 
                                       onClick={() => handleInputBaruClick(item)} 
                                       className="p-2.5 text-gray-400 hover:text-[#27AE60] hover:bg-[#27AE60]/10 rounded-xl transition-all" 
                                       title="Input Transaksi Baru"
                                     >
                                       <PlusCircle size={22} />
                                     </button>
                                     <button 
                                       onClick={() => handleUpdateSavingsClick(item)} 
                                       className="p-2.5 text-gray-400 hover:text-[#004A9C] hover:bg-[#DFEAF4] rounded-xl transition-all" 
                                       title="Edit Total Saldo"
                                     >
                                       <Edit2 size={22} />
                                     </button>
                                   </div>
                                 ) : (
                                   <span className="text-[9px] font-bold text-gray-300 uppercase italic">View Only</span>
                                 )}
                               </td>
                             </motion.tr>
                           );
                         })
                       ) : (
                         <tr><td colSpan={7} className="py-24 text-center text-gray-400 italic">Data simpanan tidak ditemukan.</td></tr>
                       )}
                     </tbody>
                   </motion.table>
                 </AnimatePresence>
               </div>
               {!isLoading && paginatedData.length > 0 && <Pagination />}
            </div>

            {activeTab === 'simpanan' && canEdit && (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#DFEAF4] text-[#004A9C] rounded-2xl flex items-center justify-center">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Proses Setoran Kolektif</h4>
                    <p className="text-xs text-gray-400">Input simpanan wajib sekaligus untuk efisiensi administrasi.</p>
                  </div>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                  <Button 
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Konfirmasi Kolektif',
                        message: 'Proses simpanan wajib untuk SELURUH anggota aktif?',
                        type: 'success',
                        onConfirm: () => {
                          setConfirmModal(prev => ({ ...prev, isOpen: false }));
                          handleBulkWajib('all');
                        }
                      });
                    }}
                    className="flex-1 md:flex-none !bg-white !text-[#004A9C] border border-[#DFEAF4] hover:!bg-[#DFEAF4]"
                  >
                    Semua Anggota
                  </Button>
                  <Button 
                    onClick={() => {
                      if (selectedItems.length === 0) {
                        setStatusModal({ isOpen: true, type: 'error', title: 'Peringatan', message: 'Pilih anggota terlebih dahulu.' });
                        return;
                      }
                      setConfirmModal({
                        isOpen: true,
                        title: 'Konfirmasi Terpilih',
                        message: `Proses simpanan wajib untuk ${selectedItems.length} anggota terpilih?`,
                        type: 'success',
                        onConfirm: () => {
                          setConfirmModal(prev => ({ ...prev, isOpen: false }));
                          handleBulkWajib('selected');
                        }
                      });
                    }}
                    className="flex-1 md:flex-none shadow-lg shadow-blue-900/10"
                  >
                    Terpilih ({selectedItems.length})
                  </Button>
                </div>
              </div>
            )}

            
            <div className="bg-[#DFEAF4]/30 border border-[#004A9C]/10 rounded-3xl p-6 flex items-start gap-4">
              <div className="p-3 bg-white rounded-2xl text-[#004A9C] shadow-sm"><Info size={24} /></div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Kebijakan Simpanan</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Simpanan Pokok & Wajib bersifat wajib bagi seluruh anggota. Simpanan Sukarela bersifat opsional dan dapat ditarik sewaktu-waktu.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="pinjaman-tab" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
            {/* Loan Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Outstanding Pinjaman', value: loanStats.outstanding, icon: Wallet, color: '#004A9C', bg: '#DFEAF4' },
                { label: 'Menunggu Review', value: loanStats.pending, icon: Clock, color: '#F2994A', bg: '#fff3e0', isCount: true },
                { label: 'Pinjaman Aktif', value: loanStats.active, icon: Briefcase, color: '#27AE60', bg: '#e8f5e9', isCount: true },
                { label: 'Total Dana Keluar', value: loanStats.total_disbursed, icon: TrendingDown, color: '#EB5757', bg: '#ffebee' },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  onMouseEnter={() => setHoveredStat(`loans-${idx}`)}
                  onMouseLeave={() => setHoveredStat(null)}
                  className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-gray-100 hover:shadow-2xl hover:shadow-blue-900/10 transition-all group relative aspect-square flex flex-col items-center justify-center text-center"
                >
                  {/* Clipping container for decorative background effects */}
                  <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
                    <div 
                      className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 transition-transform duration-700 group-hover:scale-150"
                      style={{ backgroundColor: stat.color }}
                    />
                  </div>

                  <div
                    className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-sm transition-all group-hover:scale-110 group-hover:rotate-6 duration-500 mb-6 relative z-10"
                    style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                  >
                    <stat.icon size={28} />
                  </div>

                  <div className="space-y-2 relative z-10">
                    <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] leading-tight px-2">{stat.label}</h3>
                    <div className="relative">
                      <p className="text-2xl font-black text-gray-900 tracking-tighter">
                        {stat.isCount ? stat.value : formatCurrency(stat.value, true)}
                        {stat.isCount && <span className="text-[10px] ml-1 opacity-50 font-bold uppercase tracking-widest">Kasus</span>}
                      </p>

                      {/* Hover Tooltip for Full Amount */}
                      {!stat.isCount && (
                        <AnimatePresence>
                          {hoveredStat === `loans-${idx}` && (
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
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden min-h-[500px] flex flex-col">
               <div className="p-6 border-b border-gray-50 flex flex-col lg:flex-row justify-between items-center gap-6">
                  <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100 w-full lg:w-auto overflow-x-auto no-scrollbar">
                    {['Semua', 'Pending', 'Approved', 'Rejected', 'Lunas'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setActiveLoanFilter(f)}
                        className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                          activeLoanFilter === f 
                          ? 'bg-[#004A9C] text-white shadow-lg shadow-blue-900/20' 
                          : 'text-gray-400 hover:text-gray-900'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
               </div>
               
               <div className="flex-1 overflow-x-auto">
                 <AnimatePresence mode="wait">
                   <motion.table 
                     key="pinjaman-table"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="w-full text-left border-collapse"
                   >
                     <thead>
                       <tr className="bg-gray-50/80 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-100">
                         <th className="py-5 px-8 w-10">
                           <div className="flex items-center justify-center">
                             <input 
                               type="checkbox" 
                               className="w-4 h-4 rounded border-gray-300 text-[#004A9C] focus:ring-[#004A9C]/20 transition-all cursor-pointer"
                               checked={paginatedData.length > 0 && paginatedData.every(item => selectedItems.includes(item.pinjaman_id))}
                               onChange={handleSelectAll}
                             />
                           </div>
                         </th>
                         <th className="py-5 px-8">Identitas Anggota</th>
                         <th className="py-5 px-8">Tipe & Keperluan</th>
                         <th className="py-5 px-8 text-right">Diajukan</th>
                         <th className="py-5 px-8 text-center">Tenor</th>
                         <th className="py-5 px-8 text-right">Angsuran</th>
                         <th className="py-5 px-8">Status</th>
                         <th className="py-5 px-8 text-right">Manajemen</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {isLoading ? (
                         <tr><td colSpan={8} className="py-20 text-center text-gray-400 italic uppercase tracking-widest text-xs font-bold">Loading data...</td></tr>
                       ) : paginatedData.length > 0 ? (
                         paginatedData.map((loan) => {
                           const isHighlighted = loan.pinjaman_id === highlightedId;
                           return (
                             <motion.tr 
                               key={loan.pinjaman_id} 
                               ref={isHighlighted ? highlightRef : null}
                               layout
                               initial={{ opacity: 0 }}
                               animate={{ 
                                 opacity: 1,
                                 backgroundColor: isHighlighted ? ['rgba(0,74,156,0.15)', 'rgba(0,74,156,0.05)', 'rgba(0,74,156,0.15)'] : 'rgba(0,0,0,0)',
                               }}
                               transition={isHighlighted ? { backgroundColor: { repeat: Infinity, duration: 1.5 } } : {}}
                               className={`hover:bg-[#DFEAF4]/20 transition-all duration-300 group ${isHighlighted ? 'ring-2 ring-[#004A9C]/30 ring-inset rounded-lg' : ''} ${selectedItems.includes(loan.pinjaman_id) ? 'bg-[#004A9C]/5' : ''}`}
                             >
                               <td className="py-5 px-8">
                                 <div className="flex items-center justify-center">
                                   <input 
                                     type="checkbox" 
                                     className="w-4 h-4 rounded border-gray-300 text-[#004A9C] focus:ring-[#004A9C]/20 transition-all cursor-pointer"
                                     checked={selectedItems.includes(loan.pinjaman_id)}
                                     onChange={() => handleSelectItem(loan.pinjaman_id)}
                                   />
                                 </div>
                               </td>
                               <td className="py-5 px-8">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#DFEAF4] to-white flex items-center justify-center text-[#004A9C] font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                                     {loan.anggota?.nama_lengkap?.charAt(0)}
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-sm font-bold text-gray-800 tracking-tight">{loan.anggota?.nama_lengkap}</span>
                                      <span className="text-[10px] text-gray-400 font-medium italic">{loan.tanggal_pengajuan}</span>
                                   </div>
                                 </div>
                               </td>
                               <td className="py-5 px-8">
                                  <div className="flex flex-col gap-1">
                                     <span className={`text-[9px] w-fit font-bold px-2 py-0.5 rounded uppercase ${loan.jenis_pinjaman === 'Barang' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-[#004A9C]'}`}>{loan.jenis_pinjaman}</span>
                                     <span className="text-[11px] text-gray-500 font-medium truncate max-w-[150px]">{loan.keperluan}</span>
                                  </div>
                               </td>
                               <td className="py-5 px-8 text-right text-xs font-bold text-gray-600">{formatCurrency(loan.jumlah_pinjaman)}</td>
                               <td className="py-5 px-8 text-center text-xs font-bold text-gray-600">{loan.tenor} <span className="text-[9px] text-gray-400 uppercase">Bln</span></td>
                               <td className="py-5 px-8 text-right text-xs font-bold text-[#EB5757]">{formatCurrency(loan.angsuran_per_bulan)}</td>
                               <td className="py-5 px-8"><StatusBadge status={loan.status} /></td>
                               <td className="py-5 px-8 text-right">
                                 {canEdit ? (
                                   <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                     {loan.status === 'Pending' ? (
                                       <button 
                                         onClick={() => handleLoanActionClick(loan, 'review')} 
                                         className="p-2.5 text-[#F2994A] hover:bg-orange-50 rounded-xl transition-all" 
                                         title="Review Pinjaman"
                                       >
                                         <Eye size={22} />
                                       </button>
                                     ) : (
                                       <button 
                                         onClick={() => handleLoanActionClick(loan, 'edit')} 
                                         className="p-2.5 text-gray-400 hover:text-[#004A9C] hover:bg-[#DFEAF4] rounded-xl transition-all" 
                                         title="Edit Pinjaman"
                                       >
                                         <Edit2 size={22} />
                                       </button>
                                     )}
                                   </div>
                                 ) : (
                                   <span className="text-[9px] font-bold text-gray-300 uppercase italic">View Only</span>
                                 )}
                               </td>
                             </motion.tr>
                           );
                         })
                       ) : (
                         <tr><td colSpan={8} className="py-24 text-center text-gray-400 italic">Data pinjaman tidak ditemukan.</td></tr>
                       )}
                     </tbody>
                   </motion.table>
                 </AnimatePresence>
               </div>
               {!isLoading && paginatedData.length > 0 && <Pagination />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODALS --- */}
      {/* Loan Review Modal */}
      <Modal isOpen={isLoanActionModalOpen} onClose={() => setIsLoanActionModalOpen(false)} title={loanActionType === 'review' ? 'Review Pinjaman' : 'Edit Pinjaman'} confirmText={loanActionType === 'review' ? '' : 'Simpan'} onConfirm={() => loanActionType !== 'review' && submitUpdateLoan()}>
        <div className="space-y-6 pt-2 text-left">
           <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-[#004A9C] text-white rounded-xl flex items-center justify-center font-bold text-lg">{selectedLoan?.anggota?.nama_lengkap?.charAt(0)}</div>
              <div><h4 className="font-bold text-gray-800">{selectedLoan?.anggota?.nama_lengkap}</h4><p className="text-[10px] text-gray-400 uppercase tracking-widest">ID: {selectedLoan?.anggota?.no_anggota}</p></div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase">Jumlah Diajukan</label><Input value={selectedLoan?.jumlah_pinjaman} disabled /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#004A9C] uppercase">Jumlah Disetujui</label><Input value={updateLoan.jumlah_disetujui} type="number" onChange={(e) => setUpdateLoan({...updateLoan, jumlah_disetujui: e.target.value})} /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase">Tenor (Bulan)</label><Input value={updateLoan.tenor} type="number" onChange={(e) => setUpdateLoan({...updateLoan, tenor: e.target.value})} /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
                <select className="w-full px-4 py-3.5 text-sm font-medium text-gray-700 bg-gray-50/50 border border-transparent focus:border-[#004A9C]/20 focus:bg-white rounded-xl outline-none transition-all shadow-sm" value={updateLoan.status} onChange={(e) => setUpdateLoan({...updateLoan, status: e.target.value})}>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </div>
           </div>
           {loanActionType === 'review' && (
             <div className="flex gap-3 pt-2">
                <Button className="flex-1 bg-[#27AE60] !py-3.5 text-sm shadow-lg shadow-[#27AE60]/20" onClick={() => submitUpdateLoan('Approved')}>Review Setuju</Button>
                <Button className="flex-1 bg-[#EB5757] !py-3.5 text-sm shadow-lg shadow-[#EB5757]/20" onClick={() => submitUpdateLoan('Rejected')}>Review Tolak</Button>
             </div>
           )}
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        confirmText="Lanjutkan"
        cancelText="Batal"
      />

      {/* Status Modal (Success/Error) */}
      <Modal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        confirmText="Tutup"
      />
    </motion.div>
  );
}
