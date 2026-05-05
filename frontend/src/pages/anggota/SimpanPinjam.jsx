import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
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
  AlertCircle,
  Eye,
  CheckCircle2
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
import angkaKeTerbilang from '../../utils/terbilang';

export default function SimpanPinjam() {
  const { api, user } = useAuth();
  const socket = useSocket();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('simpanan');
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [currentInstallmentPage, setCurrentInstallmentPage] = useState(1);
  const itemsPerPage = 8;
  const installmentsPerPage = 10;

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    jenis_pinjaman: 'Uang',
    jumlah_pinjaman: '',
    terbilang: '',
    keperluan: '',
    catatan_pengurus: ''
  });
  const [simulations, setSimulations] = useState([]);
  const [configs, setConfigs] = useState({});
  const jumlahInputRef = useRef(null);
  const cursorPosRef = useRef(null);

  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'warning', title: '', message: '', onConfirm: () => {} });
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Membership Eligibility Logic (Min 30 days for Loans)
  const membershipDays = useMemo(() => {
    if (!profileData?.tanggal_bergabung) return 0;
    const joinDate = new Date(profileData.tanggal_bergabung);
    const today = new Date();
    // Reset time for accurate day calculation
    joinDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today - joinDate;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [profileData]);

  const isEligibleForLoan = useMemo(() => {
    // Pengurus are always eligible, Anggota must be 30+ days
    if (user?.role !== 'Anggota') return true;
    return membershipDays >= 30;
  }, [user?.role, membershipDays]);


  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoints = ['/user/profile', '/simpan-pinjam/konfigurasi'];
      const [resProfile, resConfigs] = await Promise.all(endpoints.map(e => api.get(e)));
      
      if (resProfile.data.success) {
        setProfileData(resProfile.data.data);
      }
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

  useEffect(() => {
    const loanId = searchParams.get('detail_loan');
    if (loanId && profileData?.pinjaman) {
      const loan = profileData.pinjaman.find(p => p.pinjaman_id.toString() === loanId);
      if (loan) {
        setSelectedLoan(loan);
        setIsDetailOpen(true);
        setActiveTab('pinjaman');
        // Clear param
        window.history.replaceState(null, '', location.pathname);
      }
    }
  }, [searchParams, profileData, location.pathname]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchData();
    };

    socket.on('simpanan:updated', handleUpdate);
    socket.on('simpanan:bulkUpdated', handleUpdate);
    socket.on('transaksi:created', handleUpdate);
    socket.on('transaksi:updated', handleUpdate);
    socket.on('pinjaman:updated', handleUpdate);
    socket.on('pinjaman:created', handleUpdate);
    socket.on('pinjaman:bulkUpdated', handleUpdate);
    
    const handleConfigUpdate = (data) => {
      console.log('📥 WebSocket Received konfigurasi:updated:', data);
      setConfigs(prev => ({ ...prev, [data.nama_config]: data.nilai }));
    };
    socket.on('konfigurasi:updated', handleConfigUpdate);

    return () => {
      socket.off('simpanan:updated', handleUpdate);
      socket.off('simpanan:bulkUpdated', handleUpdate);
      socket.off('transaksi:created', handleUpdate);
      socket.off('transaksi:updated', handleUpdate);
      socket.off('pinjaman:updated', handleUpdate);
      socket.off('pinjaman:created', handleUpdate);
      socket.off('pinjaman:bulkUpdated', handleUpdate);
      socket.off('konfigurasi:updated', handleConfigUpdate);
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
    
    const statusPriority = {
      'Pending': 1,
      'Approved': 2,
      'Rejected': 3,
      'Lunas': 4
    };

    return profileData.pinjaman
      .filter(loan => 
        loan.jenis_pinjaman?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.keperluan?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const priorityA = statusPriority[a.status] || 99;
        const priorityB = statusPriority[b.status] || 99;
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        const dateA = new Date(a.tanggal_pengajuan);
        const dateB = new Date(b.tanggal_pengajuan);
        if (dateB - dateA !== 0) return dateB - dateA;
        return (b.pinjaman_id || 0) - (a.pinjaman_id || 0);
      });
  }, [profileData, searchQuery]);

  const allInstallments = useMemo(() => {
    if (!profileData?.pinjaman) return [];
    
    let installments = [];
    profileData.pinjaman.forEach(loan => {
      if (loan.angsuran && Array.isArray(loan.angsuran)) {
        loan.angsuran.forEach(ang => {
          installments.push({
            ...ang,
            loan_type: loan.jenis_pinjaman,
            loan_id: loan.pinjaman_id,
            nomor_invoice: loan.nomor_invoice
          });
        });
      }
    });
    
    return installments.sort((a, b) => {
      const dateA = new Date(a.tanggal_bayar);
      const dateB = new Date(b.tanggal_bayar);
      if (dateB - dateA !== 0) return dateB - dateA;
      return (b.angsuran_id || 0) - (a.angsuran_id || 0);
    });
  }, [profileData]);

  const activeData = activeTab === 'simpanan' ? filteredTransactions : filteredLoans;
  const totalPages = Math.ceil(activeData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return activeData.slice(start, start + itemsPerPage);
  }, [activeData, currentPage]);

  const totalInstallmentPages = Math.ceil(allInstallments.length / installmentsPerPage);
  const paginatedInstallments = useMemo(() => {
    const start = (currentInstallmentPage - 1) * installmentsPerPage;
    return allInstallments.slice(start, start + installmentsPerPage);
  }, [allInstallments, currentInstallmentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const formatToRupiah = useCallback((value) => {
    if (!value && value !== 0) return '';
    const cleanValue = value.toString().replace(/[^0-9]/g, '');
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }, []);

  // Restore cursor position after React re-renders the formatted value
  useEffect(() => {
    if (cursorPosRef.current !== null && jumlahInputRef.current) {
      jumlahInputRef.current.setSelectionRange(cursorPosRef.current, cursorPosRef.current);
      cursorPosRef.current = null;
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'jumlah_pinjaman') {
      const el = e.target;
      const cursorPos = el.selectionStart;
      const oldLen = el.value.length;

      const rawValue = value.toString().replace(/[^0-9]/g, '');
      const formatted = formatToRupiah(rawValue);
      const newLen = formatted.length;

      // Calculate new cursor position based on length change from formatting
      cursorPosRef.current = Math.max(0, cursorPos + (newLen - oldLen));

      setFormData(prev => ({ ...prev, [name]: formatted, terbilang: rawValue ? angkaKeTerbilang(rawValue) : '' }));
      setSimulations([]);
    } else if (name === 'jenis_pinjaman') {
      setFormData(prev => ({ ...prev, [name]: value, keperluan: '' }));
      setSimulations([]);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getAngsuranLimit = (jabatan) => {
    switch (jabatan) {
      case 'Manager': return parseFloat(configs['LIMIT_ANGSURAN_MGR'] || 5000000);
      case 'Assistant_Manager': return parseFloat(configs['LIMIT_ANGSURAN_ASST_MGR'] || 3000000);
      case 'Staff':
      default: return parseFloat(configs['LIMIT_ANGSURAN_STAFF'] || 2000000);
    }
  };

  const handleSimulasi = () => {
    if (!formData.jumlah_pinjaman || !formData.keperluan) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Peringatan', message: 'Lengkapi semua data terlebih dahulu sebelum melakukan simulasi.' });
      return;
    }
    const jumlah = parseFloat(formData.jumlah_pinjaman.replace(/\./g, ''));
    if (isNaN(jumlah) || jumlah <= 0) return;

    if (formData.jenis_pinjaman === 'Uang') {
      const maxPinjamanUang = parseFloat(configs['MAX_PINJAMAN_UANG'] || 15000000);
      if (jumlah > maxPinjamanUang) {
        setStatusModal({ isOpen: true, type: 'error', title: 'Melebihi Limit', message: `Maksimal pinjaman uang adalah ${formatCurrency(maxPinjamanUang)}` });
        setSimulations([]);
        return;
      }
    }

    const tenors = formData.jenis_pinjaman === 'Uang' ? [10] : [10, 15, 20];
    const baseLimit = getAngsuranLimit(user?.jabatan || profileData?.anggota?.jabatan || 'Staff');
    const usedLimit = profileData?.pinjaman?.filter(p => p.status === 'Approved').reduce((acc, curr) => acc + parseFloat(curr.angsuran_per_bulan || 0), 0) || 0;
    const remainingLimit = Math.max(0, baseLimit - usedLimit);

    const results = tenors.map(t => {
      let bungaPersen = 0;
      if (t === 10) bungaPersen = parseFloat(configs['BUNGA_10_BULAN'] || 10) / 100;
      else if (t === 15) bungaPersen = parseFloat(configs['BUNGA_15_BULAN'] || 15) / 100;
      else if (t === 20) bungaPersen = parseFloat(configs['BUNGA_20_BULAN'] || 20) / 100;

      const bunga = jumlah * bungaPersen;
      const totalPembayaran = jumlah + bunga;
      const angsuranBulan = totalPembayaran / t;

      return {
        tenor: t,
        bunga,
        totalPembayaran,
        angsuranBulan,
        isValid: angsuranBulan <= remainingLimit
      };
    });

    if (results.every(r => !r.isValid)) {
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Melebihi Sisa Limit',
        message: `Sisa limit angsuran Anda adalah ${formatCurrency(remainingLimit)}/bulan (Total limit: ${formatCurrency(baseLimit)}). Silakan turunkan nominal pengajuan.`
      });
      setSimulations([]);
    } else {
      setSimulations(results);
    }
  };

  const handleSubmitLoan = async (selectedTenor) => {
    setConfirmModal({
      isOpen: true,
      type: 'warning',
      title: 'Konfirmasi Pengajuan',
      message: `Apakah Anda yakin ingin mengajukan pinjaman ${formData.jenis_pinjaman} sebesar ${formatCurrency(formData.jumlah_pinjaman)} dengan tenor ${selectedTenor} bulan?`,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const payload = {
            ...formData,
            jumlah_pinjaman: formData.jumlah_pinjaman.replace(/\./g, ''), // Clean dots
            tenor: selectedTenor
          };
          const response = await api.post('/simpan-pinjam/pinjaman', payload);
          if (response.data.success) {
            setIsFormOpen(false);
            setFormData({
              jenis_pinjaman: 'Uang',
              jumlah_pinjaman: '',
              terbilang: '',
              keperluan: ''
            });
            setSimulations([]);
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
      }
    });
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

        {!isFormOpen && !isDetailOpen && activeTab === 'pinjaman' && isEligibleForLoan && (

          <Button 
            className="relative z-10 flex items-center gap-2 !px-8 !py-4 shadow-xl shadow-[#004A9C]/20"
            onClick={() => {
              setFormData({ jenis_pinjaman: 'Uang', jumlah_pinjaman: '', terbilang: '', keperluan: '', catatan_pengurus: '' });
              setIsFormOpen(true);
            }}
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

            {formData.catatan_pengurus && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-10 bg-orange-50 border border-orange-100 p-6 rounded-3xl flex gap-4 items-start shadow-sm"
              >
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                  <Info size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-orange-900 uppercase tracking-widest mb-1">Catatan Pengurus / Alasan Penolakan</h4>
                  <p className="text-sm text-orange-800/80 font-medium leading-relaxed italic">
                    "{formData.catatan_pengurus}"
                  </p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
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

                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Jumlah {formData.jenis_pinjaman === 'Barang' ? 'Harga Barang' : 'Pinjaman'}</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black group-focus-within:text-[#004A9C] transition-colors">Rp</div>
                    <input 
                      ref={jumlahInputRef}
                      name="jumlah_pinjaman"
                      value={formData.jumlah_pinjaman}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e4e8c]/50 focus:border-[#1e4e8c] transition-all text-gray-700 placeholder-gray-400 lg:text-[12px] text-base !pl-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Terbilang</label>
                  <div className="relative">
                    <Input 
                      name="terbilang"
                      value={formData.terbilang}
                      readOnly
                      className="!bg-gray-50 !text-gray-500 italic cursor-not-allowed"
                      placeholder="Otomatis terisi dari nominal"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#004A9C] uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-full">Auto</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Keperluan</label>
                  <Textarea 
                    name="keperluan"
                    value={formData.keperluan}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder={formData.jenis_pinjaman === 'Barang' ? "Sebutkan NAMA BARANG secara spesifik dan tujuan pengajuan..." : "Jelaskan tujuan pengajuan pinjaman Anda..."}
                    required
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[#004A9C] text-white rounded-xl">
                      <Activity size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">Simulasi Pinjaman</h4>
                      <p className="text-xs text-gray-500">Cek angsuran sebelum mengajukan</p>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    {simulations.length > 0 ? (
                      <div className="space-y-4">
                        {simulations.map((sim, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-4 rounded-2xl border transition-all ${sim.isValid ? 'bg-white border-[#004A9C]/20 hover:shadow-lg hover:border-[#004A9C]' : 'bg-red-50 border-red-100 opacity-70'}`}
                          >
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
                              <span className="font-black text-[#004A9C]">{sim.tenor} Bulan</span>
                              <span className="text-xs font-bold text-gray-400 uppercase">Bunga {(sim.bunga / parseFloat(formData.jumlah_pinjaman.toString().replace(/\./g, '') || 1) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Bunga:</span>
                                <span className="font-bold text-gray-700">{formatCurrency(sim.bunga)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Total Kembali:</span>
                                <span className="font-bold text-[#004A9C]">{formatCurrency(sim.totalPembayaran)}</span>
                              </div>
                              <div className="flex justify-between text-sm pt-2 border-t border-gray-50">
                                <span className="text-gray-500 font-bold">Angsuran/Bln:</span>
                                <span className={`font-black ${sim.isValid ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(sim.angsuranBulan)}</span>
                              </div>
                              {!sim.isValid && <p className="text-[10px] text-red-500 italic mt-1 text-center font-medium">Angsuran melebihi limit potong gaji</p>}
                            </div>
                            <Button 
                              onClick={() => sim.isValid && handleSubmitLoan(sim.tenor)}
                              disabled={!sim.isValid}
                              className={`w-full py-2.5 text-xs ${sim.isValid ? 'shadow-md shadow-[#004A9C]/20' : '!bg-gray-200 !text-gray-400'}`}
                            >
                              Pilih & Ajukan ({sim.tenor} Bln)
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-dashed border-blue-200">
                        <CreditCard className="text-blue-200 mb-3" size={40} />
                        <p className="text-sm text-gray-400 font-medium">Isi form di samping lalu klik tombol simulasi untuk melihat perkiraan angsuran Anda.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-6 mt-auto">
                    <Button type="button" onClick={() => setIsFormOpen(false)} variant="secondary" className="flex-1 !bg-white border !border-gray-200 !text-gray-500 hover:!bg-gray-50">
                      Tutup
                    </Button>
                    <Button type="button" onClick={handleSimulasi} className="flex-1 shadow-lg shadow-[#004A9C]/20">
                      Lihat Simulasi
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : isDetailOpen && selectedLoan ? (
          <motion.div
            key="loan-detail-full"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="space-y-8"
          >
            {/* Header / Back Button */}
            <div className="flex items-center gap-4 mb-2">
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="p-3 bg-white text-gray-400 hover:text-[#004A9C] hover:bg-[#DFEAF4] rounded-2xl transition-all border border-gray-100 shadow-sm"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Detail Pinjaman</h3>
                <p className="text-gray-400 font-medium">Informasi lengkap mengenai pengajuan pinjaman Anda.</p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Side: Info Cards */}
              <div className="flex-1 space-y-8">
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-blue-900/5 space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gray-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-[#004A9C] text-white rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-blue-900/20">
                      <FileText size={28} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-gray-900 tracking-tight">Informasi Pengajuan</h4>
                      <p className="text-xs font-bold text-[#004A9C] uppercase tracking-[0.2em] opacity-70">ID PINJAMAN: {selectedLoan.pinjaman_id}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 relative z-10">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipe Pinjaman</p>
                      <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedLoan.jenis_pinjaman === 'Barang' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-[#004A9C]'}`}>
                          {selectedLoan.jenis_pinjaman === 'Barang' ? <CreditCard size={20} /> : <Wallet size={20} />}
                        </div>
                        <span className="text-sm font-bold text-gray-700">Pinjaman {selectedLoan.jenis_pinjaman}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Pengajuan</p>
                      <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                          <Clock size={20} />
                        </div>
                        <span className="text-sm font-bold text-gray-700">{formatDate(selectedLoan.tanggal_pengajuan)}</span>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tujuan / Keperluan</p>
                      <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-100 text-sm text-gray-600 leading-relaxed italic shadow-sm relative">
                        <div className="absolute top-4 left-4 text-gray-200">
                          <Info size={40} />
                        </div>
                        <span className="relative z-10 pl-10 block">"{selectedLoan.keperluan}"</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedLoan.catatan_pengurus && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-orange-50 rounded-[2.5rem] p-10 border border-orange-100 shadow-xl shadow-orange-900/5 space-y-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-100 rounded-full -mr-24 -mt-24 opacity-30 blur-3xl"></div>
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 bg-[#F2994A] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/20">
                        <Activity size={24} />
                      </div>
                      <h4 className="text-lg font-black text-orange-900 tracking-tight uppercase tracking-wider">Catatan Pengurus</h4>
                    </div>
                    
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-orange-100 text-sm text-orange-900 font-medium leading-relaxed relative z-10 shadow-sm">
                      {selectedLoan.catatan_pengurus}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Side: Financial Summary */}
              <div className="w-full lg:w-[380px] space-y-6">
                <div className="bg-[#004A9C] rounded-[3rem] p-10 text-white shadow-2xl shadow-blue-900/40 relative overflow-hidden flex flex-col h-full min-h-[600px]">
                  {/* Decorative backgrounds */}
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
                  <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-400/20 rounded-full blur-[80px]"></div>

                  <div className="relative z-10 flex-1 space-y-10">
                    <div className="flex items-center justify-between">
                      <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20">
                        <TrendingUp size={32} className="text-blue-200" />
                      </div>
                      <StatusBadge status={selectedLoan.status} />
                    </div>

                    <div className="space-y-8">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.25em] opacity-70">Diajukan / Disetujui</p>
                        <div className="flex flex-col">
                          {selectedLoan.pinjaman_disetujui && selectedLoan.pinjaman_disetujui !== selectedLoan.jumlah_pinjaman && (
                            <span className="text-sm font-bold text-blue-300/50 line-through decoration-blue-400/50 mb-1">{formatCurrency(selectedLoan.jumlah_pinjaman)}</span>
                          )}
                          <span className="text-4xl font-black tracking-tighter drop-shadow-md">
                            {formatCurrency(selectedLoan.pinjaman_disetujui || selectedLoan.jumlah_pinjaman)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-6 bg-white/10 rounded-[2rem] border border-white/10 backdrop-blur-sm flex justify-between items-center">
                          <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest opacity-70">Tenor</p>
                          <p className="text-xl font-black">{selectedLoan.tenor} <span className="text-xs font-bold opacity-60">Bln</span></p>
                        </div>
                        <div className="p-6 bg-white/10 rounded-[2rem] border border-white/10 backdrop-blur-sm flex justify-between items-center">
                          <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest opacity-70">Total Bunga</p>
                          <p className="text-xl font-black">{formatCurrency(selectedLoan.total_bunga || 0)}</p>
                        </div>
                        <div className="p-6 bg-white/10 rounded-[2rem] border border-white/10 backdrop-blur-sm flex justify-between items-center">
                          <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest opacity-70">Total Tagihan</p>
                          <p className="text-xl font-black">{formatCurrency(selectedLoan.total_angsuran || 0)}</p>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-white/10">
                        <div className="flex flex-col items-center">
                          <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.2em] opacity-70 mb-4">Angsuran Per Bulan</p>
                          <div className="w-full bg-white text-[#004A9C] rounded-[2rem] py-6 px-4 text-center shadow-2xl shadow-black/20">
                            <p className="text-3xl font-black tracking-tight">{formatCurrency(selectedLoan.angsuran_per_bulan)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-10">
                    <Button 
                      onClick={() => setIsDetailOpen(false)}
                      className="w-full !py-5 !bg-white/10 hover:!bg-white/20 !text-white border border-white/20 rounded-[1.5rem] font-black uppercase tracking-widest transition-all backdrop-blur-sm"
                    >
                      Kembali ke Daftar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
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

            {activeTab === 'pinjaman' && !isEligibleForLoan ? (
              /* Warning for restricted members */
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-xl shadow-blue-900/5 text-center space-y-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-50 rounded-full -ml-24 -mb-24 opacity-40 blur-3xl"></div>

                <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-amber-100/50 relative z-10">
                  <AlertCircle size={48} className="animate-pulse" />
                </div>
                
                <div className="max-w-md mx-auto space-y-3 relative z-10">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Akses Pinjaman Dibatasi</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    Maaf, fitur pengajuan pinjaman hanya tersedia bagi anggota yang telah bergabung selama minimal <span className="text-[#004A9C] font-bold">30 hari</span>.
                  </p>
                </div>

                <div className="bg-gray-50/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 max-w-sm mx-auto relative z-10">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.25em] mb-4">Status Keanggotaan Anda</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black text-[#004A9C]">{membershipDays}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Hari</span>
                    </div>
                    <div className="h-10 w-px bg-gray-200"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black text-gray-300">30</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Target</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (membershipDays / 30) * 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-[#004A9C] to-blue-400"
                    ></motion.div>
                  </div>
                </div>

                <p className="text-xs text-gray-400 italic relative z-10 mt-6">
                  Silakan kembali lagi setelah masa keanggotaan Anda mencukupi. Terus tingkatkan saldo simpanan Anda!
                </p>
              </motion.div>
            ) : (

              <>
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
                        { id: 'lk', 
                          label: 'Sisa Limit Angsuran', 
                          value: (() => {
                            const base = getAngsuranLimit(user?.jabatan || profileData?.anggota?.jabatan || 'Staff');
                            const used = profileData?.pinjaman?.filter(p => p.status === 'Approved').reduce((acc, curr) => acc + parseFloat(curr.angsuran_per_bulan || 0), 0) || 0;
                            return Math.max(0, base - used);
                          })(),
                          icon: TrendingUp, 
                          color: '#27AE60', 
                          detail: 'Batas pemotongan' 
                        },
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
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                          {activeTab === 'simpanan' ? 'Semua aktivitas simpanan' : 'Status pengajuan Anda'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto">
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
                              <th className="py-5 px-8 text-right">Diajukan/Disetujui</th>
                              <th className="py-5 px-8 text-center">Tenor/Angsuran</th>
                              <th className="py-5 px-8 text-right">Sisa Tagihan</th>
                              <th className="py-5 px-8 text-center">Status</th>
                              <th className="py-5 px-8 text-center">Manajemen</th>
                            </>
                          )}
                        </tr>
                      </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      <tr><td colSpan={activeTab === 'simpanan' ? 4 : 7} className="py-20 text-center text-gray-400 italic uppercase tracking-widest text-xs font-bold">Memuat data...</td></tr>
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
                              <td className="py-5 px-8 text-right">
                                <div className="flex flex-col items-end">
                                  {(item.status === 'Approved' || item.status === 'Lunas') ? (
                                    <>
                                      <span className="text-[10px] font-bold text-gray-400 line-through decoration-1">{formatCurrency(item.jumlah_pinjaman)}</span>
                                      <span className="text-xs font-black text-[#004A9C]">{formatCurrency(item.pinjaman_disetujui || item.jumlah_pinjaman)}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-xs font-black text-gray-700">{formatCurrency(item.jumlah_pinjaman)}</span>
                                      <span className="text-[10px] font-bold text-gray-300 italic">-</span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="py-5 px-8 text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-xs font-bold text-gray-600">{item.tenor} <span className="text-[9px] text-gray-400">Bln</span></span>
                                  <span className="text-[10px] font-black text-[#EB5757]">
                                    {(item.status === 'Approved' || item.status === 'Lunas') ? `${formatCurrency(item.angsuran_per_bulan)}/Bln` : '-'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-5 px-8 text-right text-xs font-bold text-[#27AE60]">
                                {item.status === 'Approved' || item.status === 'Lunas' ? formatCurrency(item.sisa_tagihan) : '-'}
                              </td>
                              <td className="py-5 px-8 text-center">
                                <StatusBadge status={item.status} />
                              </td>
                              <td className="py-5 px-8 text-center">
                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {item.status === 'Rejected' ? (
                                    <button 
                                      onClick={() => { 
                                        const cleanAmount = formatToRupiah(parseInt(item.jumlah_pinjaman).toString());
                                        setFormData({
                                          jenis_pinjaman: item.jenis_pinjaman,
                                          jumlah_pinjaman: cleanAmount,
                                          terbilang: item.terbilang,
                                          keperluan: item.keperluan,
                                          catatan_pengurus: item.catatan_pengurus
                                        });
                                        setIsFormOpen(true);
                                      }} 
                                      className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                                      title="Perbaiki Pengajuan"
                                    >
                                      <Eye size={18} />
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => { setSelectedLoan(item); setIsDetailOpen(true); }} 
                                      className="p-2 text-gray-400 hover:text-[#004A9C] hover:bg-blue-50 rounded-lg transition-all"
                                      title="Detail"
                                    >
                                      <Search size={18} />
                                    </button>
                                  )}

                                  {(item.status === 'Approved' || item.status === 'Lunas') && (
                                    <Link to={`/pinjaman/invoice/${item.pinjaman_id}`} className="p-2 text-blue-600 hover:text-[#004A9C] hover:bg-blue-50 rounded-lg transition-all" title="Invoice">
                                      <FileText size={18} />
                                    </Link>
                                  )}
                                </div>
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

            <AnimatePresence>
              {activeTab === 'pinjaman' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-12"
                >
                  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-900/5 overflow-hidden flex flex-col min-h-[500px]">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#004A9C] text-white rounded-2xl shadow-lg shadow-[#004A9C]/20">
                          <Activity size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-800 tracking-tight">Detail Riwayat Angsuran</h3>
                          <p className="text-sm text-gray-400 font-medium italic">Histori pemotongan tagihan pinjaman</p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-100">
                            <th className="py-5 px-8">Invoice</th>
                            <th className="py-5 px-8">Tipe Pinjaman</th>
                            <th className="py-5 px-8 text-center">Angsuran Ke</th>
                            <th className="py-5 px-8">Tanggal Bayar</th>
                            <th className="py-5 px-8 text-right">Nominal Angsuran</th>
                            <th className="py-5 px-8 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {paginatedInstallments.length > 0 ? (
                            paginatedInstallments.map((ang, idx) => (
                              <motion.tr 
                                key={ang.angsuran_id || idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="hover:bg-[#DFEAF4]/20 transition-all duration-300 group"
                              >
                                <td className="py-5 px-8">
                                  <span className="text-xs font-mono font-bold text-[#004A9C]">{ang.nomor_invoice || '-'}</span>
                                </td>
                                <td className="py-5 px-8">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${ang.loan_type === 'Uang' ? 'bg-blue-400' : 'bg-purple-400'}`}></div>
                                    <span className="text-xs font-bold text-gray-700">Pinjaman {ang.loan_type}</span>
                                  </div>
                                </td>
                                <td className="py-5 px-8 text-center">
                                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase">Ke-{ang.angsuran_ke}</span>
                                </td>
                                <td className="py-5 px-8">
                                  <span className="text-xs text-gray-500 font-medium">{formatDate(ang.tanggal_bayar)}</span>
                                </td>
                                <td className="py-5 px-8 text-right">
                                  <span className="text-sm font-black text-gray-900">{formatCurrency(ang.jumlah_bayar)}</span>
                                </td>
                                <td className="py-5 px-8 text-center">
                                  <div className="flex justify-center">
                                    <StatusBadge status="Success" />
                                  </div>
                                </td>
                              </motion.tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-24 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                                    <Clock size={32} />
                                  </div>
                                  <p className="text-sm text-gray-400 italic font-medium uppercase tracking-widest text-[10px]">Belum ada riwayat angsuran.</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-8 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between bg-gray-50/20 gap-4">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest order-2 sm:order-1">
                         Menampilkan <span className="text-[#004A9C]">{allInstallments.length > 0 ? (currentInstallmentPage-1)*installmentsPerPage + 1 : 0} - {Math.min(allInstallments.length, currentInstallmentPage*installmentsPerPage)}</span> dari {allInstallments.length} Data
                      </span>
                      {allInstallments.length > 0 && (
                        <div className="flex items-center gap-2 order-1 sm:order-2">
                           <button 
                             onClick={() => setCurrentInstallmentPage(p => Math.max(1, p - 1))}
                             disabled={currentInstallmentPage === 1}
                             className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#004A9C] hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                           >
                             <BiChevronLeft size={18} />
                             <span>Sebelumnya</span>
                           </button>
                           <div className="flex gap-1.5 mx-1">
                             {[...Array(totalInstallmentPages)].map((_, i) => (
                               <button
                                 key={i}
                                 onClick={() => setCurrentInstallmentPage(i + 1)}
                                 className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${currentInstallmentPage === i + 1 ? 'bg-[#004A9C] text-white shadow-lg shadow-[#004A9C]/20' : 'border border-gray-100 text-gray-400 hover:bg-white hover:text-[#004A9C]'}`}
                               >
                                 {i + 1}
                               </button>
                             ))}
                           </div>
                            <button 
                              onClick={() => setCurrentInstallmentPage(p => Math.min(totalInstallmentPages, p + 1))}
                              disabled={currentInstallmentPage === totalInstallmentPages}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#004A9C] hover:bg-white transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <span>Selanjutnya</span>
                              <BiChevronRight size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
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

      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        onConfirm={confirmModal.onConfirm}
        confirmText="Lanjutkan"
        cancelText="Batal"
      />
    </motion.div>
  );
}
