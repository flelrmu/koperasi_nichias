import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  Save,
  Loader2,
  Calendar
} from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Select from '../../components/atoms/Select';
import Textarea from '../../components/atoms/Textarea';
import Modal from '../../components/molecules/Modal';
import { useAuth } from '../../context/AuthContext';

const JABATAN_ANGGOTA_OPTIONS = [
  { value: "", label: "-- Pilih Jabatan --" },
  { value: "Staff", label: "Staff" },
  { value: "Assistant_Manager", label: "Assistant Manager" },
  { value: "Manager", label: "Manager" },
];

const DIVISI_OPTIONS = [
  { value: "", label: "-- Pilih Divisi --" },
  { value: "Marketing", label: "Marketing" },
  { value: "Purchasing", label: "Purchasing" },
  { value: "HRD", label: "HRD" },
  { value: "Admin", label: "Admin" },
  { value: "Keuangan", label: "Keuangan" },
];

const ROLE_PENGURUS_OPTIONS = [
  { value: "", label: "-- Pilih Role --" },
  { value: "Ketua", label: "Ketua" },
  { value: "Wakil_Ketua", label: "Wakil Ketua" },
  { value: "Sekretaris", label: "Sekretaris" },
  { value: "Bendahara", label: "Bendahara" },
  { value: "Koordinator_Simpan_Pinjam", label: "Koordinator Simpan Pinjam" },
];

export default function EditUser() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    nama_lengkap: '',
    no_identitas: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    jabatan: '',
    divisi: '',
    no_hp: '',
    no_rekening_bank: '',
    alamat: '',
    role: '',
  });

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  useEffect(() => {
    document.title = `Koperasi Nichias | Edit ${type}`;
    fetchUserDetail();
  }, [id, type]);

  const fetchUserDetail = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/user/${type}/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        setFormData({
          email: data.user?.email || '',
          nama_lengkap: data.nama_lengkap || '',
          no_identitas: data.no_identitas || '',
          tempat_lahir: data.tempat_lahir || '',
          tanggal_lahir: data.tanggal_lahir || '',
          jabatan: data.jabatan || '',
          divisi: data.divisi || '',
          no_hp: data.no_hp || '',
          no_rekening_bank: data.no_rekening_bank || '',
          alamat: data.alamat || '',
          role: data.user?.role || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user detail:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Gagal mengambil data user.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await api.put(`/user/${type}/${id}`, formData);

      if (response.data.success) {
        setModalConfig({
          isOpen: true,
          type: 'success',
          title: 'Berhasil!',
          message: `Data ${type} berhasil diperbarui.`,
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan sistem.';
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Gagal Update',
        message: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    setModalConfig({ ...modalConfig, isOpen: false });
    if (modalConfig.type === 'success') {
      navigate('/admin/users');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.98, y: -10, transition: { duration: 0.2 } }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-[#004A9C]" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Memuat Data User...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-gray-500 hover:text-[#004A9C] transition-colors group"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:border-[#004A9C]/30 group-hover:bg-[#DFEAF4]/30 transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">Kembali</span>
        </button>

        <div className="flex items-center gap-3 bg-gradient-to-r from-[#DFEAF4]/80 to-white px-4 py-2 rounded-2xl border border-[#004A9C]/10 shadow-sm">
          <Sparkles size={16} className="text-[#004A9C]" />
          <span className="text-[11px] font-bold text-[#004A9C] uppercase tracking-widest">
            Perbarui Data {type}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 sticky top-6">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-[#DFEAF4] rounded-2xl flex items-center justify-center text-[#004A9C] text-3xl font-bold mb-4">
                 {formData.nama_lengkap?.charAt(0)}
              </div>
              <h1 className="text-xl font-bold text-gray-800 text-center">{formData.nama_lengkap}</h1>
              <p className="text-xs text-gray-400 text-center uppercase tracking-widest font-bold mt-1">{type}</p>
            </div>

            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
               <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Peringatan</h4>
                    <p className="text-[10px] text-amber-600/80 mt-1 leading-relaxed">
                      Perubahan data akan langsung sinkron dengan seluruh sistem secara real-time.
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={containerVariants}
              className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20"
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex items-center gap-5 border-b border-gray-50 pb-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#DFEAF4] to-white rounded-2xl flex items-center justify-center text-[#004A9C] shadow-inner">
                    {type === 'anggota' ? <Users size={28} /> : <ShieldCheck size={28} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Edit Detail {type === 'anggota' ? 'Anggota' : 'Pengurus'}</h2>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                      <span className="w-8 h-px bg-gray-200 inline-block"></span>
                      Data Autentikasi & Biodata
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Account Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Email Perusahaan</label>
                      <Input
                        name="email"
                        type="email"
                        className="bg-gray-50/50"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled // Email usually fixed
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Nama Lengkap</label>
                      <Input
                        name="nama_lengkap"
                        value={formData.nama_lengkap}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {type === 'anggota' ? (
                    <div className="space-y-8 pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Nomor KTP</label>
                          <Input
                            name="no_identitas"
                            value={formData.no_identitas}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Tempat Lahir</label>
                            <Input
                              name="tempat_lahir"
                              value={formData.tempat_lahir}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Tgl Lahir</label>
                            <div className="relative">
                              <DatePicker
                                selected={formData.tanggal_lahir ? new Date(formData.tanggal_lahir) : null}
                                onChange={(date) => setFormData(prev => ({ ...prev, tanggal_lahir: date ? date.toISOString().split('T')[0] : "" }))}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="DD/MM/YYYY"
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                maxDate={new Date()}
                                className="w-full !py-2.5 px-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004A9C]/20 transition-all text-gray-700 font-medium lg:text-[12px] text-base"
                                required
                              />
                              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                          </div>

                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Level Jabatan</label>
                          <Select
                            name="jabatan"
                            options={JABATAN_ANGGOTA_OPTIONS}
                            value={formData.jabatan}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Divisi Kerja</label>
                          <Select
                            name="divisi"
                            options={DIVISI_OPTIONS}
                            value={formData.divisi}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">WhatsApp</label>
                          <Input
                            name="no_hp"
                            value={formData.no_hp}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">No. Rekening</label>
                          <Input
                            name="no_rekening_bank"
                            value={formData.no_rekening_bank}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Alamat Domisili</label>
                          <Textarea
                            name="alamat"
                            rows={3}
                            value={formData.alamat}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 pt-6">
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Jabatan Struktural (Role)</label>
                          <Select
                            name="role"
                            options={ROLE_PENGURUS_OPTIONS}
                            value={formData.role}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">WhatsApp</label>
                          <Input
                            name="no_hp"
                            value={formData.no_hp}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Alamat</label>
                          <Textarea
                            name="alamat"
                            rows={3}
                            value={formData.alamat}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-4 pt-10 border-t border-gray-50">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => navigate('/admin/users')}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                    className="min-w-[200px] flex items-center justify-center gap-3 shadow-lg shadow-[#004A9C]/20"
                  >
                    {isSaving ? "Menyimpan..." : (
                      <>
                        <Save size={18} />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
        </div>
      </div>

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={handleModalClose}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText="Kembali ke Daftar User"
      />
    </div>
  );
}
