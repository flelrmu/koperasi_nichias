import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Send, Info, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/atoms/Button';
import Textarea from '../components/atoms/Textarea';
import Modal from '../components/molecules/Modal';

export default function PengajuanKeluar() {
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Mohon isi alasan pengajuan keluar Anda.');
      return;
    }
    
    // Simulate API call
    setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/profile'); // Or dashboard depending on actual flow, but user is leaving
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div 
      className="space-y-6 max-w-3xl mx-auto pb-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header section with back button */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/profile')}
          className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-[#004A9C] hover:bg-white hover:shadow-sm transition-all bg-gray-50/50"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pengajuan Keluar Koperasi</h2>
          <p className="text-gray-500 text-sm mt-1">Isi formulir di bawah ini untuk memproses permohonan keluar.</p>
        </div>
      </div>

      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Warning Banner */}
        <div className="bg-[#EB5757]/5 border-b border-[#EB5757]/10 p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#EB5757]/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="text-[#EB5757]" size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-[#EB5757]">Informasi Penting</h4>
            <p className="text-sm text-[#EB5757]/80 mt-1 leading-relaxed">
              Pengajuan keluar akan dievaluasi oleh pengurus. Setelah disetujui, akun Anda akan dinonaktifkan secara permanen 
              dan sisa Simpanan Pokok & Wajib akan ditransfer ke rekening bank Anda setelah dipotong tanggungan pinjaman (jika ada).
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                Alasan Pengajuan Keluar
                <span className="text-[#EB5757]">*</span>
              </label>
              <Textarea 
                placeholder="Ceritakan dengan singkat alasan Anda ingin keluar dari keanggotaan Koperasi Nichias..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
                required
                className="bg-gray-50/50"
              />
              <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                <Info size={12} /> Minimum 20 karakter untuk membantu kami mengevaluasi.
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex gap-3 items-start">
              <div className="pt-0.5">
                <input 
                  type="checkbox" 
                  id="agreement" 
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  required
                  className="w-5 h-5 rounded border-gray-300 text-[#EB5757] focus:ring-[#EB5757] transition-all cursor-pointer accent-[#EB5757]"
                />
              </div>
              <label htmlFor="agreement" className="text-sm text-gray-600 leading-relaxed cursor-pointer select-none">
                Saya mengerti bahwa dengan mengirimkan pengajuan ini, saya tidak dapat membatalkannya secara sepihak. 
                Saya juga bersedia dihubungi oleh pengurus Koperasi untuk proses konfirmasi lebih lanjut.
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
              <Button 
                type="button"
                onClick={() => navigate('/profile')} 
                className="!bg-white !text-gray-700 border border-gray-200 hover:!bg-gray-50 w-full sm:w-auto px-8"
              >
                Batal
              </Button>
              <button 
                type="submit"
                disabled={!isChecked || !reason.trim()}
                className="flex items-center justify-center gap-2 bg-[#EB5757] hover:bg-[#c24646] text-white font-medium py-3 px-8 rounded-full transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed shadow-sm lg:text-[12px] text-base"
              >
                <Send size={16} />
                Kirim Pengajuan
              </button>
            </div>
          </form>
        </div>
      </motion.div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="Pengajuan Berhasil Dikirim"
        message="Permohonan keluar koperasi Anda telah kami rekam dan sedang ditinjau oleh Pengurus Koperasi. Anda akan menerima notifikasi lebih lanjut segera."
        type="success"
      />
    </motion.div>
  );
}
