import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  Printer,
  PlusCircle,
  Settings,
  ChevronRight,
  Eye,
  Trash2,
  Activity,
  ArrowUpDown
} from 'lucide-react';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import StatusBadge from '../../components/atoms/StatusBadge';
import Modal from '../../components/molecules/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { isKoordinatorSP } from '../../utils/roles';

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export default function SimpanPinjam() {
  const navigate = useNavigate();
  const location = useLocation();
  const { api, user } = useAuth();
  const socket = useSocket();
  const canEdit = ['Koordinator_Simpan_Pinjam', 'Bendahara'].includes(user?.role);
  const highlightRef = useRef(null);

  const [activeTab, setActiveTab] = useState('simpanan'); // 'simpanan' or 'pinjaman'
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [activeLoanFilter, setActiveLoanFilter] = useState('Semua');
  const [loanSortOrder, setLoanSortOrder] = useState('newest'); // 'newest' or 'oldest'
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);

  const formatToRupiah = (value) => {
    if (!value && value !== 0) return '';
    const cleanValue = value.toString().replace(/[^0-9]/g, '');
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };
  const [loanActionType, setLoanActionType] = useState('review');
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [hoveredStat, setHoveredStat] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'success' });



  const [updateLoan, setUpdateLoan] = useState({
    jumlah_disetujui: 0,
    tenor: 10,
    status: 'Pending',
    catatan_pengurus: '',
    metode_pembayaran: 'CASH'
  });

  // Data states
  const [savingsData, setSavingsData] = useState([]);
  const [loansData, setLoansData] = useState([]);
  const [configs, setConfigs] = useState({});

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoints = ['/simpan-pinjam/simpanan', '/simpan-pinjam/pinjaman', '/simpan-pinjam/konfigurasi'];
      const [resSimpanan, resPinjaman, resConfigs] = await Promise.all(endpoints.map(e => api.get(e)));
      
      if (resSimpanan.data.success) setSavingsData(resSimpanan.data.data);
      if (resPinjaman.data.success) setLoansData(resPinjaman.data.data);
      if (resConfigs.data.success) {
        const configMap = {};
        resConfigs.data.data.forEach(c => { configMap[c.nama_config] = c.nilai; });
        setConfigs(configMap);
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

    const handlePinjamanBulkUpdated = () => {
      console.log('📥 WebSocket Received pinjaman:bulkUpdated');
      fetchData();
    };

    const handlePinjamanCreated = (data) => {
      console.log('📥 WebSocket Received pinjaman:created:', data);
      setLoansData(prev => [data, ...prev]);
    };

    const handleKonfigurasiUpdated = (data) => {
      console.log('📥 WebSocket Received konfigurasi:updated:', data);
      setConfigs(prev => ({ ...prev, [data.nama_config]: data.nilai }));
    };

    socket.on('simpanan:updated', handleSimpananUpdated);
    socket.on('simpanan:created', handleSimpananCreated);
    socket.on('simpanan:bulkUpdated', handleSimpananBulkUpdated);
    socket.on('pinjaman:bulkUpdated', handlePinjamanBulkUpdated);
    socket.on('pinjaman:updated', handlePinjamanUpdated);
    socket.on('pinjaman:created', handlePinjamanCreated);
    socket.on('konfigurasi:updated', handleKonfigurasiUpdated);

    return () => {
      socket.off('simpanan:updated', handleSimpananUpdated);
      socket.off('simpanan:created', handleSimpananCreated);
      socket.off('simpanan:bulkUpdated', handleSimpananBulkUpdated);
      socket.off('pinjaman:bulkUpdated', handlePinjamanBulkUpdated);
      socket.off('pinjaman:updated', handlePinjamanUpdated);
      socket.off('pinjaman:created', handlePinjamanCreated);
      socket.off('konfigurasi:updated', handleKonfigurasiUpdated);
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
      profit: loansData.reduce((acc, curr) => acc + parseFloat(curr.total_bunga || 0), 0),
      active: loansData.filter(l => l.status === 'Approved').length,
      total_disbursed: loansData
        .filter(l => l.status === 'Approved' || l.status === 'Lunas')
        .reduce((acc, curr) => acc + parseFloat(curr.pinjaman_disetujui || 0), 0)
    };
  }, [loansData]);

  const filteredLoans = useMemo(() => {
    const statusPriority = {
      'Pending': 1,
      'Approved': 2,
      'Rejected': 3,
      'Lunas': 4
    };

    return loansData
      .filter(item => {
        const matchesSearch = (item.anggota?.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.anggota?.no_anggota || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeLoanFilter === 'Semua' || item.status === activeLoanFilter;
        
        const loanDate = new Date(item.tanggal_pengajuan);
        const loanMonth = String(loanDate.getMonth() + 1).padStart(2, '0');
        const loanYear = String(loanDate.getFullYear());
        
        const matchesMonth = filterMonth === 'all' || loanMonth === filterMonth;
        const matchesYear = filterYear === 'all' || loanYear === filterYear;
        
        return matchesSearch && matchesFilter && matchesMonth && matchesYear;
      })
      .sort((a, b) => {
        const priorityA = statusPriority[a.status] || 99;
        const priorityB = statusPriority[b.status] || 99;
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // Secondary sort by date / submission order
        if (loanSortOrder === 'oldest') {
          // Pertama masuk (oldest first)
          const dateDiff = new Date(a.tanggal_pengajuan) - new Date(b.tanggal_pengajuan);
          return dateDiff !== 0 ? dateDiff : a.pinjaman_id - b.pinjaman_id;
        } else {
          // Terakhir masuk (newest first)
          const dateDiff = new Date(b.tanggal_pengajuan) - new Date(a.tanggal_pengajuan);
          return dateDiff !== 0 ? dateDiff : b.pinjaman_id - a.pinjaman_id;
        }
      });
  }, [loansData, searchQuery, activeLoanFilter, loanSortOrder, filterMonth, filterYear]);

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
  }, [activeTab, searchQuery, activeLoanFilter, filterMonth, filterYear]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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


  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const handleLoanActionClick = (loan, type) => {
    setSelectedLoan(loan);
    setLoanActionType(type);
    setUpdateLoan({
      jumlah_disetujui: formatToRupiah((loan.pinjaman_disetujui || loan.jumlah_pinjaman).toString().split('.')[0]),
      tenor: loan.tenor || 10,
      status: loan.status,
      catatan_pengurus: loan.catatan_pengurus || '',
      metode_pembayaran: 'CASH'
    });
    setIsReviewOpen(true);
  };

  const handleDeleteLoan = (loan) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Pinjaman',
      message: `Apakah Anda yakin ingin menghapus pengajuan pinjaman dari ${loan.anggota?.nama_lengkap}? Tindakan ini tidak dapat dibatalkan.`,
      type: 'error',
      onConfirm: async () => {
        try {
          const response = await api.delete(`/simpan-pinjam/pinjaman/${loan.pinjaman_id}`);
          if (response.data.success) {
            setStatusModal({
              isOpen: true,
              type: 'success',
              title: 'Berhasil',
              message: 'Data pinjaman berhasil dihapus.'
            });
            setConfirmModal({ isOpen: false });
            setIsReviewOpen(false);
            setSelectedLoan(null);
            setActiveTab('pinjaman');
            fetchData();
          }
        } catch (error) {
          setStatusModal({
            isOpen: true,
            type: 'error',
            title: 'Gagal',
            message: error.response?.data?.message || 'Terjadi kesalahan saat menghapus pinjaman.'
          });
          setConfirmModal({ isOpen: false });
        }
      }
    });
  };

  // Check URL query param for automatic modal opening
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reviewLoanId = params.get('review_loan');
    if (reviewLoanId && loansData.length > 0) {
      const loan = loansData.find(l => l.pinjaman_id === parseInt(reviewLoanId));
      if (loan) {
        setActiveTab('pinjaman');
        handleLoanActionClick(loan, 'review');
        // Clear the URL param without refreshing
        window.history.replaceState(null, '', location.pathname);
      }
    }
  }, [location.search, loansData]);

  const handleBulkWajib = async (scope = 'all') => {
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

    setConfirmModal({
      isOpen: true,
      type: 'warning',
      title: 'Konfirmasi Setoran Kolektif',
      message: `Apakah Anda yakin ingin memproses setoran wajib untuk ${scope === 'all' ? 'seluruh anggota' : selectedItems.length + ' anggota terpilih'}? Transaksi akan dibuat secara otomatis menggunakan metode pembayaran BANK.`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
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
      }
    });
  };

  const handleBulkAngsuran = async (scope = 'all') => {
    if (scope === 'selected' && selectedItems.length === 0) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Peringatan', message: 'Pilih pinjaman terlebih dahulu.' });
      return;
    }
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      title: 'Konfirmasi Angsuran Kolektif',
      message: `Proses angsuran untuk ${scope === 'all' ? 'semua pinjaman aktif' : selectedItems.length + ' pinjaman terpilih'}? Transaksi akan otomatis dicatat ke akun BANK.`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          const payload = { selected_pinjaman_ids: scope === 'selected' ? selectedItems : [] };
          const response = await api.post('/simpan-pinjam/pinjaman/transaksi/bulk-angsuran', payload);
          if (response.data.success) {
            setStatusModal({ isOpen: true, type: 'success', title: 'Berhasil', message: response.data.message });
            setSelectedItems([]);
            fetchData();
          }
        } catch (error) {
          setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: error.response?.data?.message || 'Terjadi kesalahan.' });
        }
      }
    });
  };

  const handleLunaskan = (loan) => {
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      title: 'Konfirmasi Pelunasan Pinjaman',
      message: `Apakah Anda yakin ingin melunasi pinjaman ${loan.anggota?.nama_lengkap} dengan sisa tagihan ${formatCurrency(loan.sisa_tagihan)}? Seluruh sisa tagihan akan dianggap lunas.`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          const response = await api.post(`/simpan-pinjam/pinjaman/${loan.pinjaman_id}/lunaskan`, {
            metode_pembayaran: updateLoan.metode_pembayaran
          });
          if (response.data.success) {
            setStatusModal({ isOpen: true, type: 'success', title: 'Berhasil', message: response.data.message });
            setIsReviewOpen(false);
            fetchData();
          }
        } catch (error) {
          setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: error.response?.data?.message || 'Terjadi kesalahan saat melunasi pinjaman.' });
        }
      }
    });
  };

  const getAngsuranLimit = (jabatan) => {
    switch (jabatan) {
      case 'Manager': return parseFloat(configs['LIMIT_ANGSURAN_MGR'] || 5000000);
      case 'Assistant_Manager': return parseFloat(configs['LIMIT_ANGSURAN_ASST_MGR'] || 3000000);
      case 'Staff':
      default: return parseFloat(configs['LIMIT_ANGSURAN_STAFF'] || 2000000);
    }
  };

  const submitUpdateLoan = async (forcedStatus = null) => {
    try {
      const targetStatus = forcedStatus || updateLoan.status;
      
      // Validation: if Approved, check if monthly payment exceeds limit
      if (targetStatus === 'Approved') {
        const simJumlah = parseFloat(updateLoan.jumlah_disetujui.toString().replace(/\./g, '')) || 0;
        const t = parseInt(updateLoan.tenor) || 10;
        
        let simBungaPersen = 0;
        if (t === 10) simBungaPersen = parseFloat(configs['BUNGA_10_BULAN'] || 10) / 100;
        else if (t === 15) simBungaPersen = parseFloat(configs['BUNGA_15_BULAN'] || 15) / 100;
        else if (t === 20) simBungaPersen = parseFloat(configs['BUNGA_20_BULAN'] || 20) / 100;

        const simBunga = simJumlah * simBungaPersen;
        const simTotal = simJumlah + simBunga;
        const simAngsuran = simTotal / t;
        
        const baseLimit = getAngsuranLimit(selectedLoan?.anggota?.jabatan);
        const usedLimit = loansData
                 .filter(l => l.anggota_id === selectedLoan?.anggota_id && l.status === 'Approved' && l.pinjaman_id !== selectedLoan?.pinjaman_id)
                 .reduce((acc, curr) => acc + parseFloat(curr.angsuran_per_bulan || 0), 0);
        const remainingLimit = Math.max(0, baseLimit - usedLimit);
        
        if (simAngsuran > remainingLimit) {
          setStatusModal({ 
            isOpen: true, 
            type: 'error', 
            title: 'Melebihi Sisa Limit', 
            message: `Angsuran (${formatCurrency(simAngsuran)}/bln) melebihi sisa limit jabatan ${selectedLoan?.anggota?.jabatan} (${formatCurrency(remainingLimit)}/bln). Pinjaman tidak dapat disetujui.` 
          });
          return;
        }
      }

      // Validation: if Rejected, catatan_pengurus is mandatory
      if (targetStatus === 'Rejected' && !updateLoan.catatan_pengurus) {
        setStatusModal({ 
          isOpen: true, 
          type: 'error', 
          title: 'Peringatan', 
          message: 'Silakan isi keterangan alasan penolakan.' 
        });
        return;
      }

      await api.put(`/simpan-pinjam/pinjaman/${selectedLoan.pinjaman_id}`, {
        pinjaman_disetujui: updateLoan.jumlah_disetujui.toString().replace(/\./g, ''),
        tenor: updateLoan.tenor,
        status: targetStatus,
        catatan_pengurus: updateLoan.catatan_pengurus,
        metode_pembayaran: updateLoan.metode_pembayaran
      });
      
      setIsReviewOpen(false);
      setStatusModal({ isOpen: true, type: 'success', title: 'Berhasil', message: 'Status pinjaman berhasil diperbarui.' });
      fetchData();
    } catch (error) {
      console.error(error);
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: error.response?.data?.message || 'Terjadi kesalahan sistem saat memperbarui data.' });
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

            {/* Filter Bar (Search only) */}
            <motion.div variants={itemVariants} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Cari anggota atau ID..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none text-gray-800"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </motion.div>

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
          <AnimatePresence mode="wait">
            {!isReviewOpen ? (
              <motion.div 
                key="pinjaman-table-view" 
                variants={tabContentVariants} 
                initial="hidden" 
                animate="visible" 
                exit="exit" 
                className="space-y-6"
              >
                {/* Loan Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Outstanding Pinjaman', value: loanStats.outstanding, icon: Wallet, color: '#004A9C', bg: '#DFEAF4' },
                    { label: 'Estimasi Profit', value: loanStats.profit, icon: TrendingUp, color: '#F2994A', bg: '#fff3e0' },
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
                          </p>
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

                {/* Filter Bar (Search + Month + Year) */}
                <motion.div variants={itemVariants} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1 w-full">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="Cari anggota atau ID..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none text-gray-800"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                      className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-[#004A9C]/20 text-gray-700 min-w-[120px]"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                    >
                      <option value="all">Semua Bulan</option>
                      {months.map((m, i) => (
                        <option key={i} value={String(i + 1).padStart(2, "0")}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-[#004A9C]/20 text-gray-700 min-w-[120px]"
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                    >
                      <option value="all">Semua Tahun</option>
                      {Array.from(
                        { length: new Date().getFullYear() - 2024 + 2 },
                        (_, i) => 2024 + i,
                      )
                        .reverse()
                        .map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                    </select>
                  </div>
                </motion.div>

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

                      {/* Sorting Controls */}
                      <div className="relative z-20" ref={sortDropdownRef}>
                        <button
                          onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                          className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 hover:bg-gray-50 hover:text-gray-700 px-4 py-2.5 rounded-2xl border border-gray-100 transition-all duration-300 shadow-sm"
                        >
                          <ArrowUpDown size={14} className="text-[#004A9C]" />
                          <span>Urutkan</span>
                        </button>

                        <AnimatePresence>
                          {isSortDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-blue-900/10 overflow-hidden z-50"
                            >
                              <div className="p-2 space-y-1">
                                <button
                                  onClick={() => {
                                    setLoanSortOrder('newest');
                                    setIsSortDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                                    loanSortOrder === 'newest'
                                      ? 'bg-blue-50 text-[#004A9C]'
                                      : 'text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  <span>Terakhir Masuk (Terbaru)</span>
                                  {loanSortOrder === 'newest' && <div className="w-1.5 h-1.5 rounded-full bg-[#004A9C]" />}
                                </button>
                                <button
                                  onClick={() => {
                                    setLoanSortOrder('oldest');
                                    setIsSortDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                                    loanSortOrder === 'oldest'
                                      ? 'bg-blue-50 text-[#004A9C]'
                                      : 'text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  <span>Pertama Masuk (Terlama)</span>
                                  {loanSortOrder === 'oldest' && <div className="w-1.5 h-1.5 rounded-full bg-[#004A9C]" />}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
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
                            <th className="py-5 px-8 text-right">Diajukan/Disetujui</th>
                            <th className="py-5 px-8 text-center">Tenor/Angsuran</th>
                            <th className="py-5 px-8 text-right">Sisa Tagihan</th>
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
                                  <td className="py-5 px-8 text-right">
                                    <div className="flex flex-col items-end">
                                      {(loan.status === 'Approved' || loan.status === 'Lunas') ? (
                                        <>
                                          <span className="text-[10px] font-bold text-gray-400 line-through decoration-1">{formatCurrency(loan.jumlah_pinjaman)}</span>
                                          <span className="text-xs font-black text-[#004A9C]">{formatCurrency(loan.pinjaman_disetujui || loan.jumlah_pinjaman)}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="text-xs font-black text-gray-700">{formatCurrency(loan.jumlah_pinjaman)}</span>
                                          <span className="text-[10px] font-bold text-gray-300 italic">-</span>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-5 px-8 text-center">
                                    <div className="flex flex-col items-center">
                                      <span className="text-xs font-bold text-gray-600">{loan.tenor} <span className="text-[9px] text-gray-400 uppercase">Bln</span></span>
                                      <span className="text-[10px] font-black text-[#EB5757]">
                                        {(loan.status === 'Approved' || loan.status === 'Lunas') ? `${formatCurrency(loan.angsuran_per_bulan)}/Bln` : '-'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-5 px-8 text-right">
                                    <div className="flex flex-col items-end">
                                      <span className={`text-xs font-black ${(loan.status === 'Approved' || loan.status === 'Lunas') ? 'text-[#004A9C]' : 'text-gray-400'}`}>
                                        {(loan.status === 'Approved' || loan.status === 'Lunas') ? formatCurrency(loan.sisa_tagihan) : '-'}
                                      </span>
                                      {(loan.status === 'Approved' || loan.status === 'Lunas') && (
                                        <span className="text-[10px] text-gray-400 font-medium">
                                          Sisa dari {formatCurrency((parseFloat(loan.pinjaman_disetujui || loan.jumlah_pinjaman) + parseFloat(loan.total_bunga || 0)))}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-5 px-8"><StatusBadge status={loan.status} /></td>
                                  <td className="py-5 px-8 text-right">
                                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {canEdit ? (
                                        <>
                                          {loan.status !== 'Pending' ? (
                                            <div className="flex items-center gap-1">
                                              <button 
                                                onClick={() => handleLoanActionClick(loan, 'view')} 
                                                className="p-2.5 text-gray-400 hover:text-[#004A9C] hover:bg-blue-50 rounded-xl transition-all" 
                                                title="Kelola Pinjaman"
                                              >
                                                <Settings size={22} />
                                              </button>
                                              {(loan.status === 'Approved' || loan.status === 'Lunas') && (
                                                <Link 
                                                  to={`/pinjaman/invoice/${loan.pinjaman_id}`} 
                                                  className="p-2.5 text-blue-600 hover:text-[#004A9C] hover:bg-blue-50 rounded-xl transition-all" 
                                                  title="Cetak Invoice"
                                                >
                                                  <FileText size={22} />
                                                </Link>
                                              )}
                                            </div>
                                          ) : (
                                            <button 
                                              onClick={() => handleLoanActionClick(loan, 'review')} 
                                              className="p-2.5 text-[#F2994A] hover:bg-orange-50 rounded-xl transition-all" 
                                              title="Review Pinjaman"
                                            >
                                              <Eye size={22} />
                                            </button>
                                          )}
                                          
                                          {loan.status === 'Rejected' && (
                                            <button 
                                              onClick={() => handleDeleteLoan(loan)} 
                                              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" 
                                              title="Hapus Pinjaman"
                                            >
                                              <Trash2 size={22} />
                                            </button>
                                          )}
                                        </>
                                      ) : (
                                        <div className="flex items-center gap-1">
                                          <button 
                                            onClick={() => handleLoanActionClick(loan, 'view')} 
                                            className="p-2.5 text-gray-400 hover:text-[#004A9C] hover:bg-blue-50 rounded-xl transition-all" 
                                            title="Lihat Detail Pinjaman"
                                          >
                                            <Eye size={22} />
                                          </button>
                                          {(loan.status === 'Approved' || loan.status === 'Lunas') && (
                                            <Link 
                                              to={`/pinjaman/invoice/${loan.pinjaman_id}`} 
                                              className="p-2.5 text-blue-600 hover:text-[#004A9C] hover:bg-blue-50 rounded-xl transition-all" 
                                              title="Cetak Invoice"
                                            >
                                              <FileText size={22} />
                                            </Link>
                                          )}
                                        </div>
                                      )}
                                    </div>
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

                {/* Collective Action Card for Pinjaman */}
                {canEdit && (
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                        <Activity size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">Proses Angsuran Kolektif</h4>
                        <p className="text-xs text-gray-400">Potong tagihan bulanan anggota sekaligus secara otomatis.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                      <Button 
                        onClick={() => handleBulkAngsuran('all')}
                        className="flex-1 md:flex-none !bg-white !text-orange-600 border border-orange-100 hover:!bg-orange-50"
                      >
                        Semua Pinjaman Aktif
                      </Button>
                      <Button 
                        onClick={() => handleBulkAngsuran('selected')}
                        className="flex-1 md:flex-none !bg-orange-500 !text-white shadow-lg shadow-orange-900/10 hover:!bg-orange-600"
                      >
                        Terpilih ({selectedItems.length})
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-[#DFEAF4]/30 border border-[#004A9C]/10 rounded-3xl p-6 flex items-start gap-4 mt-6">
                  <div className="p-3 bg-white rounded-2xl text-[#004A9C] shadow-sm"><Info size={24} /></div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">Ketentuan Pinjaman</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Bunga pinjaman {parseFloat(configs['BUNGA_10_BULAN'] || 10)}% (10 bln), {parseFloat(configs['BUNGA_15_BULAN'] || 15)}% (15 bln), {parseFloat(configs['BUNGA_20_BULAN'] || 20)}% (20 bln). Angsuran per bulan akan memotong saldo tagihan secara otomatis melalui proses kolektif.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="pinjaman-review-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 p-10 border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-10">
                  <button 
                    onClick={() => setIsReviewOpen(false)}
                    className="p-3 bg-gray-50 text-gray-400 hover:text-[#004A9C] hover:bg-[#DFEAF4] rounded-2xl transition-all"
                  >
                    <BiChevronLeft size={32} />
                  </button>
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                      {loanActionType === 'review' ? 'Review Pengajuan Pinjaman' : 'Edit Data Pinjaman'}
                    </h3>
                    <p className="text-gray-400 font-medium italic">Sistem Persetujuan Koordinator Simpan Pinjam</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Left Side: Detail & Form */}
                  <div className="space-y-8">
                    {/* User Card */}
                    <div className="flex items-center gap-5 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#004A9C] to-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-900/20">
                        {selectedLoan?.anggota?.nama_lengkap?.charAt(0)}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-gray-900">{selectedLoan?.anggota?.nama_lengkap}</h4>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                          <span>{selectedLoan?.anggota?.no_anggota}</span>
                          <span>•</span>
                          <span className="text-[#004A9C] bg-[#DFEAF4] px-2 py-0.5 rounded">{selectedLoan?.anggota?.jabatan}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Jumlah Diajukan</label>
                        <Input value={formatCurrency(selectedLoan?.jumlah_pinjaman)} disabled className="bg-gray-50 border-gray-100 font-bold" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-black text-[#004A9C] uppercase tracking-widest ml-1">Jumlah Disetujui</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black group-focus-within:text-[#004A9C] transition-colors">Rp</div>
                          <Input 
                            value={updateLoan.jumlah_disetujui} 
                            onChange={(e) => setUpdateLoan({...updateLoan, jumlah_disetujui: formatToRupiah(e.target.value)})}
                            className="!pl-12 font-bold"
                            disabled={!canEdit || selectedLoan.status !== 'Pending'}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Tenor Persetujuan</label>
                      <select 
                        className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#004A9C]/20 transition-all font-bold text-sm text-gray-700 ${(!canEdit || selectedLoan.status !== 'Pending') ? 'cursor-not-allowed opacity-70' : ''}`} 
                        value={updateLoan.tenor} 
                        onChange={(e) => setUpdateLoan({...updateLoan, tenor: parseInt(e.target.value)})}
                        disabled={!canEdit || selectedLoan.status !== 'Pending'}
                      >
                        <option value="10">10 Bulan ({parseFloat(configs['BUNGA_10_BULAN'] || 10)}% Bunga)</option>
                        <option value="15">15 Bulan ({parseFloat(configs['BUNGA_15_BULAN'] || 15)}% Bunga)</option>
                        <option value="20">20 Bulan ({parseFloat(configs['BUNGA_20_BULAN'] || 20)}% Bunga)</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Keperluan Anggota</label>
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-600 font-medium min-h-[80px] leading-relaxed">
                        {selectedLoan?.keperluan}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-black text-[#EB5757] uppercase tracking-widest ml-1">Keterangan / Alasan Penolakan</label>
                      <textarea 
                        className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#EB5757]/20 transition-all font-medium text-sm text-gray-700 min-h-[100px] resize-none ${(!canEdit || selectedLoan.status !== 'Pending') ? 'cursor-not-allowed opacity-70' : ''}`} 
                        placeholder="Berikan alasan jika pinjaman ditolak atau catatan tambahan..."
                        value={updateLoan.catatan_pengurus}
                        onChange={(e) => setUpdateLoan({...updateLoan, catatan_pengurus: e.target.value})}
                        disabled={!canEdit || selectedLoan.status !== 'Pending'}
                      />
                    </div>
                  </div>

                  {/* Right Side: Simulation & Actions */}
                  <div className="space-y-6">
                    <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 h-full flex flex-col shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-[#004A9C] text-white rounded-xl shadow-lg shadow-blue-900/20">
                            <Activity size={24} />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-gray-900 tracking-tight">Kalkulasi Persetujuan</h4>
                            <p className="text-[10px] font-bold text-[#004A9C] uppercase tracking-[0.2em]">Live Simulation</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Limit Tersedia</p>
                          <p className="text-sm font-black text-gray-900">
                            {(() => {
                               const base = getAngsuranLimit(selectedLoan?.anggota?.jabatan);
                               const used = loansData
                                 .filter(l => l.anggota_id === selectedLoan?.anggota_id && l.status === 'Approved' && l.pinjaman_id !== selectedLoan?.pinjaman_id)
                                 .reduce((acc, curr) => acc + parseFloat(curr.angsuran_per_bulan || 0), 0);
                               return formatCurrency(Math.max(0, base - used));
                            })()}
                          </p>
                        </div>
                      </div>

                      {(() => {
                        // For Approved/Lunas: use STORED values from database (locked at approval time)
                        // For Pending: calculate dynamically from current configs
                        const isPending = selectedLoan?.status === 'Pending';
                        
                        let simBunga, simTotal, simAngsuran, simBungaPersen;
                        
                        if (isPending) {
                          const simJumlah = parseFloat(updateLoan.jumlah_disetujui.toString().replace(/\./g, '')) || 0;
                          const t = parseInt(updateLoan.tenor) || 10;
                          simBungaPersen = 0;
                          if (t === 10) simBungaPersen = parseFloat(configs['BUNGA_10_BULAN'] || 10) / 100;
                          else if (t === 15) simBungaPersen = parseFloat(configs['BUNGA_15_BULAN'] || 15) / 100;
                          else if (t === 20) simBungaPersen = parseFloat(configs['BUNGA_20_BULAN'] || 20) / 100;
                          simBunga = simJumlah * simBungaPersen;
                          simTotal = simJumlah + simBunga;
                          simAngsuran = simTotal / t;
                        } else {
                          // Use stored database values
                          simBunga = parseFloat(selectedLoan?.total_bunga || 0);
                          simTotal = parseFloat(selectedLoan?.total_angsuran || 0);
                          simAngsuran = parseFloat(selectedLoan?.angsuran_per_bulan || 0);
                          const approvedAmt = parseFloat(selectedLoan?.pinjaman_disetujui || selectedLoan?.jumlah_pinjaman || 1);
                          simBungaPersen = approvedAmt > 0 ? simBunga / approvedAmt : 0;
                        }
                        
                        const baseLimit = getAngsuranLimit(selectedLoan?.anggota?.jabatan);
                        const usedLimit = loansData
                                 .filter(l => l.anggota_id === selectedLoan?.anggota_id && l.status === 'Approved' && l.pinjaman_id !== selectedLoan?.pinjaman_id)
                                 .reduce((acc, curr) => acc + parseFloat(curr.angsuran_per_bulan || 0), 0);
                        const remainingLimit = Math.max(0, baseLimit - usedLimit);
                        const isOverLimit = isPending && simAngsuran > remainingLimit;

                        return (
                          <div className="space-y-6 flex-1">
                            {!isPending && (
                              <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-2 text-center">
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Data terkunci saat persetujuan</p>
                              </div>
                            )}
                            <div className="space-y-4">
                              <div className="flex justify-between items-center pb-4 border-b border-blue-100">
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Bunga ({(simBungaPersen*100).toFixed(0)}%)</span>
                                <span className="text-lg font-black text-gray-900">{formatCurrency(simBunga)}</span>
                              </div>
                              <div className="flex justify-between items-center pb-4 border-b border-blue-100">
                                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Pengembalian</span>
                                <span className="text-lg font-black text-[#004A9C]">{formatCurrency(simTotal)}</span>
                              </div>
                              {!isPending && (
                                <div className="flex justify-between items-center pb-4 border-b border-blue-100">
                                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Sisa Tagihan</span>
                                  <span className="text-lg font-black text-[#EB5757]">{formatCurrency(selectedLoan?.sisa_tagihan)}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-auto pt-6">
                              <div className={`bg-white/80 backdrop-blur-sm p-6 rounded-3xl border ${isOverLimit ? 'border-red-200' : 'border-blue-100'} shadow-sm text-center transition-all`}>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-2">Potongan Gaji /Bulan</p>
                                <p className={`text-4xl font-black tracking-tighter ${isOverLimit ? 'text-red-500' : 'text-[#27AE60]'}`}>
                                  {formatCurrency(simAngsuran)}
                                </p>
                                {isOverLimit && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-3 text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center justify-center gap-1.5"
                                  >
                                    <Info size={12} />
                                    <span>Melebihi Sisa Limit!</span>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {selectedLoan.status === 'Pending' && canEdit && (
                        <div className="mt-8 space-y-3">
                          <label className="text-[10px] font-bold text-[#004A9C] uppercase tracking-[0.2em] ml-1">Pilih Metode Pencairan</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              type="button"
                              onClick={() => setUpdateLoan({...updateLoan, metode_pembayaran: 'CASH'})}
                              className={`py-3 rounded-2xl text-xs font-black border-2 transition-all flex items-center justify-center gap-3 ${updateLoan.metode_pembayaran === 'CASH' ? 'border-[#004A9C] bg-[#004A9C]/5 text-[#004A9C]' : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50'}`}
                            >
                              <div className={`w-3 h-3 rounded-full ${updateLoan.metode_pembayaran === 'CASH' ? 'bg-[#004A9C]' : 'bg-gray-200'}`} />
                              CASH
                            </button>
                            <button 
                              type="button"
                              onClick={() => setUpdateLoan({...updateLoan, metode_pembayaran: 'BANK'})}
                              className={`py-3 rounded-2xl text-xs font-black border-2 transition-all flex items-center justify-center gap-3 ${updateLoan.metode_pembayaran === 'BANK' ? 'border-[#004A9C] bg-[#004A9C]/5 text-[#004A9C]' : 'border-gray-200 bg-white text-gray-400 hover:bg-gray-50'}`}
                            >
                              <div className={`w-3 h-3 rounded-full ${updateLoan.metode_pembayaran === 'BANK' ? 'bg-[#004A9C]' : 'bg-gray-200'}`} />
                              BANK
                            </button>
                          </div>
                        </div>
                      )}

                        <div className="flex flex-col gap-3 mt-6">
                        {selectedLoan.status === 'Pending' ? (
                          canEdit ? (
                            <div className="grid grid-cols-2 gap-4">
                              {(() => {
                                 const simJumlah = parseFloat(updateLoan.jumlah_disetujui.toString().replace(/\./g, '')) || 0;
                                 const t = parseInt(updateLoan.tenor) || 10;
                                 let simBungaPersen = 0;
                                 if (t === 10) simBungaPersen = parseFloat(configs['BUNGA_10_BULAN'] || 10) / 100;
                                 else if (t === 15) simBungaPersen = parseFloat(configs['BUNGA_15_BULAN'] || 15) / 100;
                                 else if (t === 20) simBungaPersen = parseFloat(configs['BUNGA_20_BULAN'] || 20) / 100;
                                 const simAngsuran = (simJumlah + (simJumlah * simBungaPersen)) / t;
                                 
                                 const baseLimit = getAngsuranLimit(selectedLoan?.anggota?.jabatan);
                                 const usedLimit = loansData
                                   .filter(l => l.anggota_id === selectedLoan?.anggota_id && l.status === 'Approved' && l.pinjaman_id !== selectedLoan?.pinjaman_id)
                                   .reduce((acc, curr) => acc + parseFloat(curr.angsuran_per_bulan || 0), 0);
                                 const remainingLimit = Math.max(0, baseLimit - usedLimit);
                                 const isOverLimit = simAngsuran > remainingLimit;
                                 
                                 return (
                                   <Button 
                                     className={`!py-4 font-black transition-all ${isOverLimit ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-[#27AE60] hover:bg-[#219150] shadow-xl shadow-[#27AE60]/20 text-white'}`}
                                     onClick={() => {
                                        if (!isOverLimit) {
                                          setConfirmModal({
                                            isOpen: true,
                                            type: 'success',
                                            title: 'Setujui Pinjaman',
                                            message: `Apakah Anda yakin ingin menyetujui pengajuan pinjaman ${selectedLoan?.anggota?.nama_lengkap} sebesar ${formatCurrency(updateLoan.jumlah_disetujui.toString().replace(/\./g, ''))}?`,
                                            onConfirm: () => {
                                              setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                              submitUpdateLoan('Approved');
                                            }
                                          });
                                        }
                                     }}
                                     disabled={isOverLimit}
                                   >
                                     {isOverLimit ? 'Limit Terlampaui' : 'Setujui'}
                                   </Button>
                                 );
                              })()}
                              <Button 
                                className="!py-4 bg-[#EB5757] hover:bg-[#c0392b] shadow-xl shadow-[#EB5757]/20 font-black text-white"
                                onClick={() => {
                                   if (!updateLoan.catatan_pengurus) {
                                     setStatusModal({ isOpen: true, type: 'error', title: 'Peringatan', message: 'Silakan isi alasan penolakan terlebih dahulu.' });
                                     return;
                                   }
                                   setConfirmModal({
                                     isOpen: true,
                                     type: 'error',
                                     title: 'Tolak Pinjaman',
                                     message: `Apakah Anda yakin ingin menolak pengajuan pinjaman ${selectedLoan?.anggota?.nama_lengkap}?`,
                                     onConfirm: () => {
                                       setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                       submitUpdateLoan('Rejected');
                                     }
                                   });
                                }}
                              >
                                Tolak
                              </Button>
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status Pinjaman</p>
                              <StatusBadge status={selectedLoan.status} />
                              <p className="text-[10px] text-gray-400 mt-2 italic">Menunggu Review Koordinator Simpan Pinjam</p>
                            </div>
                          )
                        ) : selectedLoan.status === 'Approved' ? (
                          <div className="space-y-4">
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-center space-y-2">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status Pinjaman</p>
                              <StatusBadge status={selectedLoan.status} />
                            </div>
                            {canEdit ? (
                              <div className="bg-green-50 p-5 rounded-2xl border border-green-100 text-center space-y-4">
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-[0.2em]">Metode Pelunasan</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button 
                                      onClick={() => setUpdateLoan({...updateLoan, metode_pembayaran: 'CASH'})}
                                      className={`py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${updateLoan.metode_pembayaran === 'CASH' ? 'border-green-600 bg-white text-green-600' : 'border-green-100 text-green-300 hover:bg-white/50'}`}
                                    >
                                      TUNAI
                                    </button>
                                    <button 
                                      onClick={() => setUpdateLoan({...updateLoan, metode_pembayaran: 'BANK'})}
                                      className={`py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${updateLoan.metode_pembayaran === 'BANK' ? 'border-green-600 bg-white text-green-600' : 'border-green-100 text-green-300 hover:bg-white/50'}`}
                                    >
                                      TRANSFER
                                    </button>
                                  </div>
                                </div>
                                <p className="text-[10px] text-green-700 font-medium">Sisa tagihan: <span className="font-black text-sm">{formatCurrency(selectedLoan.sisa_tagihan)}</span></p>
                                <Button
                                  onClick={() => handleLunaskan(selectedLoan)}
                                  className="w-full !py-4 !bg-[#27AE60] hover:!bg-[#219150] !text-white shadow-xl shadow-[#27AE60]/20 font-black uppercase tracking-widest"
                                >
                                  Lunasi Pinjaman Sekarang
                                </Button>
                              </div>
                            ) : (
                              <div className="bg-[#DFEAF4]/30 border border-[#004A9C]/10 rounded-2xl p-4 text-center">
                                <p className="text-[10px] text-gray-500 font-medium">Sisa tagihan: <span className="font-black text-[#004A9C]">{formatCurrency(selectedLoan.sisa_tagihan)}</span></p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status Pinjaman</p>
                            <StatusBadge status={selectedLoan.status} />
                            <p className="text-[10px] text-gray-400 mt-2 italic">Data ini sudah diproses dan tidak dapat diubah lagi.</p>
                          </div>
                        )}
                        {(!canEdit || selectedLoan.status === 'Pending') && (
                          <button 
                            onClick={() => setIsReviewOpen(false)}
                            className="w-full py-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-all uppercase tracking-widest"
                          >
                            Tutup Detail
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </AnimatePresence>

      {/* --- MODALS --- */}
      {/* Old Loan Review Modal Removed */}


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
      />    </motion.div>
  );
}
