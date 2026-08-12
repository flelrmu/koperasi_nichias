import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Mail, 
  Phone,
  Search,
  Settings,
  LogOut,
  Info,
  Filter
} from 'lucide-react';
import { 
  BiChevronLeft, 
  BiChevronRight,
  BiShow,
  BiEditAlt,
  BiTrashAlt
} from 'react-icons/bi';
import { FaUserPlus, FaUsers, FaShieldAlt } from 'react-icons/fa';

import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import StatusBadge from '../../components/atoms/StatusBadge';
import Modal from '../../components/molecules/Modal';
import UserTableSkeleton from '../../components/molecules/UserTableSkeleton';
import UserDetailsModal from '../../components/organisms/UserDetailsModal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { isSekretaris } from '../../utils/roles';

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

const CustomRadioButton = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-gray-600 hover:text-[#004A9C] transition-colors whitespace-nowrap">
      <input
        type="radio"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${checked ? 'border-[#004A9C] bg-[#004A9C]/5' : 'border-gray-300'}`}>
        {checked && <div className="w-2.5 h-2.5 rounded-full bg-[#004A9C]" />}
      </div>
      <span>{label}</span>
    </label>
  );
};

export default function UserManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { api, user } = useAuth();
  const socket = useSocket();
  const canEdit = isSekretaris(user?.role);
  const highlightRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('anggota'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState(null);
  
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterJabatan, setFilterJabatan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [showRadioFilters, setShowRadioFilters] = useState(false);
  
  
  const [anggotaData, setAnggotaData] = useState([]);
  const [pengurusData, setPengurusData] = useState([]);

  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReviewKeluarModalOpen, setIsReviewKeluarModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const actualApproveKeluar = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/user/anggota/approve-keluar', { anggota_id: selectedUser.anggota_id });
      if (response.data.success) {
        setStatusModal({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: 'Anggota telah resmi keluar dari koperasi.'
        });
        setIsReviewKeluarModalOpen(false);
        setConfirmModal({ ...confirmModal, isOpen: false });
        fetchData();
        if (socket) {
          socket.emit('user:updated');
          socket.emit('dashboardUpdate');
        }
      }
    } catch (error) {
      setConfirmModal({ ...confirmModal, isOpen: false });
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan sistem.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveKeluar = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Pengunduran Diri',
      message: `Apakah Anda yakin ingin menyetujui pengunduran diri ${selectedUser?.anggota?.nama_lengkap}? Akun anggota ini akan dinonaktifkan secara permanen.`,
      onConfirm: actualApproveKeluar
    });
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const endpoints = ['/user/anggota', '/user/pengurus'];
      const [resAnggota, resPengurus] = await Promise.all(endpoints.map(e => api.get(e)));
      
      if (resAnggota.data.success) setAnggotaData(resAnggota.data.data);
      if (resPengurus.data.success) setPengurusData(resPengurus.data.data);
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
    if (isLoading) return;
    
    const highlightId = searchParams.get('highlight');
    const reviewKeluarId = searchParams.get('review_keluar');
    
    if ((highlightId || reviewKeluarId) && anggotaData.length > 0) {
      const targetId = parseInt(highlightId || reviewKeluarId);
      
      
      setActiveTab('anggota');
      
      
      const allData = anggotaData;
      const targetIndex = allData.findIndex(a => a.anggota_id === targetId);
      
      if (targetIndex >= 0) {
        const targetPage = Math.floor(targetIndex / itemsPerPage) + 1;
        setCurrentPage(targetPage);
        setHighlightedId(targetId);
        
        
        setTimeout(() => {
          const targetUser = allData[targetIndex];
          if (targetUser) {
            setSelectedUser(targetUser);
            if (reviewKeluarId && targetUser.status_keanggotaan === 'Pending_Keluar' && canEdit) {
              setIsReviewKeluarModalOpen(true);
            } else {
              setIsDetailsModalOpen(true);
            }
          }
        }, 800);
        
        
        setTimeout(() => {
          setHighlightedId(null);
        }, 5000);
      }
      
      
      setSearchParams({}, { replace: true });
    }
  }, [isLoading, searchParams, anggotaData, canEdit]);

  
  useEffect(() => {
    if (highlightedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedId]);

  
  useEffect(() => {
    if (!socket) return;

    const handleCreated = (data) => {
      console.log('📥 WebSocket Received user:created:', data);
      const normalizedType = data?.type?.toLowerCase();
      
      if (normalizedType === 'anggota') {
        setAnggotaData(prev => [data.user, ...prev]);
      } else if (normalizedType === 'pengurus') {
        setPengurusData(prev => [data.user, ...prev]);
      }
    };

    const handleUpdated = (data) => {
      console.log('📥 WebSocket Received user:updated:', data);
      const normalizedType = data?.type?.toLowerCase();

      if (normalizedType === 'anggota') {
        setAnggotaData(prev => prev.map(u => u.anggota_id == data.id ? { ...u, ...data.data } : u));
      } else if (normalizedType === 'pengurus') {
        setPengurusData(prev => prev.map(u => u.pengurus_id == data.id ? { ...u, ...data.data } : u));
      }
    };

    const handleDeleted = (data) => {
      console.log('📥 WebSocket Received user:deleted:', data);
      const { type, id } = data;
      const normalizedType = type?.toLowerCase();

      if (normalizedType === 'anggota') {
        setAnggotaData(prev => prev.filter(u => String(u.anggota_id) !== String(id)));
      } else if (normalizedType === 'pengurus') {
        setPengurusData(prev => prev.filter(u => String(u.pengurus_id) !== String(id)));
      }
    };

    socket.on('user:created', handleCreated);
    socket.on('user:updated', handleUpdated);
    socket.on('user:deleted', handleDeleted);

    return () => {
      socket.off('user:created', handleCreated);
      socket.off('user:updated', handleUpdated);
      socket.off('user:deleted', handleDeleted);
    };
  }, [socket]);

  const filteredData = useMemo(() => {
    const data = activeTab === 'anggota' ? anggotaData : pengurusData;
    const query = searchQuery.toLowerCase();
    
    return data.filter(item => {
      const matchesSearch = activeTab === 'anggota' 
        ? (
            (item.nama_lengkap || '').toLowerCase().includes(query) ||
            (item.no_anggota || '').toLowerCase().includes(query) ||
            (item.user?.email || '').toLowerCase().includes(query)
          )
        : (
            (item.nama_lengkap || '').toLowerCase().includes(query) ||
            (item.user?.email || '').toLowerCase().includes(query) ||
            (item.no_hp || '').toLowerCase().includes(query)
          );

      if (!matchesSearch) return false;

      if (activeTab === 'anggota') {
        const dateStr = item.tanggal_bergabung || item.tanggal_registrasi;
        if (dateStr) {
          const d = new Date(dateStr);
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const y = String(d.getFullYear());
          if (filterMonth !== 'all' && m !== filterMonth) return false;
          if (filterYear !== 'all' && y !== filterYear) return false;
        } else {
          if (filterMonth !== 'all' || filterYear !== 'all') return false;
        }

        if (filterJabatan !== 'all' && item.jabatan !== filterJabatan) return false;

        if (filterStatus !== 'all' && item.status_keanggotaan !== filterStatus) return false;
      } else {
        if (filterRole !== 'all' && item.jabatan !== filterRole) return false;
      }

      return true;
    });
  }, [activeTab, anggotaData, pengurusData, searchQuery, filterMonth, filterYear, filterJabatan, filterStatus, filterRole]);

  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setFilterMonth('all');
    setFilterYear('all');
    setFilterJabatan('all');
    setFilterStatus('all');
    setFilterRole('all');
    setShowRadioFilters(false);
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterMonth, filterYear, filterJabatan, filterStatus, filterRole]);

  const handleDetailsClick = (user) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const type = activeTab;
      const id = activeTab === 'anggota' ? selectedUser.anggota_id : selectedUser.pengurus_id;
      await api.delete(`/user/${type}/${id}`);
      setIsDeleteModalOpen(false);
      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'Berhasil Dihapus',
        message: `Akun ${selectedUser?.nama_lengkap} beserta data otentikasinya telah dihapus permanen.`,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      setIsDeleteModalOpen(false);
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menghapus',
        message: error.response?.data?.message || 'Terjadi kesalahan sistem saat menghapus data user.',
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const tabVariants = {
    initial: { opacity: 0, x: 10 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -10, transition: { duration: 0.2 } }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const Pagination = () => {
    if (filteredData.length === 0) return null;

    return (
      <div className="p-8 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between bg-gray-50/20 gap-4">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest order-2 sm:order-1">
           Menampilkan <span className="text-[#004A9C]">{Math.min(filteredData.length, (currentPage-1)*itemsPerPage + 1)} - {Math.min(filteredData.length, currentPage*itemsPerPage)}</span> dari {filteredData.length} User
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
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-900/5 relative overflow-hidden">
        {}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#DFEAF4] rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#004A9C]/5 rounded-full -ml-24 -mb-24 opacity-40 blur-3xl"></div>
        
        <div className="space-y-3 relative z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#DFEAF4] text-[#004A9C] rounded-full text-xs font-bold uppercase tracking-widest"
          >
            <Users size={14} />
            <span>Manajemen</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Manajemen <span className="text-[#004A9C]">Users</span></h2>
          <p className="text-gray-500 text-lg font-medium">Database anggota & pengurus aktif koperasi.</p>
        </div>
        
        {canEdit && (
          <div className="relative z-10 shrink-0">
            <Button 
              onClick={() => navigate('/admin/users/tambah')}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl shadow-lg shadow-[#004A9C]/20 hover:scale-105 transition-all bg-[#004A9C] text-white"
            >
              <FaUserPlus size={22} />
              <span className="font-bold text-lg">Tambah Akun</span>
            </Button>
          </div>
        )}
      </div>

      {}
      {}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 flex items-center">
        <div className="flex p-1.5 bg-gray-50 rounded-2xl w-full overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('anggota')}
            className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'anggota' 
              ? 'bg-[#004A9C] text-white shadow-lg shadow-blue-900/20' 
              : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            <FaUsers size={16} />
            <span>Daftar Anggota</span>
          </button>
          <button
            onClick={() => setActiveTab('pengurus')}
            className={`px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'pengurus' 
              ? 'bg-[#004A9C] text-white shadow-lg shadow-blue-900/20' 
              : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            <FaShieldAlt size={16} />
            <span>Daftar Pengurus</span>
          </button>
        </div>
      </div>

      {}
      {activeTab === 'anggota' ? (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-5">
          {/* Search Input Row with Toggle Filter Button */}
          <div className="flex gap-3 items-center w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama, email, atau ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none text-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button
              onClick={() => setShowRadioFilters(!showRadioFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                showRadioFilters 
                ? 'bg-[#004A9C] border-[#004A9C] text-white shadow-md shadow-[#004A9C]/25' 
                : 'bg-white border-gray-200 text-gray-500 hover:text-[#004A9C] hover:border-[#004A9C] hover:bg-gray-50'
              }`}
            >
              <Filter size={16} />
              <span>Filter</span>
            </button>
          </div>

          {/* Custom Radio Filters */}
          <AnimatePresence>
            {showRadioFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="space-y-4 pt-4 border-t border-gray-100 mt-2">
                  {/* Jabatan Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider w-28 shrink-0">Jabatan:</span>
                    <div className="flex flex-wrap items-center gap-4">
                      <CustomRadioButton
                        label="Semua Jabatan"
                        checked={filterJabatan === 'all'}
                        onChange={() => setFilterJabatan('all')}
                      />
                      <CustomRadioButton
                        label="Manager"
                        checked={filterJabatan === 'Manager'}
                        onChange={() => setFilterJabatan('Manager')}
                      />
                      <CustomRadioButton
                        label="Assistant Manager"
                        checked={filterJabatan === 'Assistant_Manager'}
                        onChange={() => setFilterJabatan('Assistant_Manager')}
                      />
                      <CustomRadioButton
                        label="Staff"
                        checked={filterJabatan === 'Staff'}
                        onChange={() => setFilterJabatan('Staff')}
                      />
                    </div>
                  </div>

                  {/* Status Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider w-28 shrink-0">Status:</span>
                    <div className="flex flex-wrap items-center gap-4">
                      <CustomRadioButton
                        label="Semua Status"
                        checked={filterStatus === 'all'}
                        onChange={() => setFilterStatus('all')}
                      />
                      <CustomRadioButton
                        label="Pending"
                        checked={filterStatus === 'Pending'}
                        onChange={() => setFilterStatus('Pending')}
                      />
                      <CustomRadioButton
                        label="Aktif"
                        checked={filterStatus === 'Aktif'}
                        onChange={() => setFilterStatus('Aktif')}
                      />
                      <CustomRadioButton
                        label="Pending Keluar"
                        checked={filterStatus === 'Pending_Keluar'}
                        onChange={() => setFilterStatus('Pending_Keluar')}
                      />
                      <CustomRadioButton
                        label="Keluar"
                        checked={filterStatus === 'Keluar'}
                        onChange={() => setFilterStatus('Keluar')}
                      />
                    </div>
                  </div>

                  {/* Bulan Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider w-28 shrink-0 mt-0.5">Bulan Masuk:</span>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <CustomRadioButton
                        label="Semua Bulan"
                        checked={filterMonth === 'all'}
                        onChange={() => setFilterMonth('all')}
                      />
                      {months.map((m, i) => {
                        const val = String(i + 1).padStart(2, "0");
                        return (
                          <CustomRadioButton
                            key={i}
                            label={m}
                            checked={filterMonth === val}
                            onChange={() => setFilterMonth(val)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Tahun Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider w-28 shrink-0">Tahun Masuk:</span>
                    <div className="flex flex-wrap items-center gap-4">
                      <CustomRadioButton
                        label="Semua Tahun"
                        checked={filterYear === 'all'}
                        onChange={() => setFilterYear('all')}
                      />
                      {Array.from(
                        { length: new Date().getFullYear() - 2024 + 2 },
                        (_, i) => 2024 + i,
                      )
                        .reverse()
                        .map((y) => (
                          <CustomRadioButton
                            key={y}
                            label={String(y)}
                            checked={filterYear === String(y)}
                            onChange={() => setFilterYear(String(y))}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama, email, atau HP..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none text-gray-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none cursor-pointer focus:ring-2 focus:ring-[#004A9C]/20 text-gray-700 min-w-[150px]"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">Semua Jabatan</option>
              <option value="Ketua">Ketua</option>
              <option value="Wakil_Ketua">Wakil Ketua</option>
              <option value="Sekretaris">Sekretaris</option>
              <option value="Bendahara">Bendahara</option>
              <option value="Koordinator_Simpan_Pinjam">Koordinator Simpan Pinjam</option>
            </select>
          </div>
        </div>
      )}

      {}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden min-h-[500px] flex flex-col">
        <div className="flex-1 overflow-x-auto">
          <AnimatePresence mode="wait">
            <motion.table 
              key={activeTab}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={tabVariants}
              className="w-full text-left border-collapse"
            >
              <thead>
                <tr className="bg-gray-50/80 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-100">
                  {activeTab === 'anggota' ? (
                    <>
                      <th className="py-5 px-8">No. Anggota</th>
                      <th className="py-5 px-8">Profil & Akun</th>
                      <th className="py-5 px-8">Unit & Jabatan</th>
                      <th className="py-5 px-8">Status</th>
                      <th className="py-5 px-8">Tanggal Bergabung</th>
                      <th className="py-5 px-8 text-right">Manajemen</th>
                    </>
                  ) : (
                    <>
                      <th className="py-5 px-8">Biodata Lengkap</th>
                      <th className="py-5 px-8">Role</th>
                      <th className="py-5 px-8">Kontak</th>
                      <th className="py-5 px-8 text-right">Manajemen</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={activeTab === 'anggota' ? 6 : 4}>
                      <UserTableSkeleton rows={8} columns={activeTab === 'anggota' ? 6 : 4} />
                    </td>
                  </tr>
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((item) => {
                    const isHighlighted = activeTab === 'anggota' && item.anggota_id === highlightedId;
                    return (
                      <motion.tr 
                        key={activeTab === 'anggota' ? item.anggota_id : item.pengurus_id}
                        ref={isHighlighted ? highlightRef : null}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: 1,
                          backgroundColor: isHighlighted ? ['rgba(0,74,156,0.15)', 'rgba(0,74,156,0.05)', 'rgba(0,74,156,0.15)'] : 'rgba(0,0,0,0)',
                        }}
                        transition={isHighlighted ? { 
                          backgroundColor: { repeat: Infinity, duration: 1.5 }
                        } : {}}
                        className={`hover:bg-[#DFEAF4]/20 transition-all duration-300 group ${isHighlighted ? 'ring-2 ring-[#004A9C]/30 ring-inset rounded-lg' : ''}`}
                      >
                        {activeTab === 'anggota' ? (
                          <>
                            <td className="py-5 px-8">
                               <div className="flex flex-col">
                                  <span className={`text-xs font-mono font-bold ${item.no_anggota ? 'text-[#004A9C]' : 'text-gray-300'}`}>
                                     {item.no_anggota || 'PROSES...'}
                                  </span>
                               </div>
                            </td>
                            <td className="py-5 px-8">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-white flex items-center justify-center text-[#004A9C] font-bold text-sm shadow-sm">
                                  {item.nama_lengkap?.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-800 tracking-tight">{item.nama_lengkap}</span>
                                  <span className="text-[11px] text-gray-400 font-medium">{item.user?.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-8">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-600">{item.divisi}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 font-mono">{item.jabatan?.replace(/_/g, ' ')}</span>
                              </div>
                            </td>
                            <td className="py-5 px-8">
                              <StatusBadge status={item.status_keanggotaan} />
                            </td>
                            <td className="py-5 px-8 font-medium text-[11px] text-gray-500 italic">
                               {item.tanggal_bergabung ? formatDate(item.tanggal_bergabung) : formatDate(item.tanggal_registrasi)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-5 px-8">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#004A9C] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                                  {item.nama_lengkap?.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-800">{item.nama_lengkap}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-8">
                               <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-[#004A9C]/10 flex items-center justify-center text-[#004A9C] shrink-0">
                                     <FaShieldAlt size={14} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-700">{item.jabatan}</span>
                                  </div>
                               </div>
                            </td>
                            <td className="py-5 px-8">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium italic">
                                  <Mail size={12} className="text-[#004A9C]/40" />
                                  {item.user?.email}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium italic">
                                  <Phone size={12} className="text-[#004A9C]/40" />
                                  {item.no_hp || 'No HP Belum Diisi'}
                                </div>
                              </div>
                            </td>
                          </>
                        )}
                        <td className="py-5 px-8 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleDetailsClick(item)}
                              className="p-2.5 text-gray-400 hover:text-[#004A9C] hover:bg-[#DFEAF4] rounded-xl transition-all"
                              title="Detail Lengkap"
                            >
                              <BiShow size={22} />
                            </button>

                            {activeTab === 'anggota' && item.status_keanggotaan === 'Pending_Keluar' && canEdit && (
                              <button 
                                onClick={() => {
                                  setSelectedUser(item);
                                  setIsReviewKeluarModalOpen(true);
                                }}
                                className="p-2.5 text-[#F2994A] bg-[#F2994A]/10 hover:bg-[#F2994A] hover:text-white rounded-xl transition-all animate-pulse"
                                title="Review Pengajuan Keluar"
                              >
                                <LogOut size={20} />
                              </button>
                            )}

                            {canEdit && (
                              <>
                                <button 
                                  onClick={() => navigate(`/admin/users/edit/${activeTab}/${activeTab === 'anggota' ? item.anggota_id : item.pengurus_id}`)}
                                  className="p-2.5 text-gray-400 hover:text-[#F2994A] hover:bg-[#F2994A]/10 rounded-xl transition-all" 
                                  title="Edit Akun"
                                >
                                  <BiEditAlt size={22} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteClick(item)}
                                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" 
                                  title="Hapus Akun"
                                >
                                  <BiTrashAlt size={22} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={activeTab === 'anggota' ? 6 : 4} className="py-24 text-center bg-gray-50/20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-inner flex items-center justify-center text-gray-100 italic">
                          <FaUsers size={40} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Data Tidak Ditemukan</p>
                          <p className="text-xs text-gray-300 italic">Coba gunakan parameter pencarian yang berbeda.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </motion.table>
          </AnimatePresence>
        </div>

        {}
        {!isLoading && paginatedData.length > 0 && <Pagination />}
      </div>

      {}
      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        user={selectedUser}
        type={activeTab}
      />

      {}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Data User"
        message={`Apakah Anda yakin ingin menghapus "${selectedUser?.nama_lengkap}"? Tindakan ini permanen dan menghapus akun login-nya.`}
        type="error"
        confirmText="Hapus Permanen"
        onConfirm={confirmDelete}
      />

      {}
      <Modal
        isOpen={isReviewKeluarModalOpen}
        onClose={() => setIsReviewKeluarModalOpen(false)}
        title="Review Pengajuan Keluar"
        maxWidth="max-w-md"
      >
        <div className="space-y-6 pt-2">
          <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
              <LogOut size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Pengajuan Pengunduran Diri</p>
              <h4 className="font-bold text-gray-900">{selectedUser?.nama_lengkap}</h4>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Alasan Keluar</label>
            <div className="p-4 bg-gray-50 rounded-2xl text-sm text-gray-700 italic border border-gray-100">
              "{selectedUser?.alasan_keluar || 'Tidak ada alasan yang dicantumkan.'}"
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
             <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm shrink-0 h-fit"><Info size={16} /></div>
             <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
               Dengan menyetujui, status anggota akan berubah menjadi "Keluar". Anggota tetap bisa login namun hanya diarahkan ke halaman konfirmasi keluar.
             </p>
          </div>

          <Button 
            onClick={handleApproveKeluar}
            isLoading={isLoading}
            className="w-full !py-4 shadow-xl shadow-blue-900/20"
          >
            Terima Pengajuan Keluar
          </Button>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.title}
        message={confirmModal.message}
        type="warning"
        confirmText="Ya, Setujui"
        onConfirm={confirmModal.onConfirm}
        isLoading={isLoading}
        maxWidth="max-w-md"
      />

      {}
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
