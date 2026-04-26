import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Settings,
  ChevronRight,
  Plus,
  Eye,
  Clock,
  Loader2,
  BookOpen
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Modal from '../../components/molecules/Modal';
import { getIconComponent } from '../../utils/iconMap';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { isSekretaris } from '../../utils/roles';

export default function ConfigRules() {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const socket = useSocket();
  const canEdit = isSekretaris(user?.role);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [peraturanList, setPeraturanList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, rule: null });
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const categories = ['Semua', 'Simpanan', 'Pinjaman', 'Keanggotaan'];

  // Fetch data from API
  const fetchPeraturan = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/peraturan');
      if (res.data.success) {
        setPeraturanList(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching peraturan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeraturan();
  }, []);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleCreated = (payload) => {
      console.log('📥 peraturan:created', payload);
      setPeraturanList(prev => [payload.data, ...prev]);
    };

    const handleUpdated = (payload) => {
      console.log('📥 peraturan:updated', payload);
      setPeraturanList(prev => 
        prev.map(p => p.peraturan_id === payload.id ? payload.data : p)
      );
    };

    const handleDeleted = (payload) => {
      console.log('📥 peraturan:deleted', payload);
      setPeraturanList(prev => prev.filter(p => p.peraturan_id !== payload.id));
    };

    socket.on('peraturan:created', handleCreated);
    socket.on('peraturan:updated', handleUpdated);
    socket.on('peraturan:deleted', handleDeleted);

    return () => {
      socket.off('peraturan:created', handleCreated);
      socket.off('peraturan:updated', handleUpdated);
      socket.off('peraturan:deleted', handleDeleted);
    };
  }, [socket]);

  const filteredRules = useMemo(() => {
    return peraturanList.filter(rule => {
      const matchesSearch = (rule.judul || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (rule.deskripsi || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Semua' || rule.kategori === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [peraturanList, searchQuery, activeCategory]);

  const handleDelete = async () => {
    if (!deleteModal.rule) return;
    try {
      await api.delete(`/peraturan/${deleteModal.rule.peraturan_id}`);
      setDeleteModal({ isOpen: false, rule: null });
      setStatusModal({
        isOpen: true,
        type: 'success',
        title: 'Berhasil Dihapus',
        message: `Peraturan "${deleteModal.rule.judul}" telah dihapus.`,
      });
    } catch (error) {
      console.error('Error deleting peraturan:', error);
      setDeleteModal({ isOpen: false, rule: null });
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menghapus',
        message: error.response?.data?.message || 'Terjadi kesalahan saat menghapus peraturan.',
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  // Loading Skeleton
  const CardSkeleton = () => (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 animate-pulse flex flex-col">
      <div className="flex items-start justify-between mb-8">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl" />
        <div className="w-20 h-6 bg-gray-100 rounded-full" />
      </div>
      <div className="w-3/4 h-6 bg-gray-100 rounded mb-4" />
      <div className="w-full h-4 bg-gray-50 rounded mb-2" />
      <div className="w-2/3 h-4 bg-gray-50 rounded mb-8" />
      <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
        <div>
          <div className="w-20 h-3 bg-gray-100 rounded mb-2" />
          <div className="w-24 h-6 bg-gray-100 rounded" />
        </div>
        <div className="w-12 h-12 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-blue-900/5 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#DFEAF4] rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
        
        <div className="space-y-3 relative z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#DFEAF4] text-[#004A9C] rounded-full text-xs font-bold uppercase tracking-widest"
          >
            <Settings size={14} />
            <span>Manajemen</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Konfigurasi <span className="text-[#004A9C]">Peraturan</span></h2>
          <p className="text-gray-500 text-lg">Kelola kebijakan simpan pinjam dan keanggotaan koperasi.</p>
        </div>
        
        {canEdit && (
          <div className="relative z-10 shrink-0">
            <Button 
              onClick={() => navigate('/admin/konfigurasi/tambah')}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl shadow-lg shadow-[#004A9C]/20 hover:scale-105 transition-all bg-[#004A9C] text-white"
            >
              <Plus size={22} />
              <span className="font-bold text-lg">Tambah Peraturan</span>
            </Button>
          </div>
        )}
      </div>

      {/* Filter & Search Section */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari peraturan atau kebijakan..."
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#004A9C]/20 transition-all font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeCategory === cat 
                ? 'bg-[#004A9C] text-white shadow-lg shadow-blue-900/20' 
                : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {isLoading ? (
          <>
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
          </>
        ) : (
          <AnimatePresence mode='popLayout'>
            {filteredRules.map((rule) => {
              const Icon = getIconComponent(rule.icon_name);
              return (
                <motion.div
                  key={rule.peraturan_id}
                  layout
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col relative overflow-hidden"
                >
                  {/* Decorative background element */}
                  <div className={`absolute top-0 right-0 w-32 h-32 ${rule.icon_bg_color || 'bg-blue-50'} rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-150 transition-transform duration-500`}></div>

                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className={`w-14 h-14 ${rule.icon_bg_color || 'bg-blue-50'} ${rule.icon_color || 'text-blue-600'} rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm`}>
                      <Icon size={28} />
                    </div>
                    {/* Tanggal terakhir diperbarui */}
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium bg-gray-50 px-2.5 py-1 rounded-full">
                      <Clock size={10} />
                      <span>{formatDate(rule.updated_at)}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#004A9C] transition-colors">{rule.judul}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1 line-clamp-3">
                    {rule.deskripsi}
                  </p>

                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between relative z-10">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Ketentuan Utama</span>
                      <span className="text-lg font-black text-[#004A9C] group-hover:scale-110 origin-left transition-transform block">{rule.ketentuan_utama}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal({ isOpen: true, rule });
                          }}
                          className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-3 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-gray-100 hover:border-red-100"
                          title="Hapus Peraturan"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      )}
                      <button 
                        onClick={() => navigate(`/admin/konfigurasi/${rule.peraturan_id}`)}
                        className="bg-[#004A9C] text-white p-3 rounded-xl transition-all hover:scale-110 shadow-lg shadow-blue-900/10 cursor-pointer flex items-center justify-center group/btn"
                        title={canEdit ? "Ubah Konfigurasi" : "Lihat Detail"}
                      >
                        {canEdit ? (
                          <Settings size={20} className="group-hover/btn:rotate-90 transition-transform duration-500" />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Empty State */}
      {!isLoading && filteredRules.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 p-20 text-center"
        >
          <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={40} className="text-gray-200" />
          </div>
          <h3 className="text-2xl font-black text-gray-800">Tidak ada kebijakan ditemukan</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">Coba ubah kata kunci atau kategori pencarian.</p>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, rule: null })}
        title="Hapus Peraturan"
        message={`Apakah Anda yakin ingin menghapus peraturan "${deleteModal.rule?.judul}"? Tindakan ini tidak dapat dibatalkan.`}
        type="error"
        confirmText="Hapus Permanen"
        onConfirm={handleDelete}
      />

      {/* Status Modal */}
      <Modal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        confirmText="Tutup"
      />
    </div>
  );
}
