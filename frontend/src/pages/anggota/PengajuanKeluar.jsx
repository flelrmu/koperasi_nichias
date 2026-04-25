import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Send, Info, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button';
import Textarea from '../../components/atoms/Textarea';
import Modal from '../../components/molecules/Modal';

export default function PengajuanKeluar() {
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || reason.length < 20) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call with delay for better UX
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 1500);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/profile');
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
      transition: { 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1] 
      } 
    }
  };

  return (
    <motion.div 
      className="space-y-6 max-w-3xl mx-auto pb-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header section with back button */}
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
        {/* Warning Banner */}
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

      {/* FAQs or Info */}
      <motion.div variants={itemVariants} className="bg-[#DFEAF4]/30 border border-[#004A9C]/10 rounded-2xl p-6 flex gap-5 items-center">
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#004A9C] shadow-sm shrink-0">
          <Info size={28} />
        </div>
        <div>
          <h5 className="font-bold text-gray-800">Apa langkah selanjutnya?</h5>
          <p className="text-sm text-gray-600 mt-0.5">Setelah dikirim, Pengurus akan memverifikasi pengajuan Anda. Proses ini memakan waktu maksimal 3-5 hari kerja.</p>
        </div>
      </motion.div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <Modal
            isOpen={showSuccessModal}
            onClose={handleSuccessClose}
            title="Pengajuan Terkirim"
            message="Permohonan pengunduran diri Anda telah kami terima untuk diproses. Status permohonan dapat dipantau secara berkala melalui menu Dashboard atau Profil."
            type="success"
            actionText="Tutup"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
