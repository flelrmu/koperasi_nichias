import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Wallet, 
  FileText, 
  Calendar, 
  Info,
  AlertCircle
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Modal from '../../components/molecules/Modal';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function InputBaruSimpanan() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { api } = useAuth();
  const socket = useSocket();
  
  const [member, setMember] = useState(location.state?.member || null);
  const [configs, setConfigs] = useState({
    SIMPANAN_POKOK: 0,
    SIMPANAN_WAJIB: 0,
    SIMPANAN_SUKARELA: 0
  });
  const [savings, setSavings] = useState(null);
  
  const [formData, setFormData] = useState({
    jenis_simpanan: 'Wajib',
    jenis_transaksi: 'Setor',
    nominal: '',
    keterangan: '',
    metode_pembayaran: 'CASH',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const formatToRupiah = (value) => {
    if (!value && value !== 0) return '';
    const cleanValue = value.toString().replace(/[^0-9]/g, '');
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await api.get('/simpan-pinjam/konfigurasi');
      if (res.data.success) {
        // Convert array to map: { nama_config: nilai }
        const configMap = {};
        const data = res.data.data;
        if (Array.isArray(data)) {
          data.forEach(c => { configMap[c.nama_config] = parseFloat(c.nilai); });
        } else {
          // Fallback if already a map
          Object.assign(configMap, data);
        }
        setConfigs(configMap);
        // Default nominal for Wajib if starting with Wajib
        setFormData(prev => ({
          ...prev,
          nominal: formatToRupiah((configMap.SIMPANAN_WAJIB || 0).toString().split('.')[0])
        }));
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const fetchMember = useCallback(async () => {
    if (member || !id) return;
    try {
      const res = await api.get(`/user/anggota/${id}`);
      if (res.data.success) {
        setMember(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching member:', error);
    }
  }, [api, id, member]);

  const fetchSavings = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get('/simpan-pinjam/simpanan');
      if (res.data.success) {
        const found = res.data.data.find(s => s.anggota_id === parseInt(id));
        setSavings(found);
      }
    } catch (error) {
      console.error('Error fetching savings:', error);
    }
  }, [api, id]);

  useEffect(() => {
    fetchConfigs();
    fetchMember();
    fetchSavings();
  }, [fetchConfigs, fetchMember, fetchSavings]);

  // WebSocket listener for real-time config updates
  useEffect(() => {
    if (!socket) return;

    const handleConfigUpdate = (payload) => {
      console.log('📥 konfigurasi:updated', payload);
      setConfigs(prev => ({
        ...prev,
        [payload.nama_config]: parseFloat(payload.nilai)
      }));
    };

    socket.on('konfigurasi:updated', handleConfigUpdate);
    
    const handleSimpananUpdated = (data) => {
      if (data.anggota_id === parseInt(id)) {
        setSavings(data);
      }
    };
    socket.on('simpanan:updated', handleSimpananUpdated);

    return () => {
      socket.off('konfigurasi:updated', handleConfigUpdate);
      socket.off('simpanan:updated', handleSimpananUpdated);
    };
  }, [socket, id]);

  // Handle nominal auto-fill when jenis_simpanan changes
  useEffect(() => {
    // If switching to Pokok/Wajib while 'Tarik' is selected, force back to 'Setor'
    if (formData.jenis_transaksi === 'Tarik' && (formData.jenis_simpanan === 'Pokok' || formData.jenis_simpanan === 'Wajib')) {
      setFormData(prev => ({ ...prev, jenis_transaksi: 'Setor' }));
      return;
    }

    if (formData.jenis_simpanan === 'Semua') {
      const total = parseFloat(savings?.saldo_pokok || 0) + 
                    parseFloat(savings?.saldo_wajib || 0) + 
                    parseFloat(savings?.saldo_sukarela || 0);
      setFormData(prev => ({ 
        ...prev, 
        jenis_transaksi: 'Tarik',
        nominal: formatToRupiah(total.toString().split('.')[0])
      }));
      return;
    }

    if (formData.jenis_transaksi === 'Setor') {
      if (formData.jenis_simpanan === 'Pokok') {
        setFormData(prev => ({ ...prev, nominal: formatToRupiah((configs.SIMPANAN_POKOK || 0).toString().split('.')[0]) }));
      } else if (formData.jenis_simpanan === 'Wajib') {
        setFormData(prev => ({ ...prev, nominal: formatToRupiah((configs.SIMPANAN_WAJIB || 0).toString().split('.')[0]) }));
      } else if (formData.jenis_simpanan === 'Sukarela') {
        setFormData(prev => ({ ...prev, nominal: '' }));
      }
    }
  }, [formData.jenis_simpanan, formData.jenis_transaksi, configs, savings]);

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'nominal') {
      const input = e.target;
      const selectionStart = input.selectionStart;
      const oldLength = input.value.length;
      
      const formatted = formatToRupiah(value);
      setFormData(prev => ({ ...prev, [name]: formatted }));

      requestAnimationFrame(() => {
        const newLength = formatted.length;
        const position = Math.max(0, selectionStart + (newLength - oldLength));
        input.setSelectionRange(position, position);
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const actualSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const endpoint = formData.jenis_simpanan === 'Semua' 
      ? `/simpan-pinjam/simpanan/tarik-semua/${id}`
      : '/simpan-pinjam/simpanan/transaksi';
    
    try {
      const payload = formData.jenis_simpanan === 'Semua'
        ? { 
            keterangan: formData.keterangan,
            metode_pembayaran: formData.metode_pembayaran 
          }
        : {
            anggota_id: id,
            ...formData,
            nominal: formData.nominal.toString().replace(/\./g, '')
          };

      const res = await api.post(endpoint, payload);
      
      if (res.data.success) {
        setConfirmModal({ ...confirmModal, isOpen: false });
        setStatusModal({
          isOpen: true,
          type: 'success',
          title: 'Transaksi Berhasil',
          message: res.data.message || 'Transaksi telah berhasil dicatat.'
        });
      }
    } catch (error) {
      console.error('Error submitting transaction:', error);
      setConfirmModal({ ...confirmModal, isOpen: false });
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal Mencatat',
        message: error.response?.data?.message || 'Terjadi kesalahan sistem saat menyimpan transaksi.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    // Client-side validation for Sukarela minimum
    if (formData.jenis_simpanan === 'Sukarela' && formData.jenis_transaksi === 'Setor') {
      const nominalVal = parseFloat(formData.nominal.toString().replace(/\./g, '')) || 0;
      const minSukarela = configs.SIMPANAN_SUKARELA || 0;
      if (nominalVal < minSukarela) {
        setStatusModal({
          isOpen: true,
          type: 'error',
          title: 'Nominal Kurang',
          message: `Nominal setoran sukarela minimal adalah ${formatCurrency(minSukarela)}.`
        });
        return;
      }
    }

    setConfirmModal({
      isOpen: true,
      title: formData.jenis_simpanan === 'Semua' ? 'Konfirmasi Tarik Semua' : 'Konfirmasi Transaksi',
      message: formData.jenis_simpanan === 'Semua'
        ? `Apakah Anda yakin ingin MENARIK SELURUH simpanan milik ${member?.nama_lengkap}? Saldo simpanan akan menjadi Rp 0.`
        : `Apakah Anda yakin ingin mencatat ${formData.jenis_transaksi === 'Setor' ? 'setoran' : 'penarikan'} ${formData.jenis_simpanan} sebesar Rp ${formData.nominal} for ${member?.nama_lengkap}?`,
      onConfirm: actualSubmit
    });
  };

  const formatCurrency = (val) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
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

  return (
    <motion.div 
      className="max-w-3xl mx-auto space-y-6 pb-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/simpan-pinjam')}
            className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#004A9C] hover:bg-[#DFEAF4] rounded-2xl transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-[#004A9C]">Input Transaksi Simpanan</h2>
            <p className="text-gray-500 text-sm">Catat setoran atau penarikan baru untuk anggota.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Identitas Anggota Section */}
        <div className="p-6 border-b border-gray-50 bg-[#DFEAF4]/20 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
           <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-[#004A9C] text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md">
               {member?.nama_lengkap ? member.nama_lengkap.charAt(0) : '?'}
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1"><User size={12}/> Identitas Anggota</span>
                <span className="text-lg font-black text-gray-800">{member?.nama_lengkap || 'Loading...'}</span>
                <span className="text-sm font-mono text-[#004A9C] font-bold">{member?.no_anggota || '-'}</span>
             </div>
           </div>
           
           <div className="flex flex-col sm:items-end">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1 sm:justify-end"><Calendar size={12}/> Tanggal Transaksi</span>
              <span className="text-sm font-bold text-gray-800">{today}</span>
           </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Jenis Transaksi */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Wallet size={12} /> Jenis Transaksi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, jenis_transaksi: 'Setor'})}
                  className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                    formData.jenis_transaksi === 'Setor' 
                    ? 'bg-[#004A9C] text-white border-[#004A9C] shadow-md shadow-[#004A9C]/20' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Setoran
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.jenis_simpanan !== 'Sukarela' && formData.jenis_simpanan !== 'Semua') {
                      return;
                    }
                    setFormData({...formData, jenis_transaksi: 'Tarik'});
                  }}
                  className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                    formData.jenis_transaksi === 'Tarik' 
                    ? 'bg-[#EB5757] text-white border-[#EB5757] shadow-md shadow-[#EB5757]/20' 
                    : (formData.jenis_simpanan !== 'Sukarela' && formData.jenis_simpanan !== 'Semua')
                    ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                  disabled={formData.jenis_simpanan !== 'Sukarela' && formData.jenis_simpanan !== 'Semua'}
                >
                  Penarikan
                </button>
              </div>
              {formData.jenis_simpanan !== 'Sukarela' && formData.jenis_simpanan !== 'Semua' && (
                <p className="text-[10px] text-orange-500 font-bold italic mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> Penarikan hanya untuk Simpanan Sukarela.
                </p>
              )}
              {formData.jenis_simpanan === 'Semua' && (
                <p className="text-[10px] text-red-500 font-bold italic mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> Penarikan seluruh simpanan hanya untuk anggota keluar koperasi,.
                </p>
              )}
            </div>

            {/* Jenis Simpanan */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Info size={12} /> Jenis Simpanan
              </label>
              <select 
                name="jenis_simpanan"
                value={formData.jenis_simpanan}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#004A9C]/20 focus:border-[#004A9C] transition-all"
                required
              >
                <option value="Wajib">Simpanan Wajib</option>
                <option value="Sukarela">Simpanan Sukarela</option>
                <option value="Semua">Semua Simpanan (Tarik Seluruh)</option>
              </select>
            </div>
            </div>

          {/* Metode Pembayaran */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setFormData({...formData, metode_pembayaran: 'CASH'})}
                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${formData.metode_pembayaran === 'CASH' ? 'border-[#004A9C] bg-[#004A9C]/5 text-[#004A9C]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
              >
                <div className={`w-3 h-3 rounded-full ${formData.metode_pembayaran === 'CASH' ? 'bg-[#004A9C]' : 'bg-gray-200'}`} />
                TUNAI (CASH)
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, metode_pembayaran: 'BANK'})}
                className={`py-3 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${formData.metode_pembayaran === 'BANK' ? 'border-[#004A9C] bg-[#004A9C]/5 text-[#004A9C]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
              >
                <div className={`w-3 h-3 rounded-full ${formData.metode_pembayaran === 'BANK' ? 'bg-[#004A9C]' : 'bg-gray-200'}`} />
                TRANSFER (BANK)
              </button>
            </div>
          </div>

          {/* Nominal */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Nominal Transaksi (IDR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
              <Input 
                name="nominal"
                value={formData.nominal}
                onChange={handleInputChange}
                className={`pl-12 !text-lg !font-bold !py-4 ${
                  ((formData.jenis_simpanan === 'Pokok' || formData.jenis_simpanan === 'Wajib') && formData.jenis_transaksi === 'Setor') ||
                  formData.jenis_simpanan === 'Semua'
                  ? 'bg-gray-100 cursor-not-allowed opacity-80'
                  : ''
                }`}
                placeholder="0"
                required
                readOnly={((formData.jenis_simpanan === 'Pokok' || formData.jenis_simpanan === 'Wajib') && formData.jenis_transaksi === 'Setor') || formData.jenis_simpanan === 'Semua'}
              />
            </div>
            {formData.jenis_simpanan === 'Sukarela' && formData.jenis_transaksi === 'Setor' && configs.SIMPANAN_SUKARELA > 0 && (
              <p className="text-[10px] text-blue-600 font-bold italic mt-1 flex items-center gap-1">
                <Info size={10} /> Minimal setoran sukarela adalah {formatCurrency(configs.SIMPANAN_SUKARELA)}.
              </p>
            )}
            {formData.nominal && (
              <p className="text-xs text-gray-500 font-medium">
                Terbilang: <span className="font-bold text-[#004A9C]">{formatCurrency(formData.nominal.toString().replace(/\./g, ''))}</span>
              </p>
            )}
          </div>

          {/* Keterangan */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <FileText size={12} /> Keterangan (Opsional)
            </label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#004A9C]/20 focus:border-[#004A9C] transition-all resize-none"
              placeholder="Contoh: Setoran wajib bulan April..."
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-4">
             <Button 
               type="button" 
               variant="outline" 
               className="flex-1 !py-3"
               onClick={() => navigate('/admin/simpan-pinjam')}
             >
               Batal
             </Button>
             <Button 
               type="submit" 
               className={`flex-1 !py-3 flex justify-center items-center gap-2 ${formData.jenis_simpanan === 'Semua' ? '!bg-[#EB5757]' : ''}`}
               disabled={isSubmitting}
             >
               <Save size={18} />
               {isSubmitting ? 'Menyimpan...' : formData.jenis_simpanan === 'Semua' ? 'Tarik Semua Uang Anggota' : 'Simpan Transaksi'}
             </Button>
          </div>
        </form>
      </div>

      {/* Confirm Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        title={confirmModal.title}
        message={confirmModal.message}
        type="warning"
        confirmText="Ya, Simpan Transaksi"
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
