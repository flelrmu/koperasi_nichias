import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, User, Mail, CreditCard, Phone, MapPin, Briefcase, Building, Landmark, Lock, LogOut, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import StatusBadge from '../components/atoms/StatusBadge';
import Modal from '../components/molecules/Modal';

export default function Profile() {
  const navigate = useNavigate();
  // State for profile data
  const [profileData, setProfileData] = useState({
    nama: 'Budi Santoso',
    email: 'budi.santoso@nichias.co.id',
    noIdentitas: '3201123456789012',
    noHp: '081234567890',
    tempatLahir: 'Jakarta',
    tanggalLahir: '1990-05-15',
    jabatan: 'Staff Produksi',
    unitKerja: 'Plant 1',
    alamat: 'Jl. Merdeka No. 123, Kel. Suka Maju, Kec. Maju Jaya, Kab. Bogor',
    noRekening: '1234567890 (BCA)',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    alert('Profil berhasil diperbarui!');
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Konfirmasi password tidak cocok!');
      return;
    }
    alert('Password berhasil diubah!');
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
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
            <div className="relative mb-4 group cursor-pointer">
              <div className="w-32 h-32 rounded-full bg-[#DFEAF4] border-4 border-white shadow-md flex items-center justify-center text-[#004A9C] text-4xl font-bold overflow-hidden transition-transform group-hover:scale-105">
                BS
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
                        onChange={handleProfileChange}
                        className="pl-10"
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
                        onChange={handleProfileChange}
                        className="pl-10"
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
                        onChange={handleProfileChange}
                        className="pl-10"
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
                    <Input 
                      type="date"
                      name="tanggalLahir"
                      value={profileData.tanggalLahir}
                      onChange={handleProfileChange}
                      className="text-gray-700"
                      required
                    />
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
                        onChange={handleProfileChange}
                        className="pl-10"
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
                        onChange={handleProfileChange}
                        className="pl-10"
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
                  <Button type="submit" className="flex items-center">
                    <Save size={16} className="mr-2" /> Simpan Perubahan
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
                  <Button type="submit" className="flex items-center">
                    <Lock size={16} className="mr-2" /> Ubah Password
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
    </motion.div>
  );
}
