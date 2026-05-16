import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  PiggyBank,
  ShieldCheck,
  Info
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Modal from '../../components/molecules/Modal';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/atoms/StatusBadge';

export default function ManajemenSaldo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); // simpanan_id
  const { api } = useAuth();
  
  const formatToRupiah = (value) => {
    if (!value && value !== 0) return '';
    const cleanValue = value.toString().replace(/[^0-9]/g, '');
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const [member, setMember] = useState(location.state?.member || null);
  const [saldo, setSaldo] = useState({
    pokok: formatToRupiah((location.state?.saldo?.pokok || 0).toString().split('.')[0]),
    wajib: formatToRupiah((location.state?.saldo?.wajib || 0).toString().split('.')[0]),
    sukarela: formatToRupiah((location.state?.saldo?.sukarela || 0).toString().split('.')[0])
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [metodePembayaran, setMetodePembayaran] = useState('CASH');
  const [isLoading, setIsLoading] = useState(!member);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const handleSaldoChange = (e, key) => {
    const input = e.target;
    const selectionStart = input.selectionStart;
    const oldLength = input.value.length;
    
    const formatted = formatToRupiah(input.value);
    
    setSaldo(prev => ({ ...prev, [key]: formatted }));
    
    // Use requestAnimationFrame or setTimeout to restore cursor position after React re-render
    requestAnimationFrame(() => {
      const newLength = formatted.length;
      const position = Math.max(0, selectionStart + (newLength - oldLength));
      input.setSelectionRange(position, position);
    });
  };

  const fetchSimpananDetail = useCallback(async () => {
    try {
      const res = await api.get('/simpan-pinjam/simpanan');
      if (res.data.success) {
        const found = res.data.data.find(s => s.simpanan_id === parseInt(id));
        if (found) {
          setMember(found);
          setSaldo({
            pokok: formatToRupiah(found.saldo_pokok.toString().split('.')[0]),
            wajib: formatToRupiah(found.saldo_wajib.toString().split('.')[0]),
            sukarela: formatToRupiah(found.saldo_sukarela.toString().split('.')[0])
          });
        }
      }
    } catch (error) {
      console.error('Error fetching simpanan detail:', error);
    } finally {
      setIsLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    if (!member) {
      fetchSimpananDetail();
    }
  }, [member, fetchSimpananDetail]);

  const actualSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await api.put(`/simpan-pinjam/simpanan/${id}`, {
        saldo_pokok: saldo.pokok.toString().replace(/\./g, ''),
        saldo_wajib: saldo.wajib.toString().replace(/\./g, ''),
        saldo_sukarela: saldo.sukarela.toString().replace(/\./g, ''),
        metode_pembayaran: metodePembayaran
      });
      
      if (res.data.success) {
        setConfirmModal({ ...confirmModal, isOpen: false });
        setStatusModal({
          isOpen: true,
          type: 'success',
          title: 'Berhasil Diperbarui',
          message: `Data saldo simpanan untuk ${member.anggota.nama_lengkap} telah berhasil diperbarui di sistem.`
        });
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      setConfirmModal({ ...confirmModal, isOpen: false });
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal Memperbarui',
        message: error.response?.data?.message || 'Terjadi kesalahan sistem saat memperbarui saldo.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setConfirmModal({
      isOpen: true,
      title: 'Konfirmasi Perubahan Saldo',
      message: `Anda akan mengubah total saldo ${member?.anggota?.nama_lengkap} secara langsung. Pastikan data ini sudah sesuai dengan catatan fisik. Lanjutkan?`,
      onConfirm: actualSubmit
    });
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004A9C]"></div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const totalSaldo = parseFloat(saldo.pokok.toString().replace(/\./g, '') || 0) + 
                     parseFloat(saldo.wajib.toString().replace(/\./g, '') || 0) + 
                     parseFloat(saldo.sukarela.toString().replace(/\./g, '') || 0);

  return (
    <motion.div 
      className="max-w-4xl mx-auto space-y-6 pb-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/simpan-pinjam')}
            className="p-3 bg-white border border-gray-100 text-gray-400 hover:text-[#004A9C] rounded-2xl transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Manajemen Saldo Simpanan</h2>
            <p className="text-gray-500 text-sm font-medium">Lakukan penyesuaian saldo simpanan anggota secara langsung.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#DFEAF4]/10 rounded-full -mr-32 -mt-32"></div>
              
              <div className="flex items-center gap-3 text-[#004A9C] relative">
                 <div className="p-2 bg-[#DFEAF4] rounded-xl"><ShieldCheck size={24} /></div>
                 <h3 className="font-black text-xl tracking-tight">Data Nominal Saldo</h3>
              </div>

              <div className="space-y-6 relative">
                 {[
                   { label: 'Simpanan Pokok', key: 'pokok', icon: <TrendingUp size={18} />, color: 'text-blue-600', bg: 'bg-blue-50' },
                   { label: 'Simpanan Wajib', key: 'wajib', icon: <CreditCard size={18} />, color: 'text-purple-600', bg: 'bg-purple-50' },
                   { label: 'Simpanan Sukarela', key: 'sukarela', icon: <Wallet size={18} />, color: 'text-green-600', bg: 'bg-green-50' }
                 ].map((item) => (
                   <div key={item.key} className="space-y-3 group">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                        <span className={`${item.bg} ${item.color} p-1.5 rounded-lg`}>{item.icon}</span>
                        {item.label}
                      </label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-300 text-lg group-focus-within:text-[#004A9C] transition-colors">Rp</span>
                        <Input 
                          value={saldo[item.key]} 
                          onChange={(e) => handleSaldoChange(e, item.key)}
                          className="!pl-14 !py-5 !rounded-2xl !bg-gray-50/50 hover:bg-white focus:bg-white !border-transparent hover:!border-gray-200 focus:!border-[#004A9C]/30 !shadow-sm !font-black !text-xl !text-gray-800 transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 italic px-1 font-medium">Masukkan total akumulasi saldo {item.label.toLowerCase()} saat ini.</p>
                   </div>
                 ))}
              </div>

              {/* Metode Pembayaran Selection */}
              <div className="pt-8 border-t border-gray-100 space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-1 block">Akun Sumber Penyesuaian</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['CASH', 'BANK'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMetodePembayaran(m)}
                        className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-black text-sm ${
                          metodePembayaran === m 
                          ? 'border-[#004A9C] bg-[#004A9C]/5 text-[#004A9C]' 
                          : 'border-gray-50 bg-gray-50/30 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${metodePembayaran === m ? 'bg-[#004A9C] text-white' : 'bg-gray-200 text-gray-500'}`}>
                          {m === 'CASH' ? <Wallet size={18} /> : <CreditCard size={18} />}
                        </div>
                        {m === 'CASH' ? 'Kas Tunai' : 'Rekening Bank'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 italic px-1 font-medium">Pilih akun mana yang akan mencatat selisih saldo ini di laporan keuangan (Arus Kas).</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/admin/simpan-pinjam')} 
                  className="flex-1 !py-4 !rounded-2xl font-bold"
                >
                  Batal & Kembali
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting} 
                  className="flex-[2] !py-4 flex items-center justify-center gap-2 bg-[#004A9C] shadow-xl shadow-[#004A9C]/20 !rounded-2xl"
                >
                    <Save size={20} />
                    <span className="font-bold">{isSubmitting ? 'Proses Simpan...' : 'Simpan Saldo Sekarang'}</span>
                </Button>
              </div>
           </div>
        </div>

        {/* Right Column: Info & Summary */}
        <div className="space-y-6">
           {/* Profile Card */}
           <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                 <div className="w-24 h-24 bg-[#004A9C] text-white rounded-[2rem] flex items-center justify-center font-black text-4xl shadow-2xl shadow-[#004A9C]/30 relative">
                    {member?.anggota?.nama_lengkap?.charAt(0)}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full"></div>
                 </div>
                 <div>
                    <h4 className="font-black text-xl text-gray-800 tracking-tight leading-none">{member?.anggota?.nama_lengkap}</h4>
                    <p className="text-sm font-mono text-[#004A9C] font-bold mt-2 uppercase tracking-tighter">ID: {member?.anggota?.no_anggota}</p>
                 </div>
                 <div className="flex items-center gap-2 pt-2">
                    <StatusBadge status="Aktif" />
                    <span className="text-[10px] bg-blue-50 text-[#004A9C] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-blue-100">Anggota</span>
                 </div>
              </div>
           </div>

           {/* Total Summary Card */}
           <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-gray-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl transition-all group-hover:scale-150 duration-700"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#004A9C]/20 rounded-full -ml-16 -mb-16 blur-2xl"></div>
              
              <div className="relative space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                       <PiggyBank size={24} className="text-white" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Ringkasan Saldo</span>
                 </div>

                 <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Akumulasi Total Baru</span>
                    <h2 className="text-3xl font-black text-white tracking-tighter truncate">
                       {formatCurrency(totalSaldo)}
                    </h2>
                 </div>

                 <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                       <span className="text-gray-500 uppercase">Status Perubahan</span>
                       <span className="text-green-400 uppercase tracking-widest">Siap Simpan</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: '100%' }}
                         className="h-full bg-gradient-to-r from-[#004A9C] to-blue-400"
                       />
                    </div>
                 </div>
              </div>
           </div>

           {/* Quick Note */}
           <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex gap-4">
              <Info className="text-orange-500 shrink-0 mt-1" size={20} />
              <p className="text-[11px] text-orange-700 leading-relaxed font-medium">
                 <span className="font-bold uppercase">Penting:</span> Perubahan saldo ini akan langsung mencerminkan total simpanan anggota di dashboard mereka. Pastikan data sudah sesuai dengan catatan fisik/rekening koran.
              </p>
           </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.title}
        message={confirmModal.message}
        type="warning"
        confirmText="Ya, Perbarui Saldo"
        onConfirm={confirmModal.onConfirm}
        isLoading={isSubmitting}
        maxWidth="max-w-md"
      />

      {/* Status Modal */}
      <Modal
        isOpen={statusModal.isOpen}
        onClose={() => {
          setStatusModal({ ...statusModal, isOpen: false });
          if (statusModal.type === 'success') {
            navigate('/admin/simpan-pinjam');
          }
        }}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        confirmText="Tutup"
      />
    </motion.div>
  );
}
