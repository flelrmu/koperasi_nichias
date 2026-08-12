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
  ShieldAlert,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import Button from '../components/atoms/Button';
import { getIconComponent } from '../utils/iconMap';
import { useSocket } from '../context/SocketContext';

const API_URL = 'http://localhost:5000/api';

export default function GuestRuleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [rule, setRule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    const fetchRule = async () => {
      try {
        const res = await axios.get(`${API_URL}/peraturan/${id}`);
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
  }, [id]);

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
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 size={40} className="text-[#004A9C] animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Memuat data peraturan...</p>
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-12 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-red-900/5">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner tracking-tight">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-3xl font-black text-gray-900">Kebijakan Tidak Ditemukan</h2>
        <p className="text-gray-500 mt-3 max-w-sm text-lg font-medium">Maaf, peraturan yang Anda cari tidak tersedia dalam database publik kami.</p>
        <Button 
          onClick={() => navigate('/rules')}
          className="mt-10 flex items-center gap-3 bg-[#004A9C] px-8 py-4 rounded-2xl"
        >
          <ArrowLeft size={20} />
          <span className="font-bold">Kembali ke Panduan</span>
        </Button>
      </div>
    );
  }

  const Icon = getIconComponent(rule.icon_name);
  const procedures = rule.prosedur || [];
  const conditions = rule.syarat_ketentuan || [];

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

  return (
    <motion.div 
      className="space-y-12 max-w-5xl mx-auto pb-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {}
      <motion.div variants={itemVariants} className="relative rounded-[3rem] overflow-hidden bg-white shadow-2xl shadow-blue-900/5 border border-gray-100">
        <div className={`h-4 w-full ${rule.icon_bg_color || 'bg-blue-50'} opacity-50`}></div>
        <div className="p-8 md:p-14 flex flex-col md:flex-row items-center gap-10">
          <div className={`w-32 h-32 ${rule.icon_bg_color || 'bg-blue-50'} ${rule.icon_color || 'text-blue-600'} rounded-[2rem] flex items-center justify-center shadow-xl shrink-0 rotate-3 group-hover:rotate-0 transition-transform duration-500`}>
            <Icon size={56} />
          </div>
          
          <div className="text-center md:text-left flex-1 space-y-4">
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 border border-gray-200">
                {rule.kategori}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">{rule.judul}</h1>
            <p className="text-xl text-gray-500 font-medium italic">"{rule.deskripsi}"</p>
          </div>

          <div className="bg-[#DFEAF4] p-8 rounded-[2.5rem] text-center min-w-[220px] shadow-inner border border-white/50">
            <span className="text-[#004A9C]/60 text-xs font-black uppercase tracking-widest block mb-1">Ketentuan Utama</span>
            <span className="text-3xl font-black text-[#004A9C]">{rule.ketentuan_utama}</span>
          </div>
        </div>
      </motion.div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-16">
          {}
          <section className="space-y-6">
            <div className="inline-flex items-center gap-4 text-[#004A9C] bg-[#DFEAF4] px-6 py-2.5 rounded-2xl">
              <Target size={28} className="shrink-0" />
              <h3 className="text-xl font-black uppercase tracking-wider">Tujuan Kebijakan</h3>
            </div>
            <p className="text-gray-600 leading-relaxed text-xl font-medium pl-2">
              {rule.tujuan}
            </p>
          </section>

          {}
          {procedures.length > 0 && (
            <section className="space-y-8">
              <div className="inline-flex items-center gap-4 text-[#004A9C] bg-[#DFEAF4] px-6 py-2.5 rounded-2xl">
                <ListChecks size={28} className="shrink-0" />
                <h3 className="text-xl font-black uppercase tracking-wider">Alur Pengajuan</h3>
              </div>
              <div className="space-y-6">
                {procedures.map((step, index) => (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    key={index} 
                    className="flex gap-6 items-start bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <span className="w-12 h-12 rounded-2xl bg-[#004A9C] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform">
                      {index + 1}
                    </span>
                    <p className="text-gray-700 font-bold text-lg pt-2 leading-snug">{step}</p>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
          {}
          {conditions.length > 0 && (
            <section className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-blue-900/5">
               <div className="flex items-center gap-3 text-gray-900 mb-8 border-b border-gray-50 pb-6">
                <HelpCircle size={24} className="text-[#004A9C]" />
                <h3 className="font-black text-sm uppercase tracking-[0.2em]">Syarat & Ketentuan</h3>
              </div>
              <ul className="space-y-6">
                {conditions.map((condition, index) => (
                  <li key={index} className="flex gap-4 text-gray-600 leading-relaxed items-start">
                    <div className="mt-2 w-2 h-2 rounded-full bg-[#004A9C] shrink-0 shadow-sm shadow-blue-900/40"></div>
                    <span className="font-title font-medium text-[15px]">{condition}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {}
          <section className="px-6 space-y-6">
            <div className="flex items-center justify-between text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] italic border-b border-gray-100 pb-3">
              <span>Terakhir Diperbarui</span>
              <div className="flex items-center gap-2">
                <Clock size={12} />
                <span>{formatDate(rule.updated_at)}</span>
              </div>
            </div>
            <div className="p-6 bg-blue-50/70 rounded-3xl border border-blue-100 flex items-start gap-4">
               <Info size={20} className="text-[#004A9C] shrink-0 mt-1" />
               <p className="text-xs text-[#004A9C] font-bold leading-relaxed">
                 Peraturan ini mengacu pada hasil Rapat Anggota Tahunan (RAT) dan dapat disesuaikan sewaktu-waktu sesuai kebijakan pengurus.
               </p>
            </div>
            <Button 
                onClick={() => navigate('/register')}
                className="w-full py-5 rounded-2xl bg-gray-900 hover:bg-black text-white font-black text-sm uppercase tracking-widest shadow-xl"
            >
                DAFTAR SEKARANG
            </Button>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
