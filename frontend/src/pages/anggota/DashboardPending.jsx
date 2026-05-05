import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, CreditCard, Clock, ArrowRight, LogOut, Building2, User, Copy, Check, MessageCircle, ShieldCheck, Sparkles, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Logo from '../../components/atoms/Logo';
import Button from '../../components/atoms/Button';
import { useState, useEffect } from 'react';

const PAYMENT_INFO = {
  bank: 'Bank BCA',
  noRekening: '123-456-7890',
  atasNama: 'Koperasi Nichias Sunijaya',
  nominal: 'Rp 100.000',
};

const STEPS = [
  { id: 1, label: 'Registrasi', icon: User },
  { id: 2, label: 'Pembayaran', icon: CreditCard },
  { id: 3, label: 'Verifikasi', icon: Clock },
  { id: 4, label: 'Aktif', icon: CheckCircle2 },
];

export default function DashboardPending() {
  const navigate = useNavigate();
  const { user, logout, api } = useAuth();
  const socket = useSocket();
  const [copiedField, setCopiedField] = useState(null);
  const [currentStep, setCurrentStep] = useState(2);
  const [approvalData, setApprovalData] = useState(null);
  const [secretaryContact, setSecretaryContact] = useState(null);
  const [configs, setConfigs] = useState({});

  // Fetch configurations
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const res = await api.get('/simpan-pinjam/konfigurasi');
        if (res.data.success) {
          const configMap = {};
          res.data.data.forEach(c => { configMap[c.nama_config] = c.nilai; });
          setConfigs(configMap);
        }
      } catch (error) {
        console.error('Error fetching configurations:', error);
      }
    };
    fetchConfigs();

    if (socket) {
      const handleConfigUpdate = (data) => {
        console.log('📥 WebSocket Received konfigurasi:updated (DashboardPending):', data);
        setConfigs(prev => ({ ...prev, [data.nama_config]: data.nilai }));
      };
      socket.on('konfigurasi:updated', handleConfigUpdate);
      return () => socket.off('konfigurasi:updated', handleConfigUpdate);
    }
  }, [api, socket]);

  const formatCurrency = (val) => {
    if (!val) return 'Rp 0';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Fetch secretary contact
  useEffect(() => {
    const fetchSecretaryContact = async () => {
      try {
        const res = await api.get('/user/contact/sekretaris');
        if (res.data.success) {
          setSecretaryContact(res.data.data);
        }
      } catch (error) {
        console.error('Error fetching secretary contact:', error);
      }
    };
    fetchSecretaryContact();
  }, [api]);

  // Listen for real-time member:approved event
  useEffect(() => {
    if (!socket) return;

    const handleApproved = (data) => {
      console.log('🎉 member:approved received:', data);
      if (data.user_id === user?.user_id) {
        setApprovalData(data);
        setCurrentStep(4);

        // Update localStorage so next login goes to /dashboard
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        savedUser.status_keanggotaan = 'Aktif';
        localStorage.setItem('user', JSON.stringify(savedUser));
      }
    };

    socket.on('member:approved', handleApproved);
    return () => socket.off('member:approved', handleApproved);
  }, [socket, user?.user_id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text.replace(/[-.]/g, ''));
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleKonfirmasiPembayaran = () => {
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactAdmin = () => {
    if (!secretaryContact || !secretaryContact.no_hp) {
      alert("Maaf, kontak pengurus belum tersedia saat ini.");
      return;
    }

    let phoneNumber = secretaryContact.no_hp.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '62' + phoneNumber.substring(1);
    }

    const message = encodeURIComponent(`Halo Pengurus Koperasi Nichias, saya ${user?.nama_lengkap || 'Anggota baru'} ingin mengonfirmasi pembayaran pendaftaran saya...`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const handleGoToDashboard = () => {

    // Force reload so AuthContext picks up updated localStorage
    window.location.href = '/dashboard';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  const progressWidth = `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-poppins">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
        <Logo />
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{user?.nama_lengkap || 'Anggota'}</p>
            <p className="text-xs text-gray-500">
              {currentStep === 4 ? 'Anggota Aktif ✅' : 'Menunggu Verifikasi'}
            </p>
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
        {/* Step 2 Banner */}
        {currentStep === 2 && (
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
        )}

        {/* Step 3 Banner */}
        {currentStep === 3 && (
          <motion.div variants={itemVariants} className="text-center mb-8">
            <motion.div
              className="w-20 h-20 bg-[#004A9C]/10 rounded-full flex items-center justify-center mx-auto mb-5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <ShieldCheck size={40} className="text-[#004A9C]" />
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              Pembayaran Sedang Diverifikasi ⏳
            </h1>
            <p className="text-gray-500 max-w-md mx-auto">
              Terima kasih telah melakukan konfirmasi. Admin kami sedang memverifikasi pembayaran Anda. Mohon tunggu beberapa saat.
            </p>
          </motion.div>
        )}

        {/* Step 4 Banner - APPROVED */}
        {currentStep === 4 && (
          <motion.div
            variants={itemVariants}
            className="text-center mb-8"
          >
            <motion.div
              className="w-24 h-24 bg-[#27AE60]/10 rounded-full flex items-center justify-center mx-auto mb-5 relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-[#27AE60]/20"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
              <Sparkles size={48} className="text-[#27AE60]" />
            </motion.div>
            <motion.h1
              className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Selamat, Anda Resmi Menjadi Anggota! 🎉
            </motion.h1>
            <motion.p
              className="text-gray-500 max-w-md mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Pendaftaran Anda telah disetujui oleh pengurus. Silakan masuk ke dashboard untuk mulai menggunakan layanan koperasi.
            </motion.p>
          </motion.div>
        )}

        {/* Stepper */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between relative px-4">
            <div className="absolute top-5 left-[12%] right-[12%] h-1 bg-gray-200 z-0 rounded-full"></div>
            <motion.div
              className="absolute top-5 left-[12%] h-1 bg-[#27AE60] z-0 rounded-full"
              initial={{ width: '14%' }}
              animate={{ width: progressWidth }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isDone = currentStep > step.id;
              const isActive = currentStep === step.id;
              return (
                <motion.div
                  key={step.id}
                  className="flex flex-col items-center relative z-10 bg-[#F8FAFC]"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  <motion.div
                    animate={isActive ? { y: [0, -5, 0] } : {}}
                    transition={isActive ? { repeat: Infinity, duration: 2, ease: "easeInOut" } : {}}
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 transition-all duration-300 ${
                      isDone
                        ? 'bg-[#27AE60] border-[#27AE60] text-white shadow-lg shadow-[#27AE60]/30'
                        : isActive
                        ? 'bg-white border-[#004A9C] text-[#004A9C] shadow-lg shadow-[#004A9C]/30 scale-110'
                        : 'bg-white border-gray-200 text-gray-400'
                    }`}
                  >
                    {isDone ? <Check size={20} /> : <Icon size={18} />}
                  </motion.div>
                  <span
                    className={`text-[11px] font-medium transition-colors duration-300 ${
                      isDone ? 'text-[#27AE60]' : isActive ? 'text-[#004A9C] font-bold' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Dynamic Content Based on Step */}
        <AnimatePresence mode="wait">
          {currentStep === 2 && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                  <div className="text-center mb-6 py-4 bg-[#DFEAF4]/30 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Nominal Simpanan Pokok</p>
                    <p className="text-3xl font-bold text-[#004A9C]">
                      {configs.SIMPANAN_POKOK ? formatCurrency(configs.SIMPANAN_POKOK) : PAYMENT_INFO.nominal}
                    </p>
                  </div>
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
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="text-xs text-gray-500">No. Rekening</p>
                        <p className="text-sm font-semibold text-gray-800 font-mono tracking-wider">{PAYMENT_INFO.noRekening}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(PAYMENT_INFO.noRekening, 'rekening')}
                        className="p-2 bg-white group-hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors shadow-sm"
                      >
                        {copiedField === 'rekening' ? <Check size={16} className="text-[#27AE60]" /> : <Copy size={16} className="text-gray-400 group-hover:text-[#004A9C]" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-xs text-gray-500">Atas Nama</p>
                        <p className="text-sm font-semibold text-gray-800">{PAYMENT_INFO.atasNama}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="text-xs text-gray-500">Berita Transfer</p>
                        <p className="text-sm font-semibold text-gray-800">Simpanan Pokok - {user?.nama_lengkap || 'Nama Anda'}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(`Simpanan Pokok - ${user?.nama_lengkap || ''}`, 'berita')}
                        className="p-2 bg-white group-hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors shadow-sm"
                      >
                        {copiedField === 'berita' ? <Check size={16} className="text-[#27AE60]" /> : <Copy size={16} className="text-gray-400 group-hover:text-[#004A9C]" />}
                      </button>
                    </div>
                  </div>
                  <div className="mt-8">
                    <Button
                      onClick={handleKonfirmasiPembayaran}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#004A9C] hover:bg-[#0a3d80] text-white rounded-xl shadow-lg shadow-[#004A9C]/20 transition-all hover:-translate-y-1"
                    >
                      <span>Saya Sudah Membayar</span>
                      <ArrowRight size={18} />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="bg-[#F2994A]/5 border border-[#F2994A]/20 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 bg-[#F2994A]/10 rounded-xl flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-[#F2994A]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">Penting</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Setelah melakukan pembayaran, klik tombol <b>"Saya Sudah Membayar"</b> di atas. Akun Anda akan diaktifkan setelah pembayaran dikonfirmasi oleh pengurus.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 opacity-5 w-64 h-64 -mt-16 -mr-16 pointer-events-none">
                  <Clock size={256} className="text-[#004A9C]" />
                </div>
                <div className="p-8 sm:p-10 text-center relative z-10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="w-24 h-24 mx-auto border-4 border-dashed border-[#DFEAF4] rounded-full flex items-center justify-center mb-6"
                  >
                    <Clock size={40} className="text-[#004A9C]" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Menunggu Verifikasi Admin</h3>
                  <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed mb-8">
                    Proses verifikasi biasanya memakan waktu 1x24 jam kerja. Kami akan mengirimkan notifikasi setelah akun Anda aktif.
                  </p>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6 text-left">
                    <h4 className="font-semibold text-[#004A9C] text-sm mb-2">Detail Pendaftaran:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex justify-between">
                        <span className="text-gray-500">Nama Lengkap</span>
                        <span className="font-medium">{user?.nama_lengkap || 'Anggota'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-500">Status Pembayaran</span>
                        <span className="font-medium text-[#F2994A]">Menunggu Konfirmasi</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={handleContactAdmin}
                    className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-[#25D366]/10 text-[#25D366] font-medium rounded-xl hover:bg-[#25D366]/20 transition-colors"
                  >
                    <MessageCircle size={20} />
                    Hubungi Pengurus Untuk Konfirmasi Pembayaran
                  </button>

                </div>
              </div>
              <div className="text-center">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-sm text-gray-500 hover:text-[#004A9C] font-medium transition-colors"
                >
                  Kembali ke Halaman Pembayaran
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Approved / Aktif */}
          {currentStep === 4 && (
            <motion.div
              key="approved"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-[#27AE60]/20 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#27AE60]/5 via-transparent to-[#004A9C]/5 pointer-events-none" />
                <div className="p-8 sm:p-10 relative z-10">
                  {/* Confetti-like decorations */}
                  <div className="absolute top-4 left-4 w-3 h-3 bg-[#27AE60]/30 rounded-full" />
                  <div className="absolute top-8 right-8 w-2 h-2 bg-[#004A9C]/30 rounded-full" />
                  <div className="absolute top-12 left-16 w-2 h-2 bg-[#F2994A]/30 rounded-full" />

                  <div className="text-center space-y-6">
                    <motion.div
                      className="w-20 h-20 mx-auto bg-[#27AE60]/10 rounded-2xl flex items-center justify-center"
                      initial={{ rotateY: 0 }}
                      animate={{ rotateY: 360 }}
                      transition={{ duration: 1, delay: 0.3 }}
                    >
                      <CheckCircle2 size={40} className="text-[#27AE60]" />
                    </motion.div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Keanggotaan Anda Aktif!</h3>
                      <p className="text-gray-500 text-sm max-w-md mx-auto">
                        Anda sekarang dapat mengakses semua fitur koperasi termasuk simpanan, pinjaman, dan layanan lainnya.
                      </p>
                    </div>

                    {approvalData && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-[#DFEAF4]/30 border border-[#004A9C]/10 rounded-xl p-5 text-left max-w-sm mx-auto"
                      >
                        <h4 className="text-xs font-bold text-[#004A9C] uppercase tracking-widest mb-3">Detail Keanggotaan</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-500">No. Anggota</span>
                            <span className="text-xs font-bold text-[#004A9C] font-mono">{approvalData.no_anggota}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-500">Nama</span>
                            <span className="text-xs font-semibold text-gray-700">{approvalData.nama_lengkap}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs text-gray-500">Status</span>
                            <span className="text-xs font-bold text-[#27AE60]">✅ Aktif</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <Button
                        onClick={handleGoToDashboard}
                        className="w-full sm:w-auto mx-auto min-w-[280px] flex items-center justify-center gap-3 py-4 bg-[#004A9C] hover:bg-[#0a3d80] text-white rounded-xl shadow-lg shadow-[#004A9C]/30 transition-all hover:-translate-y-1 text-base font-bold"

                      >
                        <Home size={20} />
                        <span>Masuk ke Dashboard Anggota</span>
                        <ArrowRight size={18} />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
