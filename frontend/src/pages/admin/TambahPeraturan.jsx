import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  X,
  Plus,
  Trash2,
  ShieldCheck,
  Type,
  FileText,
  DollarSign,
  Settings,
  Loader2,
  Hash
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Textarea from '../../components/atoms/Textarea';
import Modal from '../../components/molecules/Modal';
import { getIconComponent, availableIcons, iconColorPresets } from '../../utils/iconMap';
import { useAuth } from '../../context/AuthContext';

export default function TambahPeraturan() {
  const navigate = useNavigate();
  const { api } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const [rule, setRule] = useState({
    judul: '',
    deskripsi: '',
    kategori: 'Simpanan',
    ketentuan_utama: '',
    nilai_numerik: null,
    tujuan: '',
    syarat_ketentuan: [''],
    prosedur: [''],
    icon_name: 'FileText',
    icon_color: 'text-blue-600',
    icon_bg_color: 'bg-blue-50',
  });

  const handleSave = async () => {
    if (!rule.judul.trim()) {
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Validasi Gagal',
        message: 'Nama peraturan wajib diisi.',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Filter out empty strings from arrays
      const payload = {
        ...rule,
        syarat_ketentuan: rule.syarat_ketentuan.filter(s => s.trim()),
        prosedur: rule.prosedur.filter(s => s.trim()),
        nilai_numerik: rule.nilai_numerik || null,
      };

      const res = await api.post('/peraturan', payload);
      if (res.data.success) {
        setStatusModal({
          isOpen: true,
          type: 'success',
          title: 'Berhasil Ditambahkan',
          message: `Peraturan "${rule.judul}" berhasil ditambahkan ke database.`,
        });
      }
    } catch (error) {
      console.error('Error creating peraturan:', error);
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menyimpan',
        message: error.response?.data?.message || 'Terjadi kesalahan saat menambahkan peraturan.',
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
    if (rule.prosedur.length <= 1) return;
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
    if (rule.syarat_ketentuan.length <= 1) return;
    const newConditions = rule.syarat_ketentuan.filter((_, i) => i !== index);
    setRule({ ...rule, syarat_ketentuan: newConditions });
  };

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
            <h2 className="text-xl font-bold text-gray-800">Tambah Peraturan Baru</h2>
            <p className="text-sm text-gray-500">Buat peraturan baru untuk koperasi</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/konfigurasi')} className="flex items-center gap-2">
            <X size={18} />
            <span>Batal</span>
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-[#004A9C]">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Peraturan'}</span>
          </Button>
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
                  <Type size={16} /> Nama Peraturan <span className="text-red-500">*</span>
                </label>
                <Input 
                  value={rule.judul}
                  onChange={(e) => setRule({ ...rule, judul: e.target.value })}
                  placeholder="Contoh: Pinjaman Dana Tunai"
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
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <DollarSign size={16} /> Ketentuan Utama (Highlight)
                  </label>
                  <Input 
                    value={rule.ketentuan_utama}
                    onChange={(e) => setRule({ ...rule, ketentuan_utama: e.target.value })}
                    placeholder="Contoh: Max Rp 10.000.000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Settings size={16} /> Kategori <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={rule.kategori}
                    onChange={(e) => setRule({ ...rule, kategori: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004A9C]/50 focus:border-[#004A9C] bg-white text-gray-800"
                  >
                    <option value="Simpanan">Simpanan</option>
                    <option value="Pinjaman">Pinjaman</option>
                    <option value="Keanggotaan">Keanggotaan</option>
                  </select>
                </div>
              </div>

              {/* Nilai Numerik */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Hash size={16} /> Nilai Numerik <span className="text-xs text-gray-400 font-normal">(untuk kalkulasi otomatis, opsional)</span>
                </label>
                <Input 
                  type="number"
                  step="0.01"
                  value={rule.nilai_numerik || ''}
                  onChange={(e) => setRule({ ...rule, nilai_numerik: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Contoh: 1.00 untuk suku bunga 1%"
                />
                <p className="text-[11px] text-gray-400 italic">Nilai ini digunakan otomatis untuk kalkulasi (contoh: suku bunga pinjaman).</p>
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addProcedure}
                className="flex items-center gap-1 text-xs py-1.5"
              >
                <Plus size={14} /> Tambah Langkah
              </Button>
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
                      className="pr-10"
                    />
                    <button 
                      onClick={() => removeProcedure(index)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
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
            />
          </div>

          {/* Conditions Card */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <h4 className="font-bold text-gray-800 text-md">Syarat & Ketentuan</h4>
              <button onClick={addCondition} className="p-1 text-[#004A9C] hover:bg-[#DFEAF4] rounded-lg transition-colors">
                <Plus size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {rule.syarat_ketentuan.map((cond, index) => (
                <div key={index} className="flex gap-2 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#004A9C] mt-4 shrink-0"></div>
                  <textarea 
                    value={cond}
                    onChange={(e) => updateCondition(index, e.target.value)}
                    className="flex-1 text-sm text-gray-600 bg-transparent border-none focus:ring-0 p-0 leading-relaxed resize-none overflow-hidden"
                    rows={2}
                    placeholder="Masukkan syarat..."
                  />
                  <button 
                    onClick={() => removeCondition(index)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Icon Picker */}
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
