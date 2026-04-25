import { motion } from 'framer-motion';
import { XCircle, RefreshCw, LogOut, MessageCircle, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/atoms/Logo';
import Button from '../../components/atoms/Button';

export default function DashboardDitolak() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReRegister = () => {
    logout();
    navigate('/register');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-poppins">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
        <Logo />
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{user?.nama_lengkap || 'Anggota'}</p>
            <p className="text-xs text-[#EB5757] font-medium">Pendaftaran Ditolak</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#EB5757] hover:bg-[#EB5757]/10 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <motion.div
        className="max-w-2xl mx-auto px-4 py-8 sm:py-12"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Rejection Banner */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            className="w-20 h-20 bg-[#EB5757]/10 rounded-full flex items-center justify-center mx-auto mb-5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <XCircle size={40} className="text-[#EB5757]" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Pendaftaran Ditolak
          </h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Maaf, pendaftaran keanggotaan Anda tidak dapat diproses. Silakan hubungi pengurus koperasi untuk informasi lebih lanjut.
          </p>
        </motion.div>

        {/* Reason Card (if available) */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6"
        >
          <div className="bg-gradient-to-r from-[#EB5757] to-[#c24646] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <MessageCircle size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Informasi Penolakan</h3>
                <p className="text-white/70 text-xs">Detail mengenai status pendaftaran Anda</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-[#EB5757]/5 border border-[#EB5757]/10 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                Pendaftaran Anda telah ditinjau oleh pengurus koperasi dan tidak dapat disetujui saat ini. 
                Hal ini mungkin disebabkan oleh data yang tidak lengkap atau tidak memenuhi persyaratan keanggotaan.
              </p>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Jika Anda merasa ini adalah kesalahan, silakan hubungi pengurus koperasi untuk klarifikasi. 
              Anda juga dapat mendaftar ulang dengan data yang diperbarui.
            </p>
          </div>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"
        >
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Phone size={16} className="text-[#004A9C]" />
            Hubungi Pengurus Koperasi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-[#004A9C]/10 rounded-lg flex items-center justify-center">
                <Phone size={14} className="text-[#004A9C]" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Sekretaris</p>
                <p className="text-xs font-semibold text-gray-800">Ahmad Fauzi</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-[#004A9C]/10 rounded-lg flex items-center justify-center">
                <Mail size={14} className="text-[#004A9C]" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Email</p>
                <p className="text-xs font-semibold text-gray-800">sekretaris@koperasi-nichias.co.id</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button onClick={handleReRegister} className="flex items-center justify-center gap-2">
            <RefreshCw size={16} />
            Daftar Ulang
          </Button>
          <Button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 !bg-white !text-gray-700 border border-gray-200 hover:!bg-gray-50"
          >
            <LogOut size={16} />
            Logout
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
