import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  Users, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Info,
  Sparkles,
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

export default function TambahUser() {
  const navigate = useNavigate();
  const { api } = useAuth();
  
  const [activeTab, setActiveTab] = useState('anggota'); // 'anggota' or 'pengurus'
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Set page title for SEO/UX
  useEffect(() => {
    document.title = "Koperasi Nichias | Tambah User Baru";
  }, []);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    metode_pembayaran: 'CASH',
  });

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        type: activeTab === 'anggota' ? 'Anggota' : 'Pengurus',
      };

      const response = await api.post('/auth/admin/create-user', payload);

      if (response.data.success) {
        setModalConfig({
          isOpen: true,
          type: 'success',
          title: 'Berhasil!',
          message: `User ${activeTab} baru berhasil dibuat. Akun sekarang aktif dan dapat digunakan untuk login.`,
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Terjadi kesalahan sistem. Silakan periksa kembali data input atau hubungi IT.';
      
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Gagal Membuat User',
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          id="btn-back-to-users"
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-gray-500 hover:text-[#004A9C] transition-colors group"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:border-[#004A9C]/30 group-hover:bg-[#DFEAF4]/30 transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">Kembali</span>
        </button>

        <div className="flex items-center gap-3 bg-gradient-to-r from-[#DFEAF4]/80 to-white px-4 py-2 rounded-2xl border border-[#004A9C]/10 shadow-sm animate-pulse-subtle">
          <Sparkles size={16} className="text-[#004A9C]" />
          <span className="text-[11px] font-bold text-[#004A9C] uppercase tracking-widest">
            Penambahan User Administratif
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Selector & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 sticky top-6">
            <div>
              <h1 className="text-2xl font-bold text-[#004A9C]">Tambah User</h1>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Pilih kategori user di bawah ini. Sesuai Instruksi Master, form Anggota mengikuti standar registrasi publik.
              </p>
            </div>

            <nav className="space-y-3">
              <button
                id="tab-anggota"
                onClick={() => setActiveTab('anggota')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${
                  activeTab === 'anggota'
                    ? 'bg-[#004A9C] border-[#004A9C] text-white shadow-xl shadow-[#004A9C]/30 translate-x-1'
                    : 'bg-white border-gray-50 text-gray-400 hover:border-[#DFEAF4] hover:bg-[#DFEAF4]/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${activeTab === 'anggota' ? 'bg-white/20' : 'bg-gray-50'}`}>
                    <Users size={20} className={activeTab === 'anggota' ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${activeTab === 'anggota' ? 'text-white' : 'text-gray-700'}`}>Anggota</p>
                    <p className={`text-[10px] ${activeTab === 'anggota' ? 'text-blue-100' : 'text-gray-400'}`}>Karyawan Koperasi</p>
                  </div>
                </div>
                <ChevronRight size={18} className={`transition-transform duration-300 ${activeTab === 'anggota' ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
              </button>

              <button
                id="tab-pengurus"
                onClick={() => setActiveTab('pengurus')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${
                  activeTab === 'pengurus'
                    ? 'bg-[#004A9C] border-[#004A9C] text-white shadow-xl shadow-[#004A9C]/30 translate-x-1'
                    : 'bg-white border-gray-50 text-gray-400 hover:border-[#DFEAF4] hover:bg-[#DFEAF4]/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${activeTab === 'pengurus' ? 'bg-white/20' : 'bg-gray-50'}`}>
                    <ShieldCheck size={20} className={activeTab === 'pengurus' ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${activeTab === 'pengurus' ? 'text-white' : 'text-gray-700'}`}>Pengurus</p>
                    <p className={`text-[10px] ${activeTab === 'pengurus' ? 'text-blue-100' : 'text-gray-400'}`}>Manajemen Internal</p>
                  </div>
                </div>
                <ChevronRight size={18} className={`transition-transform duration-300 ${activeTab === 'pengurus' ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
              </button>
            </nav>

            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
               <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Penting</h4>
                    <p className="text-[10px] text-amber-600/80 mt-1 leading-relaxed">
                      Sistem akan memvalidasi domain email sesuai standar perusahaan (@koperasi-nichias.co.id).
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Form */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={containerVariants}
              className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20"
            >
              <form id="form-tambah-user" onSubmit={handleSubmit} className="space-y-8">
                <div className="flex items-center gap-5 border-b border-gray-50 pb-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#DFEAF4] to-white rounded-2xl flex items-center justify-center text-[#004A9C] shadow-inner">
                    {activeTab === 'anggota' ? <Users size={28} /> : <ShieldCheck size={28} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Formulir {activeTab === 'anggota' ? 'Anggota' : 'Pengurus'}</h2>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                      <span className="w-8 h-px bg-gray-200 inline-block"></span>
                      Data Autentikasi Sistem
                    </p>
                  </div>
                </div>

                {/* Form Sections */}
                <div className="space-y-6">
                  {/* Common Fields: Auth */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Email Perusahaan</label>
                      <Input
                        id="input-email"
                        name="email"
                        type="email"
                        placeholder="email@koperasi-nichias.co.id"
                        className="!py-3 bg-gray-50/50 border-gray-100 focus:bg-white transition-all shadow-sm focus:shadow-md"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Akses Password</label>
                      <div className="relative">
                        <Input
                          id="input-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="!py-3 pr-12 bg-gray-50/50 border-gray-100 focus:bg-white transition-all shadow-sm focus:shadow-md"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#004A9C] transition-colors"

                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Nama Lengkap Sesuai ID</label>
                      <Input
                        id="input-nama"
                        name="nama_lengkap"
                        placeholder="Contoh: Ahmad Subardjo"
                        className="!py-3 bg-gray-50/50 border-gray-100 focus:bg-white transition-all shadow-sm focus:shadow-md"
                        value={formData.nama_lengkap}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {activeTab === 'anggota' ? (
                    /* Anggota Specific Fields */
                    <motion.div 
                      key="fields-anggota"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8 pt-6"
                    >
                      <div className="flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-[#004A9C] rounded-full"></div>
                         <span className="text-xs font-bold text-[#004A9C] uppercase tracking-widest">Biodata & Keanggotaan</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Nomor KTP (16 Digit)</label>
                          <Input
                            id="input-nik"
                            name="no_identitas"
                            placeholder="32xxxxxxxxxxxxxx"
                            className="bg-white border-gray-200"
                            value={formData.no_identitas}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Tempat Lahir</label>
                            <Input
                              id="input-tempat-lahir"
                              name="tempat_lahir"
                              placeholder="Kota"
                              className="bg-white border-gray-200"
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
                                className="w-full !py-3 px-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004A9C]/20 transition-all text-gray-700 font-medium lg:text-[12px] text-base"
                                required
                              />
                              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                            </div>
                          </div>

                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Level Jabatan</label>
                          <Select
                            id="select-jabatan"
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
                            id="select-divisi"
                            name="divisi"
                            options={DIVISI_OPTIONS}
                            value={formData.divisi}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-[#004A9C] rounded-full"></div>
                         <span className="text-xs font-bold text-[#004A9C] uppercase tracking-widest">Informasi Kontak</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Nomor WhatsApp Aktif</label>
                          <Input
                            id="input-wa"
                            name="no_hp"
                            placeholder="08xxxxxxxxxx"
                            className="bg-white border-gray-200"
                            value={formData.no_hp}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Rekening Gaji (Bank)</label>
                          <Input
                            id="input-rek"
                            name="no_rekening_bank"
                            placeholder="Masukkan nomor rekening"
                            className="bg-white border-gray-200"
                            value={formData.no_rekening_bank}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Alamat Domisili Lengkap</label>
                          <Textarea
                            id="input-alamat"
                            name="alamat"
                            placeholder="Alamat lengkap sesuai KTP/Domisili"
                            rows={3}
                            className="bg-white border-gray-200 resize-none"
                            value={formData.alamat}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="md:col-span-2 space-y-3 pt-4">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Metode Simpanan Pokok Awal</label>
                          <div className="grid grid-cols-2 gap-4">
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, metode_pembayaran: 'CASH'})}
                              className={`py-4 rounded-2xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-3 ${formData.metode_pembayaran === 'CASH' ? 'border-[#004A9C] bg-[#004A9C]/5 text-[#004A9C]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                            >
                              <div className={`w-3.5 h-3.5 rounded-full border-2 ${formData.metode_pembayaran === 'CASH' ? 'border-[#004A9C] bg-[#004A9C]' : 'border-gray-200'}`} />
                              TUNAI (CASH)
                            </button>
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, metode_pembayaran: 'BANK'})}
                              className={`py-4 rounded-2xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-3 ${formData.metode_pembayaran === 'BANK' ? 'border-[#004A9C] bg-[#004A9C]/5 text-[#004A9C]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                            >
                              <div className={`w-3.5 h-3.5 rounded-full border-2 ${formData.metode_pembayaran === 'BANK' ? 'border-[#004A9C] bg-[#004A9C]' : 'border-gray-200'}`} />
                              TRANSFER (BANK)
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-400 italic ml-1">*Pilih bagaimana uang simpanan pokok diterima oleh koperasi.</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    /* Pengurus Specific Fields */
                    <motion.div 
                      key="fields-pengurus"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8 pt-6"
                    >
                      <div className="flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-[#004A9C] rounded-full"></div>
                         <span className="text-xs font-bold text-[#004A9C] uppercase tracking-widest">Konfigurasi Hak Akses</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Jabatan Struktural</label>
                          <Select
                            id="select-role"
                            name="role"
                            options={ROLE_PENGURUS_OPTIONS}
                            value={formData.role}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100/50 flex items-start gap-4 shadow-sm">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#004A9C] shadow-sm shrink-0">
                            <ShieldCheck size={20} />
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                            Akses dashboard akan disesuaikan secara otomatis berdasarkan pilihan role di atas. Role ini memiliki kewenangan administratif.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-4 pt-10 border-t border-gray-50">
                  <Button 
                    id="btn-cancel"
                    type="button" 
                    variant="outline"
                    onClick={() => navigate('/admin/users')}
                    className="hover:bg-gray-50 !py-3 !px-8 border-gray-200 text-gray-500 font-bold"
                  >
                    Batal
                  </Button>
                  <Button 
                    id="btn-submit"
                    type="submit" 
                    disabled={isLoading}
                    className="min-w-[200px] !py-3 !px-8 flex items-center justify-center gap-3 shadow-lg shadow-[#004A9C]/20"
                  >
                    {isLoading ? "Sinkronisasi..." : (
                      <>
                        <UserPlus size={18} />
                        <span>Daftarkan {activeTab === 'anggota' ? 'Anggota' : 'Pengurus'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>
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
