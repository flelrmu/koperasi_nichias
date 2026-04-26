import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  Target, 
  ListChecks, 
  HelpCircle,
  Info,
  Loader2
} from 'lucide-react';
import Button from '../components/atoms/Button';
import { getIconComponent } from '../utils/iconMap';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function RuleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  
  const [rule, setRule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    const fetchRule = async () => {
      try {
        const res = await api.get(`/peraturan/${id}`);
        if (res.data.success) {
          setRule(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching peraturan:', error);
        setRule(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRule();
  }, [id, api]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdated = (payload) => {
      if (payload.id === parseInt(id)) {
        setRule(payload.data);
      }
    };

    socket.on('peraturan:updated', handleUpdated);
    return () => socket.off('peraturan:updated', handleUpdated);
  }, [socket, id]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="text-[#004A9C] animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Memuat data peraturan...</p>
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Info size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Peraturan Tidak Ditemukan</h2>
        <p className="text-gray-500 mt-2 max-w-sm">Maaf, peraturan yang Anda cari tidak tersedia atau telah dihapus.</p>
        <Button 
          onClick={() => navigate('/koperasi-rules')}
          className="mt-6 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          <span>Kembali ke List</span>
        </Button>
      </div>
    );
  }

  const Icon = getIconComponent(rule.icon_name);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const procedures = rule.prosedur || [];
  const conditions = rule.syarat_ketentuan || [];

  return (
    <motion.div 
      className="space-y-6 max-w-4xl mx-auto pb-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Navigation Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/koperasi-rules')}
          className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-[#004A9C] hover:bg-white hover:shadow-sm transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Detail Peraturan</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
            <span>{rule.kategori}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span className="text-[#004A9C] font-semibold">{rule.judul}</span>
          </div>
        </div>
      </motion.div>

      {/* Hero Section Card */}
      <motion.div variants={itemVariants} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-poppins">
        <div className="bg-gradient-to-r from-[#004A9C] to-[#4A90E2] p-8 sm:p-12 text-white relative">
          <div className="absolute right-[-5%] top-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
              <Icon size={40} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[11px] font-bold uppercase tracking-wider border border-white/20">
                  {rule.kategori}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{rule.judul}</h1>
              <p className="text-white/80 mt-2 text-lg max-w-2xl font-medium italic">"{rule.deskripsi}"</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center min-w-[180px]">
              <span className="text-white/60 text-xs font-bold uppercase tracking-widest block mb-1">Ketentuan Utama</span>
              <span className="text-2xl font-black">{rule.ketentuan_utama}</span>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-10">
            {/* Objective Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-[#004A9C]">
                <Target size={24} className="shrink-0" />
                <h3 className="text-lg font-bold uppercase tracking-wider">Tujuan Kebijakan</h3>
              </div>
              <p className="text-gray-600 leading-relaxed text-lg">
                {rule.tujuan}
              </p>
            </section>

            {/* Procedures Section */}
            {procedures.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-3 text-[#004A9C]">
                  <ListChecks size={24} className="shrink-0" />
                  <h3 className="text-lg font-bold uppercase tracking-wider">Prosedur Pengajuan</h3>
                </div>
                <div className="space-y-4">
                  {procedures.map((step, index) => (
                    <div key={index} className="flex gap-4 items-start bg-gray-50 p-5 rounded-2xl border border-gray-100 group hover:border-[#004A9C]/30 transition-colors">
                      <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-[#004A9C] shrink-0 shadow-sm">
                        {index + 1}
                      </span>
                      <p className="text-gray-700 font-medium pt-1">{step}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-8">
            {/* Conditions Section */}
            {conditions.length > 0 && (
              <section className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                 <div className="flex items-center gap-2 text-gray-800 mb-6">
                  <HelpCircle size={20} className="text-[#004A9C]" />
                  <h3 className="font-bold text-sm uppercase tracking-widest">Syarat & Ketentuan</h3>
                </div>
                <ul className="space-y-4">
                  {conditions.map((condition, index) => (
                    <li key={index} className="flex gap-3 text-sm text-gray-600 leading-relaxed items-start">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#004A9C] shrink-0"></div>
                      <span>{condition}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Metadata Section */}
            <section className="px-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-widest italic border-b border-gray-100 pb-2">
                <span>Update Terakhir</span>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formatDate(rule.updated_at)}</span>
                </div>
              </div>
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-start gap-3">
                 <Info size={16} className="text-[#004A9C] shrink-0 mt-0.5" />
                 <p className="text-[11px] text-[#004A9C]/80 font-medium leading-relaxed">
                   Peraturan ini bersifat dinamis sesuai dengan ketetapan Rapat Anggota Tahunan (RAT) terbaru.
                 </p>
              </div>
            </section>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-gray-50/50 p-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
           <div className="text-center sm:text-left">
              <p className="text-sm font-bold text-gray-800">Masih ragu dengan peraturan ini?</p>
              <p className="text-xs text-gray-500 mt-1">Konsultasikan langsung dengan Pengurus Koperasi Nichias.</p>
           </div>
           <div className="flex gap-3 w-full sm:w-auto">
              <Button variant="outline" className="flex-1 sm:flex-none">Download PDF</Button>
              <Button className="flex-1 sm:flex-none bg-[#004A9C] hover:bg-[#003B7A]">Tanya Admin</Button>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
