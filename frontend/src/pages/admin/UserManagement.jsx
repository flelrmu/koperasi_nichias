import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Mail, 
  Phone,
  Search,
  Settings
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

export default function UserManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { api, user } = useAuth();
  const socket = useSocket();
  const canEdit = isSekretaris(user?.role);
  const highlightRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('anggota'); // 'anggota' or 'pengurus'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState(null);
  
  // Data states
  const [anggotaData, setAnggotaData] = useState([]);
  const [pengurusData, setPengurusData] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

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

  // Handle highlight from notification link (?highlight=<anggota_id>)
  useEffect(() => {
    if (isLoading) return;
    
    const highlightId = searchParams.get('highlight');
    if (highlightId && anggotaData.length > 0) {
      const targetId = parseInt(highlightId);
      
      // Make sure we're on anggota tab
      setActiveTab('anggota');
      
      // Find the page where this anggota is located
      const allData = anggotaData;
      const targetIndex = allData.findIndex(a => a.anggota_id === targetId);
      
      if (targetIndex >= 0) {
        const targetPage = Math.floor(targetIndex / itemsPerPage) + 1;
        setCurrentPage(targetPage);
        setHighlightedId(targetId);
        
        // Auto-open detail modal after a brief delay
        setTimeout(() => {
          const targetUser = allData[targetIndex];
          if (targetUser) {
            setSelectedUser(targetUser);
            setIsDetailsModalOpen(true);
          }
        }, 800);
        
        // Clear highlight after 5 seconds
        setTimeout(() => {
          setHighlightedId(null);
        }, 5000);
      }
      
      // Clean up the URL
      setSearchParams({}, { replace: true });
    }
  }, [isLoading, searchParams, anggotaData]);

  // Scroll to highlighted row
  useEffect(() => {
    if (highlightedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedId]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleCreated = (data) => {
      console.log('📥 WebSocket Received user:created:', data);
      const normalizedType = data.type?.toLowerCase();
      
      if (normalizedType === 'anggota') {
        setAnggotaData(prev => [data.user, ...prev]);
      } else if (normalizedType === 'pengurus') {
        setPengurusData(prev => [data.user, ...prev]);
      }
    };

    const handleUpdated = (data) => {
      console.log('📥 WebSocket Received user:updated:', data);
      const normalizedType = data.type?.toLowerCase();

      if (normalizedType === 'anggota') {
        setAnggotaData(prev => prev.map(u => u.anggota_id == data.id ? { ...u, ...data.data } : u));
      } else if (normalizedType === 'pengurus') {
        setPengurusData(prev => prev.map(u => u.pengurus_id == data.id ? { ...u, ...data.data } : u));
      }
    };

    const handleDeleted = (data) => {
      console.log('📥 WebSocket Received user:deleted:', data);
      const normalizedType = data.type?.toLowerCase();

      if (normalizedType === 'anggota') {
        setAnggotaData(prev => prev.filter(u => u.anggota_id != data.id));
      } else if (normalizedType === 'pengurus') {
        setPengurusData(prev => prev.filter(u => u.pengurus_id != data.id));
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
    return data.filter(item => 
      (item.nama_lengkap || '').toLowerCase().includes(query) ||
      (item.no_anggota || '').toLowerCase().includes(query) ||
      (item.user?.email || '').toLowerCase().includes(query)
    );
  }, [activeTab, anggotaData, pengurusData, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

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
      {/* Premium Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-900/5 relative overflow-hidden">
        {/* Decorative background blurs */}
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

      {/* Tabs and Search Section */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="flex p-1.5 bg-gray-50 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
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

        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#004A9C] transition-colors" size={20} />
          <input
            type="text"
            placeholder="Cari nama, email, atau ID..."
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#004A9C]/20 transition-all font-medium text-sm placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table Container */}
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

        {/* Footer Features */}
        {!isLoading && paginatedData.length > 0 && <Pagination />}
      </div>

      {/* Details Modal */}
      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        user={selectedUser}
        type={activeTab}
      />

      {/* Delete Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Hapus Data User"
        message={`Apakah Anda yakin ingin menghapus "${selectedUser?.nama_lengkap}"? Tindakan ini permanen dan menghapus akun login-nya.`}
        type="error"
        confirmText="Hapus Permanen"
        onConfirm={confirmDelete}
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
