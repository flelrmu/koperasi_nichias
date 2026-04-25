import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  Check,
  User as UserIcon,
  Sparkles,
  Mail,
  Phone,
  Building,
  IdCard,
  CreditCard,
  Calendar,
  MapPin
} from 'lucide-react';
import Modal from '../molecules/Modal';
import StatusBadge from '../atoms/StatusBadge';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Textarea from '../atoms/Textarea';
import { useAuth } from '../../context/AuthContext';
import { isSekretaris } from '../../utils/roles';
import { useState } from 'react';

export default function UserDetailsModal({ isOpen, onClose, user, type }) {
  const { api, user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canApprove = type === 'anggota' && user?.status_keanggotaan === 'Pending' && isSekretaris(currentUser?.role);

  if (!user) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const id = user.anggota_id;
      const res = await api.put(`/user/approve/${id}`, { action: 'terima' });
      if (res.data.success) {
        onClose();
      }
    } catch (error) {
      console.error('Error approving member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };

  const formatDateField = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'anggota' ? 'Detail Anggota' : 'Detail Pengurus'}
      maxWidth="max-w-5xl"
      showConfirm={false}
      cancelText="Tutup"
    >
      <div className="py-2 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Config */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6 relative overflow-hidden group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#004A9C] to-[#002D5F] rounded-3xl blur opacity-0 group-hover:opacity-10 transition duration-1000 group-hover:duration-200"></div>
              
              <div className="relative flex flex-col items-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#DFEAF4] to-white flex items-center justify-center text-4xl font-bold text-[#004A9C] mb-4 shadow-inner shadow-[#004A9C]/10 border border-[#DFEAF4]">
                  {user.nama_lengkap?.charAt(0)}
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center">{user.nama_lengkap}</h3>
                <p className="text-gray-400 text-xs text-center mt-1">{user.user?.email}</p>
                
                <div className="w-full h-px bg-gray-100 my-5"></div>

                {type === 'anggota' ? (
                  <div className="flex flex-col w-full gap-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID User</span>
                      <span className="text-xs font-black text-[#004A9C]">{user.no_anggota || 'PROSES...'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                      <StatusBadge status={user.status_keanggotaan} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jabatan</span>
                      <span className="text-xs font-bold text-gray-700">{user.jabatan?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col w-full gap-3">
                    <div className="flex items-center justify-between p-3 bg-[#DFEAF4]/30 rounded-xl border border-[#004A9C]/10 shadow-sm">
                       <span className="text-[10px] font-bold text-[#004A9C] uppercase tracking-widest">Role Sistem</span>
                       <span className="px-3 py-1 bg-[#004A9C] rounded-lg text-white text-[10px] font-bold uppercase tracking-widest shadow-md border border-[#002D5F]">
                         {user.user?.role?.replace(/_/g, ' ')}
                       </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jabatan</span>
                      <span className="text-xs font-bold text-gray-700">{user.jabatan}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Form Design */}
          <div className="lg:col-span-2">
             <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/10"
            >
              <div className="space-y-8">
                <div className="flex items-center gap-5 border-b border-gray-50 pb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#DFEAF4] to-white rounded-2xl flex items-center justify-center text-[#004A9C] shadow-inner border border-white">
                    {type === 'anggota' ? <Users size={28} /> : <ShieldCheck size={28} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Data Lengkap {type === 'anggota' ? 'Anggota' : 'Pengurus'}</h2>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                      <span className="w-8 h-px bg-gray-200 inline-block"></span>
                      Informasi Detail Autentikasi
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Common Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Nama Lengkap Sesuai ID</label>
                      <Input
                        readOnly
                        value={user.nama_lengkap || ''}
                        className="!py-3 bg-gray-50/50 border-gray-100 text-gray-700 focus:border-gray-100 cursor-default shadow-sm pointer-events-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Email Perusahaan</label>
                      <Input
                        readOnly
                        value={user.user?.email || ''}
                        className="!py-3 bg-gray-50/50 border-gray-100 text-gray-700 focus:border-gray-100 cursor-default shadow-sm pointer-events-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Nomor WhatsApp Aktif</label>
                      <Input
                        readOnly
                        value={user.no_hp || 'Belum Diisi'}
                        className="!py-3 bg-gray-50/50 border-gray-100 text-gray-700 focus:border-gray-100 cursor-default shadow-sm pointer-events-none"
                      />
                    </div>
                  </div>

                  {type === 'anggota' && (
                    <motion.div 
                      key="fields-anggota"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8 pt-6 border-t border-gray-50"
                    >
                      <div className="flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-[#004A9C] rounded-full"></div>
                         <span className="text-xs font-bold text-[#004A9C] uppercase tracking-widest">Biodata & Keanggotaan</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Nomor KTP (16 Digit)</label>
                          <Input
                            readOnly
                            value={user.no_identitas || ''}
                            className="bg-gray-50/50 border-gray-100 text-gray-700 cursor-default pointer-events-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Divisi Kerja</label>
                          <Input
                            readOnly
                            value={user.divisi || ''}
                            className="bg-gray-50/50 border-gray-100 text-gray-700 cursor-default pointer-events-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Tempat Lahir</label>
                            <Input
                              readOnly
                              value={user.tempat_lahir || ''}
                              className="bg-gray-50/50 border-gray-100 text-gray-700 cursor-default pointer-events-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Tgl Lahir</label>
                            <Input
                              type="date"
                              readOnly
                              value={formatDateField(user.tanggal_lahir)}
                              className="bg-gray-50/50 border-gray-100 text-gray-700 cursor-default pointer-events-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Rekening Gaji (Bank)</label>
                          <Input
                            readOnly
                            value={user.no_rekening_bank || ''}
                            className="bg-gray-50/50 border-gray-100 text-gray-700 cursor-default pointer-events-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-2 pt-6 border-t border-gray-50">
                    <label className="text-[11px] font-bold text-gray-500 ml-1 uppercase tracking-widest">Alamat Domisili Lengkap</label>
                    <Textarea
                      readOnly
                      value={user.alamat || 'Belum Diisi'}
                      rows={3}
                      className="bg-gray-50/50 border-gray-100 text-gray-700 resize-none cursor-default pointer-events-none"
                    />
                  </div>
                </div>

                {canApprove && (
                  <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-10 border-t border-gray-50">
                     <Button 
                        onClick={handleApprove}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto min-w-[200px] !py-3 flex items-center justify-center gap-3 bg-[#27AE60] hover:bg-[#219150] shadow-lg shadow-[#27AE60]/20 font-bold"
                      >
                        <Check size={18} />
                        <span>{isSubmitting ? 'Memproses...' : 'Terima Jadi Anggota'}</span>
                      </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
          
        </div>
      </div>
    </Modal>
  );
}
