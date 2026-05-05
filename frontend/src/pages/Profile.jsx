import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, User, Mail, CreditCard, Phone, MapPin, Briefcase, Building, Landmark, Lock, LogOut, Save, Loader2, Calendar } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import StatusBadge from '../components/atoms/StatusBadge';
import Modal from '../components/molecules/Modal';

export default function Profile() {
  const navigate = useNavigate();
  const { user, api } = useAuth();
  const socket = useSocket();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPwd, setIsSavingPwd] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  // State for profile data
  const [profileData, setProfileData] = useState({
    nama: '',
    email: '',
    noIdentitas: '',
    noHp: '',
    tempatLahir: '',
    tanggalLahir: '',
    jabatan: '',
    unitKerja: '',
    alamat: '',
    noRekening: '',
    fotoProfil: '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/user/profile');
        if (response.data.success) {
          const data = response.data.data;
          setProfileData({
            nama: data.nama_lengkap || '',
            email: data.user?.email || '',
            noIdentitas: data.no_identitas || '',
            noHp: data.no_hp || '',
            tempatLahir: data.tempat_lahir || '',
            tanggalLahir: data.tanggal_lahir || '',
            jabatan: data.jabatan || '',
            unitKerja: data.divisi || '',
            alamat: data.alamat || '',
            noRekening: data.no_rekening_bank || '',
            fotoProfil: data.foto_profil || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [api]);

  useEffect(() => {
    if (!socket || !user) return;
    const handleUserUpdate = (e) => {
      if (e.type === 'anggota' && e.data.user_id === user.user_id) {
         const data = e.data;
         setProfileData(prev => ({
            ...prev,
            nama: data.nama_lengkap || '',
            email: data.user?.email || '',
            noIdentitas: data.no_identitas || '',
            noHp: data.no_hp || '',
            tempatLahir: data.tempat_lahir || '',
            tanggalLahir: data.tanggal_lahir || '',
            jabatan: data.jabatan || '',
            unitKerja: data.divisi || '',
            alamat: data.alamat || '',
            noRekening: data.no_rekening_bank || '',
            fotoProfil: data.foto_profil || '',
         }));
      }
    };
    socket.on('user:updated', handleUserUpdate);
    return () => socket.off('user:updated', handleUserUpdate);
  }, [socket, user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      setStatusModal({ isOpen: true, type: 'success', title: 'Mengunggah', message: 'Sedang mengunggah foto profil...' });
      const res = await api.post('/user/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setStatusModal({ isOpen: true, type: 'success', title: 'Berhasil', message: 'Foto profil berhasil diperbarui.' });
        setProfileData(prev => ({ ...prev, fotoProfil: res.data.foto_profil }));
      }
    } catch(err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: err.response?.data?.message || 'Gagal mengunggah foto profil.' });
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const dbFormat = {
        no_hp: profileData.noHp,
        tempat_lahir: profileData.tempatLahir,
        tanggal_lahir: profileData.tanggalLahir,
        alamat: profileData.alamat,
        no_rekening_bank: profileData.noRekening
      };
      const res = await api.put('/user/profile', dbFormat);
      if (res.data.success) {
        setStatusModal({ isOpen: true, type: 'success', title: 'Berhasil', message: 'Profil Anda berhasil diperbarui.' });
      }
    } catch(err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: err.response?.data?.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Error', message: 'Konfirmasi password tidak cocok!' });
      return;
    }
    setIsSavingPwd(true);
    try {
      const res = await api.put('/user/profile/password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      if (res.data.success) {
        setStatusModal({ isOpen: true, type: 'success', title: 'Berhasil', message: 'Password Anda berhasil diubah.' });
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch(err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: err.response?.data?.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setIsSavingPwd(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={40} className="animate-spin text-[#004A9C]" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Memuat Profil...</p>
      </div>
    );
  }

  const userInitials = profileData.nama ? profileData.nama.charAt(0).toUpperCase() : 'U';

  return (
    <motion.div 
      className="space-y-6 max-w-5xl mx-auto pb-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Profil Anggota</h2>
          <p className="text-gray-500 mt-1">Kelola informasi pribadi dan keamanan akun Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary */}
        <motion.div variants={itemVariants} className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col items-center text-center">
            <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/jpeg, image/png, image/webp" 
                className="hidden" 
              />
              <div className="w-32 h-32 rounded-full bg-[#DFEAF4] border-4 border-white shadow-md flex items-center justify-center text-[#004A9C] text-4xl font-bold overflow-hidden transition-transform group-hover:scale-105">
                {profileData.fotoProfil ? (
                  <img src={`http://localhost:5000${profileData.fotoProfil}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userInitials
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2.5 bg-[#004A9C] text-white rounded-full shadow-lg hover:bg-[#0a3d80] transition-transform group-hover:scale-110">
                <Camera size={18} />
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-800">{profileData.nama}</h3>
            <p className="text-gray-500 text-sm mb-3">{profileData.jabatan}</p>
            <StatusBadge status="Aktif" />
            
            <div className="w-full mt-6 pt-6 border-t border-gray-100 text-left space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email</span>
                <div className="flex items-center text-gray-700 text-sm font-medium">
                  <Mail size={16} className="mr-3 text-[#004A9C]/70" />
                  <span className="truncate">{profileData.email}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">No. Handphone</span>
                <div className="flex items-center text-gray-700 text-sm font-medium">
                  <Phone size={16} className="mr-3 text-[#004A9C]/70" />
                  <span>{profileData.noHp}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Unit Kerja</span>
                <div className="flex items-center text-gray-700 text-sm font-medium">
                  <Building size={16} className="mr-3 text-[#004A9C]/70" />
                  <span>{profileData.unitKerja}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Forms */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          
          {/* Profile Details Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <User size={20} className="mr-2 text-[#004A9C]" />
                Detail Informasi Personal
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={16} className="text-gray-400" />
                      </div>
                      <Input 
                        name="nama"
                        value={profileData.nama}
                        disabled
                        className="pl-10 bg-gray-50/70 text-gray-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Email Utama</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={16} className="text-gray-400" />
                      </div>
                      <Input 
                        type="email"
                        name="email"
                        value={profileData.email}
                        disabled
                        className="pl-10 bg-gray-50/70 text-gray-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Nomor Identitas (KTP)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CreditCard size={16} className="text-gray-400" />
                      </div>
                      <Input 
                        name="noIdentitas"
                        value={profileData.noIdentitas}
                        disabled
                        className="pl-10 bg-gray-50/70 text-gray-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Nomor Handphone</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={16} className="text-gray-400" />
                      </div>
                      <Input 
                        name="noHp"
                        value={profileData.noHp}
                        onChange={handleProfileChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Tempat Lahir</label>
                    <Input 
                      name="tempatLahir"
                      value={profileData.tempatLahir}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Tanggal Lahir</label>
                    <div className="relative">
                      <DatePicker 
                        selected={profileData.tanggalLahir ? new Date(profileData.tanggalLahir) : null}
                        onChange={(date) => setProfileData(prev => ({ ...prev, tanggalLahir: date ? date.toISOString().split('T')[0] : '' }))}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="DD/MM/YYYY"
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        maxDate={new Date()}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004A9C]/50 focus:border-[#004A9C] transition-all text-gray-700 font-medium lg:text-[14px] text-base"
                        required
                      />
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Jabatan</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase size={16} className="text-gray-400" />
                      </div>
                      <Input 
                        name="jabatan"
                        value={profileData.jabatan}
                        disabled
                        className="pl-10 bg-gray-50/70 text-gray-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Unit Kerja</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building size={16} className="text-gray-400" />
                      </div>
                      <Input 
                        name="unitKerja"
                        value={profileData.unitKerja}
                        disabled
                        className="pl-10 bg-gray-50/70 text-gray-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Nomor Rekening Bank</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Landmark size={16} className="text-gray-400" />
                      </div>
                      <Input 
                        name="noRekening"
                        value={profileData.noRekening}
                        onChange={handleProfileChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Alamat Lengkap</label>
                    <div className="relative w-full">
                      <div className="absolute top-3.5 left-3 pointer-events-none">
                        <MapPin size={16} className="text-gray-400" />
                      </div>
                      <textarea 
                        name="alamat"
                        value={profileData.alamat}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004A9C]/50 focus:border-[#004A9C] transition-all text-gray-700 min-h-[100px] text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSaving} className="flex items-center">
                    {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Lock size={20} className="mr-2 text-[#004A9C]" />
                Keamanan & Password
              </h3>
            </div>
            <div className="p-6">
              <form onSubmit={handleSavePassword} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Password Saat Ini</label>
                    <Input 
                      type="password"
                      name="oldPassword"
                      placeholder="Masukkan password saat ini"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Password Baru</label>
                    <Input 
                      type="password"
                      name="newPassword"
                      placeholder="Minimal 8 karakter"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Konfirmasi Password Baru</label>
                    <Input 
                      type="password"
                      name="confirmPassword"
                      placeholder="Ulangi password baru"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSavingPwd} className="flex items-center !bg-[#EB5757] hover:!bg-[#d44a4a]">
                    {isSavingPwd ? <Loader2 className="animate-spin mr-2" size={16} /> : <Lock size={16} className="mr-2" />}
                    {isSavingPwd ? 'Memproses...' : 'Ubah Password'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Danger Zone */}
          <motion.div variants={itemVariants} className="mt-8">
            <div className="bg-[#EB5757]/5 border border-[#EB5757]/20 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="text-[#EB5757] font-semibold text-lg flex items-center">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-[#EB5757]/10 flex items-center justify-center mr-3">
                    <LogOut size={16} className="text-[#EB5757]" />
                  </span>
                  Keluar dari Koperasi
                </h4>
                <p className="text-[#EB5757]/80 text-sm mt-2 max-w-lg">
                  Tindakan ini akan mengajukan permohonan keluar dari keanggotaan Koperasi Nichias dan bersifat permanen.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => navigate('/pengajuan-keluar')}
                className="bg-white border hover:bg-[#EB5757] border-[#EB5757] text-[#EB5757] hover:text-white font-medium py-2.5 px-6 rounded-xl transition-all shadow-sm max-sm:w-full flex items-center justify-center whitespace-nowrap lg:text-sm"
              >
                Keluar Koperasi
              </button>
            </div>
          </motion.div>

        </motion.div>
      </div>
      
      {/* Status Modal (Success/Error) */}
      <Modal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        title={statusModal.title}
        message={statusModal.message}
        type={statusModal.type}
        confirmText="Tutup"
      />
    </motion.div>
  );
}
