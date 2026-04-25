import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Info, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Loader2,
  Clock
} from 'lucide-react';
import Button from '../components/atoms/Button';
import { getIconComponent } from '../utils/iconMap';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function KoperasiRules() {
  const navigate = useNavigate();
  const { api } = useAuth();
  const socket = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [peraturanList, setPeraturanList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['Semua', 'Simpanan', 'Pinjaman', 'Keanggotaan'];

  useEffect(() => {
    const fetchPeraturan = async () => {
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
    fetchPeraturan();
  }, []);

  // WebSocket real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleCreated = (payload) => {
      setPeraturanList(prev => [payload.data, ...prev]);
    };
    const handleUpdated = (payload) => {
      setPeraturanList(prev => prev.map(p => p.peraturan_id === payload.id ? payload.data : p));
    };
    const handleDeleted = (payload) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
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
          <h2 className="text-2xl font-bold text-[#004A9C]">Peraturan Koperasi</h2>
          <p className="text-gray-500 mt-1">Informasi lengkap mengenai kebijakan simpan pinjam dan keanggotaan.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <ExternalLink size={18} />
            <span>Unduh PDF</span>
          </Button>
          <Button className="flex items-center gap-2">
            <HelpCircle size={18} />
            <span>Pusat Bantuan</span>
          </Button>
        </div>
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
          <div className="col-span-full flex items-center justify-center py-20">
            <Loader2 size={32} className="text-[#004A9C] animate-spin" />
          </div>
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
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium bg-gray-50 px-2.5 py-1 rounded-full">
                      <Clock size={10} />
                      <span>{formatDate(rule.updated_at)}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{rule.judul}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">
                    {rule.deskripsi}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Ketentuan Utama</span>
                      <span className="text-md font-bold text-[#004A9C]">{rule.ketentuan_utama}</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/koperasi-rules/${rule.peraturan_id}`)}
                      className="text-[#004A9C] hover:bg-[#DFEAF4] p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <ChevronRight size={20} />
                    </button>
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
          <button 
            onClick={() => { setSearchQuery(''); setActiveCategory('Semua'); }}
            className="mt-4 text-[#004A9C] font-semibold hover:underline"
          >
            Bersihkan semua filter
          </button>
        </motion.div>
      )}

      {/* Info Card */}
      <motion.div variants={itemVariants} className="bg-[#DFEAF4]/30 border border-[#004A9C]/10 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-[#004A9C] shadow-sm shrink-0">
          <Info size={32} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="font-bold text-gray-800 mb-1">Butuh bantuan lebih lanjut?</h4>
          <p className="text-gray-600 text-sm">Jika Anda memiliki pertanyaan khusus mengenai peraturan di atas, silakan hubungi pengurus koperasi melalui WhatsApp atau kunjungi kantor kami.</p>
        </div>
        <Button className="shrink-0 bg-[#004A9C] hover:bg-[#003d82]">
          Hubungi Admin
        </Button>
      </motion.div>
    </motion.div>
  );
}
