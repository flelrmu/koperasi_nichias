import { motion } from 'framer-motion';
import { CheckCircle2, CreditCard, Clock, ArrowRight, LogOut, Building2, User, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/atoms/Logo';
import Button from '../components/atoms/Button';
import { useState } from 'react';

const PAYMENT_INFO = {
  bank: 'Bank BCA',
  noRekening: '123-456-7890',
  atasNama: 'Koperasi Nichias Sunijaya',
  nominal: 'Rp 100.000',
};

const STEPS = [
  { label: 'Registrasi', icon: User, done: true },
  { label: 'Pembayaran', icon: CreditCard, done: false, active: true },
  { label: 'Verifikasi', icon: Clock, done: false },
  { label: 'Aktif', icon: CheckCircle2, done: false },
];

export default function DashboardPending() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [copiedField, setCopiedField] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text.replace(/[-.]/g, ''));
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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
            <p className="text-xs text-gray-500">Menunggu Verifikasi</p>
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
        {/* Success Banner */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            className="w-20 h-20 bg-[#27AE60]/10 rounded-full flex items-center justify-center mx-auto mb-5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <CheckCircle2 size={40} className="text-[#27AE60]" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Pendaftaran Berhasil Diajukan! 🎉
          </h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Pendaftaran Anda sedang diproses oleh pengurus koperasi. Silakan lakukan pembayaran simpanan pokok untuk mempercepat aktivasi.
          </p>
        </motion.div>

        {/* Stepper */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between relative px-4">
            {/* Line connector */}
            <div className="absolute top-5 left-[12%] right-[12%] h-0.5 bg-gray-200 z-0"></div>
            <div className="absolute top-5 left-[12%] h-0.5 bg-[#27AE60] z-0" style={{ width: '14%' }}></div>

            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={idx}
                  className="flex flex-col items-center relative z-10"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 transition-all ${
                      step.done
                        ? 'bg-[#27AE60] border-[#27AE60] text-white'
                        : step.active
                        ? 'bg-white border-[#004A9C] text-[#004A9C] shadow-md shadow-[#004A9C]/20'
                        : 'bg-white border-gray-200 text-gray-400'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      step.done ? 'text-[#27AE60]' : step.active ? 'text-[#004A9C]' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Payment Card */}
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6"
        >
          <div className="bg-gradient-to-r from-[#004A9C] to-[#0a3d80] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CreditCard size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Instruksi Pembayaran Simpanan Pokok</h3>
                <p className="text-white/70 text-xs">Lakukan pembayaran ke rekening berikut</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Nominal */}
            <div className="text-center mb-6 py-4 bg-[#DFEAF4]/30 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Nominal Simpanan Pokok</p>
              <p className="text-3xl font-bold text-[#004A9C]">{PAYMENT_INFO.nominal}</p>
            </div>

            {/* Payment Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500">Bank Tujuan</p>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Building2 size={14} className="text-[#004A9C]" />
                    {PAYMENT_INFO.bank}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500">No. Rekening</p>
                  <p className="text-sm font-semibold text-gray-800 font-mono tracking-wider">{PAYMENT_INFO.noRekening}</p>
                </div>
                <button
                  onClick={() => handleCopy(PAYMENT_INFO.noRekening, 'rekening')}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copiedField === 'rekening' ? (
                    <Check size={16} className="text-[#27AE60]" />
                  ) : (
                    <Copy size={16} className="text-gray-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500">Atas Nama</p>
                  <p className="text-sm font-semibold text-gray-800">{PAYMENT_INFO.atasNama}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500">Berita Transfer</p>
                  <p className="text-sm font-semibold text-gray-800">Simpanan Pokok - {user?.nama_lengkap || 'Nama Anda'}</p>
                </div>
                <button
                  onClick={() => handleCopy(`Simpanan Pokok - ${user?.nama_lengkap || ''}`, 'berita')}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copiedField === 'berita' ? (
                    <Check size={16} className="text-[#27AE60]" />
                  ) : (
                    <Copy size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          variants={itemVariants}
          className="bg-[#F2994A]/5 border border-[#F2994A]/20 rounded-2xl p-5 flex items-start gap-4"
        >
          <div className="w-10 h-10 bg-[#F2994A]/10 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={20} className="text-[#F2994A]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-1">Penting</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Setelah melakukan pembayaran, kirimkan bukti transfer kepada Sekretaris koperasi untuk proses verifikasi. 
              Akun Anda akan diaktifkan setelah pembayaran dikonfirmasi oleh pengurus.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
