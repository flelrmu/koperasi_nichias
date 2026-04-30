import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  LogOut, 
  Mail, 
  Download,
  Info,
  ShieldCheck
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import { useAuth } from '../../context/AuthContext';

const DashboardKeluar = () => {
  const { logout, user } = useAuth();

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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-poppins">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#DFEAF4] rounded-full blur-[120px] -mr-64 -mt-64 opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#004A9C]/5 rounded-full blur-[120px] -ml-64 -mb-64 opacity-60"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-3xl w-full space-y-8 relative z-10"
      >
        {/* Main Card */}
        <motion.div 
          variants={itemVariants}
          className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-2xl shadow-blue-900/5 text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-28 h-28 bg-green-50 text-green-500 rounded-[2.5rem] flex items-center justify-center shadow-inner relative z-10">
                <CheckCircle size={56} />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-green-100 rounded-[2.5rem] scale-110"
              ></motion.div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              Pengunduran Diri <span className="text-[#004A9C]">Selesai</span>
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed max-w-xl mx-auto">
              Halo <span className="font-bold text-gray-800">{user?.nama_lengkap}</span>, pengajuan pengunduran diri Anda telah disetujui sepenuhnya oleh pengurus koperasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-left space-y-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#004A9C] shadow-sm"><Info size={20} /></div>
              <h4 className="font-bold text-gray-800 text-sm">Status Keanggotaan</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Status Anda kini adalah <span className="font-bold text-red-600">Mantan Anggota</span>. Hak dan kewajiban Anda sebagai anggota telah dicabut.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-left space-y-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 shadow-sm"><ShieldCheck size={20} /></div>
              <h4 className="font-bold text-gray-800 text-sm">Pengembalian Dana</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Seluruh sisa simpanan Anda sedang dalam proses pencairan ke nomor rekening yang terdaftar.</p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-50 flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => logout()}
              className="!px-10 !py-4 !bg-[#004A9C] shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              <span>Keluar dari Akun</span>
            </Button>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div 
          variants={itemVariants}
          className="bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border border-white flex items-center justify-between gap-6 px-10 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Mail size={20} /></div>
            <p className="text-xs font-medium text-gray-500">Pertanyaan? Hubungi admin@koperasinichias.com</p>
          </div>
          <div className="hidden md:block h-1 w-20 bg-gray-200 rounded-full"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Koperasi Nichias Indonesia</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DashboardKeluar;
