import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Info, 
  ChevronRight,
  BookOpen,
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
    <div className="space-y-8">
      {/* Hero Head */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#DFEAF4] text-[#004A9C] rounded-full text-sm font-bold uppercase tracking-widest mb-2"
        >
          <BookOpen size={16} />
          <span>Panduan Anggota</span>
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
          Ketentuan & <span className="text-[#004A9C]">Aturan Koperasi</span>
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed">
          Pelajari seluruh kebijakan simpan pinjam dan hak keanggotaan Anda di Koperasi Karyawan Nichias Sunijaya.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 flex flex-col md:flex-row gap-4 items-center">
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
        <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
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

      {/* Grid Rules */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
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
                  className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col relative overflow-hidden"
                >
                  {/* Decorative background element */}
                  <div className={`absolute top-0 right-0 w-32 h-32 ${rule.icon_bg_color || 'bg-blue-50'} rounded-full -mr-16 -mt-16 opacity-20 group-hover:scale-150 transition-transform duration-500`}></div>
                  
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <div className={`w-14 h-14 ${rule.icon_bg_color || 'bg-blue-50'} ${rule.icon_color || 'text-blue-600'} rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm`}>
                      <Icon size={28} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium bg-gray-50 px-2.5 py-1 rounded-full">
                      <Clock size={10} />
                      <span>{formatDate(rule.updated_at)}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#004A9C] transition-colors">{rule.judul}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1">
                    {rule.deskripsi}
                  </p>

                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between relative z-10">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Ketentuan Utama</span>
                      <span className="text-lg font-black text-[#004A9C] group-hover:scale-110 origin-left transition-transform block">{rule.ketentuan_utama}</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/koperasi-rules/${rule.peraturan_id}`)}
                      className="bg-[#004A9C] text-white p-3 rounded-xl transition-all hover:scale-110 shadow-lg shadow-blue-900/10 cursor-pointer"
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
          className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 p-20 text-center"
        >
          <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={40} className="text-gray-200" />
          </div>
          <h3 className="text-2xl font-black text-gray-800">Tidak ada kebijakan ditemukan</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">Kami tidak dapat menemukan apa yang Anda cari. Coba ubah kata kunci atau kategori pencarian.</p>
          <button 
            onClick={() => { setSearchQuery(''); setActiveCategory('Semua'); }}
            className="mt-8 text-[#004A9C] font-black hover:underline tracking-tight"
          >
            RESET SEMUA FILTER
          </button>
        </motion.div>
      )}

      {/* Help Section */}
      <motion.div 
        variants={itemVariants} 
        className="bg-gradient-to-br from-[#004A9C] to-[#0d4c9e] rounded-[2.5rem] p-10 md:p-12 text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shadow-2xl shadow-blue-900/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl text-gray-800"></div>
        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-xl shrink-0 border border-white/10">
          <Info size={40} className="text-white" />
        </div>
        <div className="flex-1 text-center md:text-left relative z-10">
          <h4 className="text-2xl font-black mb-2">Punya pertanyaan mendalam?</h4>
          <p className="text-white/80 text-lg font-medium">Tim pengurus kami siap membantu menjelaskan setiap poin kebijakan melalui sesi tanya jawab langsung.</p>
        </div>
        <Button className="shrink-0 bg-white text-[#004A9C] hover:bg-gray-50 px-10 py-4 text-lg font-black shadow-xl relative z-10">
          Hubungi Admin
        </Button>
      </motion.div>
    </div>
  );
}
