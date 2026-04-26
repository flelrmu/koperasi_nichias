import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Lock, 
  Save, 
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import StatusBadge from '../../components/atoms/StatusBadge';
import Modal from '../../components/molecules/Modal';

export default function AdminProfile() {
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
    jabatan: '',
    noHp: '',
    alamat: '',
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
            jabatan: data.jabatan || '',
            noHp: data.no_hp || '',
            alamat: data.alamat || '',
            fotoProfil: data.foto_profil || '',
          });
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [api]);

  useEffect(() => {
    if (!socket || !user) return;
    const handleUserUpdate = (e) => {
      if (e.type === 'pengurus' && e.data.user_id === user.user_id) {
         const data = e.data;
         setProfileData(prev => ({
            ...prev,
            nama: data.nama_lengkap || '',
            email: data.user?.email || '',
            jabatan: data.jabatan || '',
            noHp: data.no_hp || '',
            alamat: data.alamat || '',
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
        alamat: profileData.alamat,
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
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Memuat Profil Admin...</p>
      </div>
    );
  }

  const userInitials = profileData.nama
    ? profileData.nama.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <motion.div 
      className="space-y-6 max-w-5xl mx-auto pb-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Profil Pengurus</h2>
          <p className="text-gray-500 mt-1">Kelola informasi pribadi dan keamanan akun pengurus Anda.</p>
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
            <p className="text-gray-500 text-sm mb-3 font-medium">{profileData.jabatan}</p>
            <StatusBadge status="Aktif" />
            
            <div className="w-full mt-6 pt-6 border-t border-gray-100 text-left space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email Utama</span>
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
            </div>
          </div>
        </motion.div>

        {/* Right Column: Forms */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          
          {/* Profile Details Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <User size={20} className="mr-2 text-[#004A9C]" />
                Detail Informasi Pengurus
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
                    <label className="text-sm font-medium text-gray-700">Email Koperasi</label>
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
                    <label className="text-sm font-medium text-gray-700">Jabatan Saat Ini</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Briefcase size={16} className="text-gray-400" />
                      </div>
                      <Input 
                        name="jabatan"
                        value={profileData.jabatan}
                        className="pl-10 bg-gray-50 cursor-not-allowed"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Nomor Handphone (WA)</label>
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
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Alamat Tinggal</label>
                    <div className="relative w-full">
                      <div className="absolute top-3.5 left-3 pointer-events-none">
                        <MapPin size={16} className="text-gray-400" />
                      </div>
                      <textarea 
                        name="alamat"
                        value={profileData.alamat}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004A9C]/50 focus:border-[#004A9C] transition-all text-gray-700 min-h-[100px] text-sm font-poppins"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSaving} className="flex items-center !px-8">
                    {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
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
                      placeholder="Masukkan password lama"
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
                  <Button type="submit" disabled={isSavingPwd} className="flex items-center !bg-[#EB5757] hover:!bg-[#d44a4a] !px-8">
                    {isSavingPwd ? <Loader2 className="animate-spin mr-2" size={16} /> : <Lock size={16} className="mr-2" />}
                    {isSavingPwd ? 'Memproses...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

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
