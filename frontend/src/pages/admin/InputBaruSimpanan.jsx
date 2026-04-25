import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Wallet, FileText, Calendar, Info } from 'lucide-react';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';

export default function InputBaruSimpanan() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  
  // Ambil data anggota dari state atau fetch menggunakan ID jika state kosong
  // Untuk saat ini kita pakai state dari SimpanPinjam.jsx
  const [member, setMember] = useState(location.state?.member || null);
  
  // State form
  const [formData, setFormData] = useState({
    jenis_simpanan: 'Wajib',
    jenis_transaksi: 'Setor',
    nominal: '',
    keterangan: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tanggal otomatis hari ini
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    // Jika tidak ada data member (misal direct link), bisa ditambahkan logika fetch by ID di sini
    if (!member && id) {
      // Mockup fetch
      setMember({
        id: id,
        no_anggota: `ANG-00${id}`,
        nama_lengkap: 'Member Tidak Ditemukan (Perlu Fetch)',
      });
    }
  }, [id, member]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulasi API Call
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Transaksi berhasil disimpan!');
      navigate('/admin/simpan-pinjam'); // Kembali ke halaman utama
    }, 1000);
  };

  const formatCurrency = (val) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

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
              <span className="text-[10px] text-green-600 bg-green-100 px-2 py-0.5 rounded-full mt-1 font-bold inline-flex w-fit">Otomatis Terisi</span>
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
                  onClick={() => setFormData({...formData, jenis_transaksi: 'Tarik'})}
                  className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                    formData.jenis_transaksi === 'Tarik' 
                    ? 'bg-[#EB5757] text-white border-[#EB5757] shadow-md shadow-[#EB5757]/20' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Penarikan
                </button>
              </div>
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
                <option value="Pokok">Simpanan Pokok</option>
                <option value="Wajib">Simpanan Wajib</option>
                <option value="Sukarela">Simpanan Sukarela</option>
              </select>
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
                type="number" 
                name="nominal"
                value={formData.nominal}
                onChange={handleInputChange}
                className="pl-12 !text-lg !font-bold !py-4"
                placeholder="0"
                required
                min="1"
              />
            </div>
            {formData.nominal && (
              <p className="text-xs text-gray-500 font-medium">
                Terbilang: <span className="font-bold text-[#004A9C]">{formatCurrency(formData.nominal)}</span>
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
               className="flex-1 !py-3 flex justify-center items-center gap-2"
               disabled={isSubmitting}
             >
               <Save size={18} />
               {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
             </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
