import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  X,
  Plus,
  Trash2,
  Info,
  Settings,
  ShieldCheck,
  Type,
  FileText,
  DollarSign,
  Clock,
  Loader2,
  Hash
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Textarea from '../../components/atoms/Textarea';
import Modal from '../../components/molecules/Modal';
import { getIconComponent, availableIcons, iconColorPresets } from '../../utils/iconMap';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { isSekretaris } from '../../utils/roles';

export default function EditRuleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const socket = useSocket();
  const canEdit = isSekretaris(user?.role);
  
  const [rule, setRule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  // Fetch peraturan from API
  useEffect(() => {
    const fetchRule = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/peraturan/${id}`);
        if (res.data.success) {
          const data = res.data.data;
          setRule({
            ...data,
            syarat_ketentuan: data.syarat_ketentuan || [],
            prosedur: data.prosedur || [],
          });
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

  // WebSocket listener: auto-update if edited from another tab
  useEffect(() => {
    if (!socket) return;

    const handleUpdated = (payload) => {
      if (payload.id === parseInt(id)) {
        console.log('📥 peraturan:updated (edit page)', payload);
        const data = payload.data;
        setRule(prev => ({
          ...prev,
          ...data,
          syarat_ketentuan: data.syarat_ketentuan || prev?.syarat_ketentuan || [],
          prosedur: data.prosedur || prev?.prosedur || [],
        }));
      }
    };

    socket.on('peraturan:updated', handleUpdated);
    return () => socket.off('peraturan:updated', handleUpdated);
  }, [socket, id]);

  const handleSave = async () => {
    if (!rule || isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        judul: rule.judul,
        deskripsi: rule.deskripsi,
        kategori: rule.kategori,
        ketentuan_utama: rule.ketentuan_utama,
        nilai_numerik: rule.nilai_numerik || null,
        tujuan: rule.tujuan,
        syarat_ketentuan: rule.syarat_ketentuan,
        prosedur: rule.prosedur,
        icon_name: rule.icon_name,
        icon_color: rule.icon_color,
        icon_bg_color: rule.icon_bg_color,
      };

      const res = await api.put(`/peraturan/${id}`, payload);
      if (res.data.success) {
        setStatusModal({
          isOpen: true,
          type: 'success',
          title: 'Berhasil Disimpan',
          message: `Peraturan "${rule.judul}" berhasil diperbarui.`,
        });
      }
    } catch (error) {
      console.error('Error updating peraturan:', error);
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menyimpan',
        message: error.response?.data?.message || 'Terjadi kesalahan saat menyimpan peraturan.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateProcedure = (index, value) => {
    const newProcedures = [...rule.prosedur];
    newProcedures[index] = value;
    setRule({ ...rule, prosedur: newProcedures });
  };

  const addProcedure = () => {
    setRule({ ...rule, prosedur: [...rule.prosedur, ''] });
  };

  const removeProcedure = (index) => {
    const newProcedures = rule.prosedur.filter((_, i) => i !== index);
    setRule({ ...rule, prosedur: newProcedures });
  };

  const updateCondition = (index, value) => {
    const newConditions = [...rule.syarat_ketentuan];
    newConditions[index] = value;
    setRule({ ...rule, syarat_ketentuan: newConditions });
  };

  const addCondition = () => {
    setRule({ ...rule, syarat_ketentuan: [...rule.syarat_ketentuan, ''] });
  };

  const removeCondition = (index) => {
    const newConditions = rule.syarat_ketentuan.filter((_, i) => i !== index);
    setRule({ ...rule, syarat_ketentuan: newConditions });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="text-[#004A9C] animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Memuat data peraturan...</p>
      </div>
    );
  }

  if (!rule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <Info size={40} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Peraturan Tidak Ditemukan</h2>
        <Button onClick={() => navigate('/admin/konfigurasi')} className="mt-6">Kembali ke Daftar</Button>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const IconPreview = getIconComponent(rule.icon_name);

  return (
    <motion.div 
      className="space-y-6 max-w-5xl mx-auto pb-12"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/konfigurasi')}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-[#004A9C] hover:bg-white hover:shadow-sm transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{canEdit ? 'Edit Peraturan' : 'Detail Peraturan'}</h2>
            <p className="text-sm text-gray-500">ID: #RULE-{rule.peraturan_id} {!canEdit && '(View Only)'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/konfigurasi')} className="flex items-center gap-2">
            <X size={18} />
            <span>{canEdit ? 'Batal' : 'Kembali'}</span>
          </Button>
          {canEdit && (
            <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-[#004A9C]">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-[#004A9C] mb-2 border-b border-gray-50 pb-4">
              <ShieldCheck size={20} />
              <h3 className="font-bold text-lg">Informasi Dasar</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Settings size={16} /> Kategori
                </label>
                <select 
                  value={rule.kategori}
                  onChange={(e) => setRule({ ...rule, kategori: e.target.value })}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004A9C]/50 focus:border-[#004A9C] bg-white text-gray-800 ${!canEdit ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  disabled={!canEdit}
                >
                  <option value="Simpanan">Simpanan</option>
                  <option value="Pinjaman">Pinjaman</option>
                  <option value="Keanggotaan">Keanggotaan</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Type size={16} /> Nama Peraturan
                </label>
                <Input 
                  value={rule.judul}
                  onChange={(e) => setRule({ ...rule, judul: e.target.value })}
                  placeholder="Contoh: Pinjaman Dana Tunai"
                  disabled={!canEdit}
                  className={!canEdit ? 'bg-gray-50' : ''}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText size={16} /> Deskripsi Singkat
                </label>
                <Textarea 
                  value={rule.deskripsi}
                  onChange={(e) => setRule({ ...rule, deskripsi: e.target.value })}
                  placeholder="Berikan penjelasan singkat mengenai peraturan ini..."
                  disabled={!canEdit}
                  className={!canEdit ? 'bg-gray-50' : ''}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} /> Ketentuan & Nilai Numerik
                    </div>
                    {!canEdit && <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-400">ReadOnly</span>}
                  </label>
                  <div className="relative group">
                    <Input 
                      value={rule.ketentuan_utama}
                      onChange={(e) => {
                        const val = e.target.value;
                        const judulLower = rule.judul.toLowerCase();
                        
                        // Strip ALL non-digit characters to get the raw number
                        // This prevents "Rp 10.000" from being parsed as 10.000 (= 10)
                        const digitsOnly = val.replace(/[^0-9]/g, '');
                        
                        if (!digitsOnly) {
                          setRule({ ...rule, ketentuan_utama: val, nilai_numerik: null });
                          return;
                        }

                        const numeric = parseFloat(digitsOnly);
                        
                        // Auto-format for Bunga (percentage-based rules)
                        if (judulLower.includes('bunga') || judulLower.includes('suku')) {
                          setRule({ ...rule, ketentuan_utama: `${numeric}% Total`, nilai_numerik: numeric });
                          return;
                        }
                        
                        // Auto-format for Rupiah-based rules (simpanan, pinjaman, limit, maksimal)
                        if (judulLower.includes('simpanan') || judulLower.includes('pinjaman') || judulLower.includes('limit') || judulLower.includes('maksimal')) {
                          const formatted = new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            maximumFractionDigits: 0
                          }).format(numeric);
                          const suffix = judulLower.includes('limit') ? ' / bln' : '';
                          setRule({ ...rule, ketentuan_utama: formatted + suffix, nilai_numerik: numeric });
                          return;
                        }

                        // Auto-format for multiplier rules
                        if (judulLower.includes('kelipatan')) {
                          setRule({ ...rule, ketentuan_utama: `${numeric}x Total Simpanan`, nilai_numerik: numeric });
                          return;
                        }
                        
                        // Fallback: keep text as-is with extracted numeric
                        setRule({ ...rule, ketentuan_utama: val, nilai_numerik: numeric });
                      }}
                      placeholder="Masukkan nominal atau ketentuan (Contoh: 100000)"
                      disabled={!canEdit}
                      className={`!text-lg !font-bold ${!canEdit ? 'bg-gray-50' : 'group-hover:border-[#004A9C]/30 focus:border-[#004A9C]'}`}
                    />
                    {rule.nilai_numerik !== null && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-lg border border-green-100">
                        <Hash size={12} className="text-green-600" />
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">System Value: {rule.nilai_numerik}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 italic">
                    {rule.judul.toLowerCase().includes('bunga') 
                      ? "Ketik angka persentase saja (misal: 10 untuk 10%)."
                      : rule.judul.toLowerCase().includes('limit') || rule.judul.toLowerCase().includes('pinjaman') || rule.judul.toLowerCase().includes('simpanan')
                        ? "Ketik angka nominal saja (misal: 2000000 untuk Rp 2.000.000)."
                        : "Ketik nominal atau teks ketentuan utama."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Procedures Card */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
              <div className="flex items-center gap-2 text-[#004A9C]">
                <Settings size={20} />
                <h3 className="font-bold text-lg">Prosedur Pengajuan</h3>
              </div>
              {canEdit && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={addProcedure}
                  className="flex items-center gap-1 text-xs py-1.5"
                >
                  <Plus size={14} /> Tambah Langkah
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {rule.prosedur.map((step, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center font-bold text-[#004A9C] shrink-0 text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 relative group">
                    <Input 
                      value={step}
                      onChange={(e) => updateProcedure(index, e.target.value)}
                      placeholder={`Langkah ${index + 1}...`}
                      className={`pr-10 ${!canEdit ? 'bg-gray-50' : ''}`}
                      disabled={!canEdit}
                    />
                    {canEdit && (
                      <button 
                        onClick={() => removeProcedure(index)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {rule.prosedur.length === 0 && (
                <p className="text-sm text-gray-400 italic text-center py-4">Belum ada prosedur. Klik "Tambah Langkah" untuk menambahkan.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info Form */}
        <div className="space-y-6">
          {/* Purpose Card */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <h4 className="font-bold text-gray-800 text-md border-b border-gray-50 pb-3">Tujuan Kebijakan</h4>
            <Textarea 
              value={rule.tujuan}
              onChange={(e) => setRule({ ...rule, tujuan: e.target.value })}
              rows={5}
              placeholder="Apa tujuan utama dari kebijakan ini?"
              disabled={!canEdit}
              className={!canEdit ? 'bg-gray-50' : ''}
            />
          </div>

          {/* Conditions Card */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h4 className="font-bold text-gray-800 text-md">Syarat & Ketentuan</h4>
              {canEdit && (
                <button onClick={addCondition} className="p-1 text-[#004A9C] hover:bg-[#DFEAF4] rounded-lg transition-colors">
                  <Plus size={18} />
                </button>
              )}
            </div>
            <div className="space-y-3">
              {rule.syarat_ketentuan.map((cond, index) => (
                <div key={index} className="flex gap-2 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#004A9C] mt-4 shrink-0"></div>
                  <textarea 
                    value={cond}
                    onChange={(e) => updateCondition(index, e.target.value)}
                    className={`flex-1 text-sm text-gray-600 bg-transparent border-none focus:ring-0 p-0 leading-relaxed resize-none overflow-hidden ${!canEdit ? 'cursor-default' : ''}`}
                    rows={2}
                    placeholder="Masukkan syarat..."
                    disabled={!canEdit}
                  />
                  {canEdit && (
                    <button 
                      onClick={() => removeCondition(index)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {rule.syarat_ketentuan.length === 0 && (
                <p className="text-sm text-gray-400 italic text-center py-2">Belum ada syarat.</p>
              )}
            </div>
          </div>

          {/* Icon Picker */}
          {canEdit && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-800 text-md border-b border-gray-50 pb-3">Icon & Warna</h4>
              
              {/* Icon Preview */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 ${rule.icon_bg_color} ${rule.icon_color} rounded-xl flex items-center justify-center`}>
                  <IconPreview size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-600">{rule.icon_name}</p>
                  <p className="text-[10px] text-gray-400">Preview icon</p>
                </div>
              </div>

              {/* Icon Select */}
              <select
                value={rule.icon_name}
                onChange={(e) => setRule({ ...rule, icon_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#004A9C]/50"
              >
                {availableIcons.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              {/* Color Preset */}
              <div className="flex flex-wrap gap-2 mt-2">
                {iconColorPresets.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => setRule({ ...rule, icon_color: preset.color, icon_bg_color: preset.bg })}
                    className={`w-8 h-8 rounded-lg ${preset.bg} border-2 transition-all ${
                      rule.icon_color === preset.color ? 'border-[#004A9C] scale-110' : 'border-transparent hover:border-gray-300'
                    }`}
                    title={preset.label}
                  >
                    <div className={`w-3 h-3 rounded-full ${preset.color.replace('text-', 'bg-')} mx-auto`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Terakhir Diperbarui (replaces tags) */}
          <div className="bg-[#DFEAF4]/30 p-6 rounded-3xl border border-[#004A9C]/10 space-y-4">
            <h4 className="font-bold text-[#004A9C] text-sm uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} />
              Terakhir Diperbarui
            </h4>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">{formatDate(rule.updated_at)}</p>
              {rule.updater && (
                <p className="text-xs text-gray-400 italic">oleh {rule.updater.email}</p>
              )}
              <p className="text-xs text-gray-400 italic mt-2">
                Dibuat: {formatDate(rule.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      <Modal
        isOpen={statusModal.isOpen}
        onClose={() => {
          setStatusModal({ ...statusModal, isOpen: false });
          if (statusModal.type === 'success') {
            navigate('/admin/konfigurasi');
          }
        }}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        confirmText="OK"
      />
    </motion.div>
  );
}
