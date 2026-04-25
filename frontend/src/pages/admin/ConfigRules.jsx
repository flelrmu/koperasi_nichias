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
  Loader2
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gray-100 rounded-xl" />
        <div className="w-20 h-5 bg-gray-100 rounded-full" />
      </div>
      <div className="w-3/4 h-5 bg-gray-100 rounded mb-2" />
      <div className="w-full h-4 bg-gray-50 rounded mb-1" />
      <div className="w-2/3 h-4 bg-gray-50 rounded mb-6" />
      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
        <div>
          <div className="w-16 h-3 bg-gray-100 rounded mb-1" />
          <div className="w-24 h-5 bg-gray-100 rounded" />
        </div>
        <div className="w-10 h-10 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-[#004A9C]">Konfigurasi Peraturan</h2>
          <p className="text-gray-500 mt-1">Kelola kebijakan simpan pinjam dan keanggotaan koperasi.</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/admin/konfigurasi/tambah')}
              className="flex items-center gap-2"
            >
              <Plus size={18} />
              <span>Tambah Peraturan</span>
            </Button>
          </div>
        )}
      </div>

      {/* Filter & Search Section */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari peraturan..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004A9C]/20 focus:border-[#004A9C] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-xl overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === cat 
                ? 'bg-[#004A9C] text-white shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
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
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${rule.icon_bg_color || 'bg-blue-50'} ${rule.icon_color || 'text-blue-600'} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon size={24} />
                    </div>
                    {/* Tanggal terakhir diperbarui */}
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium bg-gray-50 px-2.5 py-1 rounded-full">
                      <Clock size={10} />
                      <span>{formatDate(rule.updated_at)}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{rule.judul}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                    {rule.deskripsi}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Ketentuan Utama</span>
                      <span className="text-md font-bold text-[#004A9C]">{rule.ketentuan_utama}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal({ isOpen: true, rule });
                          }}
                          className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          title="Hapus Peraturan"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      )}
                      <button 
                        onClick={() => navigate(`/admin/konfigurasi/${rule.peraturan_id}`)}
                        className="text-[#004A9C] hover:bg-[#DFEAF4] p-2.5 rounded-xl transition-all border border-[#004A9C]/10 hover:border-[#004A9C]/30 cursor-pointer flex items-center gap-1 group/btn"
                        title={canEdit ? "Ubah Konfigurasi" : "Lihat Detail"}
                      >
                        {canEdit ? (
                          <Settings size={18} className="group-hover/btn:rotate-90 transition-transform duration-500" />
                        ) : (
                          <Eye size={18} />
                        )}
                        <ChevronRight size={18} />
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
          className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center"
        >
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">Peraturan tidak ditemukan</h3>
          <p className="text-gray-500 mt-1">Coba gunakan kata kunci lain atau pilih kategori yang berbeda.</p>
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
    </motion.div>
  );
}
