import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  CreditCard, 
  Wallet, 
  Clock, 
  Info, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Building,
  User,
  Phone,
  Calendar,
  Hash,
  Activity
} from 'lucide-react';
import Logo from '../../components/atoms/Logo';
import Button from '../../components/atoms/Button';
import StatusBadge from '../../components/atoms/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const socket = useSocket();
  
  const [loan, setLoan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLoanData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/simpan-pinjam/pinjaman/${id}`);
      if (response.data.success) {
        setLoan(response.data.data);
      } else {
        setError('Data pinjaman tidak ditemukan');
      }
    } catch (err) {
      console.error('Error fetching loan:', err);
      setError('Gagal memuat data pinjaman');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanData();
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = (data) => {
      if (data.pinjaman_id && data.pinjaman_id.toString() === id.toString()) {
        if (data.deleted) {
          navigate(user?.role === 'Koordinator_Simpan_Pinjam' ? '/admin/simpan-pinjam' : '/simpan-pinjam');
        } else {
          setLoan(data);
        }
      }
    };

    socket.on('pinjaman:updated', handleUpdate);
    return () => socket.off('pinjaman:updated', handleUpdate);
  }, [socket, id, navigate, user]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handlePrint = () => {
    // Simpan judul asli
    const originalTitle = document.title;
    // Set judul dokumen sesuai nomor invoice untuk nama file PDF yang bagus
    const invoiceNo = loan.nomor_invoice || `INV-PNJ-${loan.pinjaman_id}`;
    const memberName = loan.anggota?.nama_lengkap?.replace(/\s+/g, '_') || 'Member';
    document.title = `${invoiceNo}_${memberName}`;
    
    window.print();
    
    // Kembalikan judul asli
    document.title = originalTitle;
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#004A9C]/20 border-t-[#004A9C] rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Memuat Invoice...</p>
      </div>
    );
  }

  if (error || !loan) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="p-6 bg-red-50 text-red-500 rounded-[2rem] shadow-xl shadow-red-900/5 border border-red-100">
          <AlertCircle size={48} />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-black text-gray-900">{error || 'Pinjaman Tidak Ditemukan'}</h3>
          <p className="text-gray-500 font-medium mt-2">Maaf, data yang Anda cari tidak tersedia atau telah dihapus.</p>
        </div>
        <Link to={user?.role?.includes('Koordinator') || user?.role === 'Ketua' || user?.role === 'Bendahara' ? "/admin/simpan-pinjam" : "/simpan-pinjam"}>
          <Button className="!px-8 !py-4 shadow-xl shadow-[#004A9C]/20">
            Kembali ke Simpan Pinjam
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 print:p-0 print:max-w-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            margin: 10mm;
            size: auto;
          }
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
          }
          ::-webkit-scrollbar {
            display: none;
          }
        }
      `}} />
      
      {/* Header Actions - Hidden on Print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <Link to={user?.role?.includes('Koordinator') || user?.role === 'Ketua' || user?.role === 'Bendahara' ? "/admin/simpan-pinjam" : "/simpan-pinjam"} className="inline-flex w-full sm:w-auto">
          <Button className="w-full !bg-white border border-gray-200 !text-gray-700 hover:!bg-gray-50 flex items-center justify-center gap-2 shadow-sm rounded-xl py-3 px-6">
            <ArrowLeft size={18} />
            Kembali
          </Button>
        </Link>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            onClick={handlePrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-xl shadow-[#004A9C]/20 rounded-xl bg-[#004A9C] text-white hover:bg-[#003B7A] py-3 px-8 font-bold"
          >
            <Download size={18} />
            <span>Download PDF</span>
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 border border-gray-100 overflow-hidden relative print:shadow-none print:border-none print:rounded-none"
      >
        {/* Decorative Top Bar */}
        <div className="h-3 w-full bg-gradient-to-r from-[#004A9C] via-blue-500 to-[#4A90E2] print:hidden"></div>

        <div className="p-8 sm:p-16">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-16 pb-12 border-b-2 border-gray-50">
            <div className="space-y-6">
              <div className="transform scale-125 origin-left mb-8">
                <Logo />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">KOPERASI KARYAWAN</h3>
                <h4 className="text-sm font-bold text-[#004A9C] uppercase tracking-[0.2em]">PT NICHIAS SUNIJAYA</h4>
                <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-xs mt-3">
                  Kawasan Industri Indotaisei Sektor IA Blok L, Kalihurip, Cikampek, Karawang, Jawa Barat 41373
                </p>
              </div>
            </div>
            
            <div className="text-left md:text-right space-y-4">
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter text-right">INVOICE</h1>
                <p className="text-[#004A9C] font-black uppercase tracking-[0.3em] text-[10px] mt-1 text-right">Bukti Persetujuan Pinjaman</p>
              </div>
              <div className="space-y-2 pt-4">
                <div className="flex flex-col md:items-end">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nomor Invoice</span>
                   <span className="text-lg font-black text-[#004A9C]">{loan.nomor_invoice || `#INV-TEMP-${loan.pinjaman_id}`}</span>
                </div>
                <div className="flex flex-col md:items-end">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal Terbit</span>
                   <span className="text-sm font-bold text-gray-700">{formatDate(loan.tgl_acc_koordinator || loan.tanggal_pengajuan)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Member & Loan Summary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <User size={18} className="text-[#004A9C]" />
                <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest">Data Peminjam</h5>
              </div>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Lengkap</p>
                  <p className="text-sm font-bold text-gray-700">{loan.anggota?.nama_lengkap}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No. Anggota</p>
                  <p className="text-sm font-bold text-gray-700">{loan.anggota?.no_anggota}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kontak</p>
                  <p className="text-sm font-bold text-gray-700">{loan.anggota?.no_hp || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status Akun</p>
                  <div className="pt-1">
                    <StatusBadge status="Approved" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <Activity size={18} className="text-[#004A9C]" />
                <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest">Ringkasan Pinjaman</h5>
              </div>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipe Pinjaman</p>
                  <p className="text-sm font-bold text-gray-700">{loan.jenis_pinjaman}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status Pengajuan</p>
                  <div className="pt-1">
                    <StatusBadge status={loan.status} />
                  </div>
                </div>
                <div className="col-span-2 space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Keperluan</p>
                  <p className="text-sm font-medium text-gray-600 italic">"{loan.keperluan}"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="mb-16">
            <div className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-100">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#004A9C] text-white">
                    <th className="py-5 px-8 text-left text-[10px] font-black uppercase tracking-widest">Deskripsi Rincian</th>
                    <th className="py-5 px-8 text-right text-[10px] font-black uppercase tracking-widest">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-6 px-8">
                      <p className="text-sm font-bold text-gray-700">Pokok Pinjaman Disetujui</p>
                      <p className="text-[11px] text-gray-400 font-medium mt-1">Nilai pinjaman dasar yang dicairkan</p>
                    </td>
                    <td className="py-6 px-8 text-right font-black text-gray-900">
                      {formatCurrency(loan.pinjaman_disetujui || loan.jumlah_pinjaman)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-6 px-8">
                      <p className="text-sm font-bold text-gray-700">Total Jasa Pinjaman (Bunga)</p>
                      <p className="text-[11px] text-gray-400 font-medium mt-1">Biaya administrasi & profit koperasi</p>
                    </td>
                    <td className="py-6 px-8 text-right font-black text-gray-900">
                      {formatCurrency(loan.total_bunga)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td className="py-8 px-8">
                      <p className="text-base font-black text-[#004A9C]">TOTAL KEWAJIBAN</p>
                      <p className="text-xs text-blue-400 font-bold mt-1 italic uppercase tracking-wider">{loan.terbilang || '-'}</p>
                    </td>
                    <td className="py-8 px-8 text-right">
                      <p className="text-2xl font-black text-[#004A9C] tracking-tighter">
                        {formatCurrency(loan.total_angsuran || (parseFloat(loan.pinjaman_disetujui || loan.jumlah_pinjaman || 0) + parseFloat(loan.total_bunga || 0)))}
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Terms Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="p-8 bg-white border-2 border-dashed border-gray-100 rounded-[2rem] text-center flex flex-col justify-center space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tenor Pinjaman</p>
              <p className="text-3xl font-black text-gray-900">{loan.tenor} <span className="text-sm font-bold text-gray-400 uppercase">Bulan</span></p>
            </div>
            <div className="p-10 bg-gradient-to-br from-[#004A9C] to-blue-800 rounded-[2rem] text-center space-y-3 shadow-xl shadow-blue-900/20 relative z-10">
              <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Angsuran / Bulan</p>
              <p className="text-4xl font-black text-white tracking-tighter">{formatCurrency(loan.angsuran_per_bulan)}</p>
              <div className="pt-2">
                <span className="text-[9px] font-bold bg-white/20 text-white px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm">Potongan dari Gaji</span>
              </div>
            </div>
          </div>

          {/* Signatures Area */}
          <div className="mt-20 pt-10 border-t border-gray-50 flex flex-col md:flex-row justify-between items-end gap-10">
             <div className="flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-3xl border border-gray-100 max-w-[280px]">
                <CheckCircle2 size={32} className="text-[#27AE60] mb-3" />
                <p className="text-[11px] font-bold text-gray-500 uppercase leading-relaxed tracking-wider text-center">
                  Dokumen ini telah diverifikasi<br/>secara digital oleh sistem
                </p>
             </div>

             <div className="text-center space-y-20 min-w-[250px]">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disetujui Oleh</p>
                  <p className="text-xs font-bold text-gray-800">Koordinator Simpan Pinjam</p>
                </div>
                <div className="space-y-1 pt-4">
                  <p className="text-sm font-black text-gray-900 underline decoration-2 decoration-[#004A9C] underline-offset-4">{loan.koordinator?.pengurus?.nama_lengkap || 'PENGURUS KOPERASI'}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PT NICHIAS SUNIJAYA</p>
                </div>
             </div>
          </div>

          {/* Footer Info */}
          <div className="mt-20 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 print:opacity-100">
            <div className="text-center md:text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Syarat & Ketentuan</p>
              <p className="text-[9px] text-gray-500 mt-1 font-medium italic">
                Pembayaran dilakukan melalui sistem potong gaji otomatis setiap bulan sesuai tenor yang disepakati.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black text-[#004A9C] uppercase tracking-[0.2em]">
               <span>WWW.KOPERASINICHIAS.COM</span>
               <span className="w-1.5 h-1.5 rounded-full bg-blue-200"></span>
               <span>v1.0.2-SECURE</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
