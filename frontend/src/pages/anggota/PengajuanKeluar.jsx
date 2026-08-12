import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Send, 
  Info, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Textarea from '../../components/atoms/Textarea';
import Modal from '../../components/molecules/Modal';
import { useAuth } from '../../context/AuthContext';

function PengajuanKeluar() {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  
  const [reason, setReason] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [debtStatus, setDebtStatus] = useState({ hasDebt: false, checked: false, amount: 0 });
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [currentStatus, setCurrentStatus] = useState(user?.status_keanggotaan);

  useEffect(() => {
    checkDebt();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/user/profile');
      if (response.data.success) {
        setCurrentStatus(response.data.data.status_keanggotaan);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkDebt = async () => {
    try {
      const response = await api.get('/user/profile');
      if (response.data.success) {
        const profile = response.data.data;
        const loans = profile.pinjaman || [];
        const totalDebt = loans.reduce((sum, loan) => {
          if (loan.status === 'Approved' || loan.status === 'Berjalan') {
            return sum + parseFloat(loan.sisa_tagihan || 0);
          }
          return sum;
        }, 0);

        setDebtStatus({ 
          hasDebt: totalDebt > 0, 
          checked: true,
          amount: totalDebt
        });
      }
    } catch (error) {
      console.error('Error checking debt:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.length < 20 || !isChecked) {
      return;
    }
    
    setConfirmModal({ isOpen: true });
  };

  const executeSubmit = async () => {
    setConfirmModal({ isOpen: false });
    setIsSubmitting(true);
    
    try {
      const response = await api.post('/user/anggota/request-keluar', { alasan_keluar: reason });
      
      if (response.data.success) {
        setCurrentStatus('Pending_Keluar');
      }
    } catch (error) {
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan saat mengirim pengajuan.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      const response = await api.post('/user/anggota/cancel-keluar');
      if (response.data.success) {
        setStatusModal({
          isOpen: true,
          type: 'success',
          title: 'Dibatalkan',
          message: 'Pengajuan pengunduran diri Anda telah dibatalkan.'
        });
        setCurrentStatus('Aktif');
        setReason('');
        setIsChecked(false);
      }
    } catch (error) {
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: error.response?.data?.message || 'Terjadi kesalahan saat membatalkan pengajuan.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleSuccessClose = () => {
    setStatusModal({ ...statusModal, isOpen: false });
    if (statusModal.type === 'success') {
      navigate('/profile');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.1
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } 
    }
  };

  const renderContent = () => {
    if (currentStatus === 'Pending_Keluar') {
      return (
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
        className="max-w-2xl mx-auto mt-10"
      >
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl text-center space-y-6">
          <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
            <Clock size={48} className="animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-gray-900">Pengajuan Sedang Diproses</h2>
          <p className="text-gray-500 leading-relaxed">
            Pengajuan pengunduran diri Anda telah kami terima dan saat ini sedang dalam tahap review oleh Sekretaris Koperasi. Kami akan memberikan notifikasi setelah status pengajuan Anda diperbarui.
          </p>
          <div className="pt-6 border-t border-gray-50">
            <div className="flex items-center justify-center gap-2 text-amber-600 font-bold text-sm uppercase tracking-widest">
              <Clock size={16} />
              <span>Status: Menunggu Persetujuan</span>
            </div>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/profile')} className="!bg-white !text-gray-600 border border-gray-200 hover:!bg-gray-50 flex-1 sm:flex-none">
              Kembali ke Profil
            </Button>
            <Button onClick={handleCancel} disabled={isSubmitting} className="!bg-red-50 !text-red-600 border border-red-100 hover:!bg-red-100 flex-1 sm:flex-none">
              {isSubmitting ? 'Membatalkan...' : 'Batalkan Pengajuan'}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (debtStatus.hasDebt) {
    return (
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={containerVariants}
        className="max-w-2xl mx-auto mt-10"
      >
        <div className="bg-white p-10 rounded-[2.5rem] border-2 border-red-100 shadow-xl text-center space-y-6">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle size={48} />
          </div>
          <h3 className="text-2xl font-black text-gray-900">Akses Dibatasi</h3>
          <p className="text-gray-500 leading-relaxed max-w-md mx-auto">
            Anda masih memiliki sisa tagihan pinjaman sebesar <span className="font-bold text-red-600">Rp {new Intl.NumberFormat('id-ID').format(debtStatus.amount)}</span>. 
            Sesuai aturan koperasi, anggota harus melunasi seluruh kewajiban keuangan sebelum dapat mengajukan pengunduran diri.
          </p>
          <div className="pt-6 flex gap-4 justify-center">
            <Button onClick={() => navigate('/profile')} className="!bg-white !text-gray-600 border border-gray-200 hover:!bg-gray-50">
              Kembali
            </Button>
            <Button onClick={() => navigate('/simpan-pinjam')} className="!bg-red-600 hover:!bg-red-700 shadow-lg shadow-red-600/20">
              Lihat Tagihan Pinjaman
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-6 max-w-3xl mx-auto pb-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
        <button 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-[#004A9C] hover:border-[#004A9C] hover:shadow-md transition-all group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pengajuan Keluar Koperasi</h2>
          <p className="text-gray-500 text-sm mt-1">Sampaikan permohonan pengunduran diri Anda secara resmi.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {}
        <div className="bg-[#EB5757]/5 border-b border-[#EB5757]/10 p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EB5757]/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="text-[#EB5757]" size={24} />
          </div>
          <div>
            <h4 className="font-bold text-[#EB5757] text-lg">Konsekuensi Penarikan Diri</h4>
            <p className="text-sm text-[#EB5757]/80 mt-1 leading-relaxed">
              Dengan keluar dari koperasi, Anda tidak lagi memiliki hak atas SHU dan manfaat keanggotaan lainnya. 
              Pastikan Anda telah mempertimbangkan keputusan ini dengan matang.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
                <span>Alasan Pengunduran Diri</span>
                <span className="text-xs font-normal text-gray-400">Minimal 20 karakter</span>
              </label>
              <Textarea 
                placeholder="Jelaskan alasan Anda ingin berhenti menjadi anggota Koperasi Nichias..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={6}
                required
                className={`bg-gray-50/50 focus:bg-white transition-colors ${reason.length > 0 && reason.length < 20 ? 'border-orange-300 ring-2 ring-orange-50' : ''}`}
              />
              {reason.length > 0 && reason.length < 20 && (
                <div className="flex items-center gap-1.5 text-xs text-orange-600 font-medium animate-pulse">
                  <Info size={14} /> Karakter kurang: {20 - reason.length} lagi
                </div>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex gap-4 items-start hover:bg-gray-100/50 transition-colors">
              <div className="relative flex items-center justify-center mt-0.5">
                <input 
                  type="checkbox" 
                  id="agreement" 
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  required
                  className="peer w-6 h-6 rounded-lg border-2 border-gray-300 text-[#004A9C] focus:ring-[#004A9C]/20 transition-all cursor-pointer accent-[#004A9C]"
                />
              </div>
              <label htmlFor="agreement" className="text-sm text-gray-600 leading-relaxed cursor-pointer select-none">
                Saya menyatakan secara sadar ingin keluar dari keanggotaan Koperasi Nichias dan telah membaca seluruh konsekuensi yang disebutkan di atas.
              </label>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => navigate('/profile')} 
                className="flex-1 sm:flex-none px-10 py-3.5 rounded-full border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={!isChecked || reason.length < 20 || isSubmitting}
                className={`flex-1 flex items-center justify-center gap-2 font-bold py-3.5 px-10 rounded-full transition-all shadow-md ${
                  !isChecked || reason.length < 20 || isSubmitting
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#EB5757] hover:bg-[#c24646] text-white hover:shadow-lg active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <Send size={18} />
                    <span>Kirim Pengajuan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {}
      <motion.div variants={itemVariants} className="bg-[#DFEAF4]/30 border border-[#004A9C]/10 rounded-2xl p-6 flex gap-5 items-center">
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#004A9C] shadow-sm shrink-0">
          <Info size={28} />
        </div>
        <div>
          <h5 className="font-bold text-gray-800">Apa langkah selanjutnya?</h5>
          <p className="text-sm text-gray-600 mt-0.5">Setelah dikirim, Pengurus akan memverifikasi pengajuan Anda. Proses ini memakan waktu maksimal 3-5 hari kerja.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

  return (
    <>
      {renderContent()}

      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false })}
        title="Konfirmasi Pengajuan"
        message="Apakah Anda yakin ingin mengirim pengajuan keluar dari koperasi? Keputusan ini memiliki konsekuensi sesuai dengan peraturan yang berlaku."
        type="warning"
        maxWidth="max-w-md"
        onConfirm={executeSubmit}
        confirmText="Ya, Kirim Pengajuan"
        cancelText="Batal"
      />

      <AnimatePresence>
        {statusModal.isOpen && (
          <Modal
            isOpen={statusModal.isOpen}
            onClose={handleSuccessClose}
            title={statusModal.title}
            message={statusModal.message}
            type={statusModal.type}
            confirmText="Tutup"
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PengajuanKeluar;
