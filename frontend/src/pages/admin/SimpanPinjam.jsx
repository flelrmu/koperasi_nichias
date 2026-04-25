import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PiggyBank, 
  Search, 
  Plus, 
  Edit2, 
  Wallet, 
  TrendingUp, 
  Download, 
  Filter,
  User,
  ArrowRight,
  TrendingDown,
  Info,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  FileText,
  PlusCircle
} from 'lucide-react';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import StatusBadge from '../../components/atoms/StatusBadge';
import Modal from '../../components/molecules/Modal';
import { useAuth } from '../../context/AuthContext';
import { isKoordinatorSP } from '../../utils/roles';

export default function SimpanPinjam() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = isKoordinatorSP(user?.role);
  const [activeTab, setActiveTab] = useState('simpanan'); // 'simpanan' or 'pinjaman'
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLoanFilter, setActiveLoanFilter] = useState('Semua');

  // Modals state
  const [isUpdateSavingsModalOpen, setIsUpdateSavingsModalOpen] = useState(false);
  const [isLoanActionModalOpen, setIsLoanActionModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanActionType, setLoanActionType] = useState('review');

  // --- SAVINGS DATA & LOGIC ---
  const [savingsData, setSavingsData] = useState([
    { id: 1, no_anggota: 'ANG-001', nama_lengkap: 'Budi Santoso', pokok: 1000000, wajib: 2500000, sukarela: 500000, status: 'Aktif' },
    { id: 2, no_anggota: 'ANG-002', nama_lengkap: 'Siti Aminah', pokok: 1000000, wajib: 1500000, sukarela: 1200000, status: 'Aktif' },
    { id: 3, no_anggota: 'ANG-003', nama_lengkap: 'Andi Wijaya', pokok: 1000000, wajib: 2000000, sukarela: 0, status: 'Aktif' },
    { id: 4, no_anggota: 'ANG-004', nama_lengkap: 'Dewi Lestari', pokok: 1000000, wajib: 3000000, sukarela: 4500000, status: 'Aktif' },
    { id: 5, no_anggota: 'ANG-005', nama_lengkap: 'Eko Prasetyo', pokok: 1000000, wajib: 1200000, sukarela: 150000, status: 'Aktif' },
  ]);

  const savingsStats = useMemo(() => {
    return savingsData.reduce((acc, curr) => ({
      pokok: acc.pokok + curr.pokok,
      wajib: acc.wajib + curr.wajib,
      sukarela: acc.sukarela + curr.sukarela,
      total: acc.total + (curr.pokok + curr.wajib + curr.sukarela)
    }), { pokok: 0, wajib: 0, sukarela: 0, total: 0 });
  }, [savingsData]);

  const filteredSavings = useMemo(() => {
    return savingsData.filter(item => 
      item.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.no_anggota.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [savingsData, searchQuery]);

  // --- LOANS DATA & LOGIC ---
  const [loansData, setLoansData] = useState([
    { id: 1, no_anggota: 'ANG-001', nama_lengkap: 'Budi Santoso', jenis: 'Uang', keperluan: 'Renovasi Rumah', jumlah_diajukan: 15000000, jumlah_disetujui: 15000000, tenor: 20, tgl_pengajuan: '2026-04-10', status: 'Approved', sisa_tagihan: 12500000, angsuran: 750000 },
    { id: 2, no_anggota: 'ANG-002', nama_lengkap: 'Siti Aminah', jenis: 'Barang', nama_barang: 'Laptop Asus Vivobook', keperluan: 'Pendidikan Anak', jumlah_diajukan: 8500000, jumlah_disetujui: 0, tenor: 15, tgl_pengajuan: '2026-04-15', status: 'Pending', sisa_tagihan: 0, angsuran: 566667 },
    { id: 3, no_anggota: 'ANG-003', nama_lengkap: 'Andi Wijaya', jenis: 'Uang', keperluan: 'Biaya Rumah Sakit', jumlah_diajukan: 5000000, jumlah_disetujui: 5000000, tenor: 10, tgl_pengajuan: '2026-01-05', status: 'Lunas', sisa_tagihan: 0, angsuran: 500000 },
    { id: 4, no_anggota: 'ANG-004', nama_lengkap: 'Dewi Lestari', jenis: 'Uang', keperluan: 'Modal Usaha', jumlah_diajukan: 25000000, jumlah_disetujui: 20000000, tenor: 20, tgl_pengajuan: '2026-04-16', status: 'Approved', sisa_tagihan: 20000000, angsuran: 1000000 },
    { id: 5, no_anggota: 'ANG-005', nama_lengkap: 'Eko Prasetyo', jenis: 'Barang', nama_barang: 'Motor Honda Beat', keperluan: 'Transportasi Kerja', jumlah_diajukan: 18000000, jumlah_disetujui: 0, tenor: 20, tgl_pengajuan: '2026-04-18', status: 'Pending', sisa_tagihan: 0, angsuran: 900000 },
  ]);

  const loanStats = useMemo(() => {
    return {
      outstanding: loansData.reduce((acc, curr) => acc + curr.sisa_tagihan, 0),
      pending: loansData.filter(l => l.status === 'Pending').length,
      active: loansData.filter(l => l.status === 'Approved').length,
      total_disbursed: loansData.reduce((acc, curr) => acc + curr.jumlah_disetujui, 0)
    };
  }, [loansData]);

  const filteredLoans = useMemo(() => {
    return loansData.filter(item => {
      const matchesSearch = item.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.no_anggota.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeLoanFilter === 'Semua' || item.status === activeLoanFilter;
      return matchesSearch && matchesFilter;
    });
  }, [loansData, searchQuery, activeLoanFilter]);

  // --- COMMON HELPERS ---
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleUpdateSavingsClick = (member) => {
    setSelectedMember(member);
    setIsUpdateSavingsModalOpen(true);
  };

  const handleLoanActionClick = (loan, type) => {
    setSelectedLoan(loan);
    setLoanActionType(type);
    setIsLoanActionModalOpen(true);
  };

  const handleInputBaruClick = (member) => {
    navigate(`/admin/simpan-pinjam/input-baru/${member.id}`, { state: { member } });
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: 10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      className="space-y-8 pb-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Tab Switcher & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-[#004A9C]">Manajemen Simpan Pinjam</h2>
          <p className="text-gray-500 text-sm">Kelola riwayat simpanan dan pengajuan pinjaman anggota.</p>
        </div>
        
        <div className="flex p-1.5 bg-gray-50 rounded-2xl border border-gray-100">
          <button
            onClick={() => { setActiveTab('simpanan'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'simpanan' 
              ? 'bg-[#004A9C] text-white shadow-lg shadow-[#004A9C]/20' 
              : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <PiggyBank size={18} />
            Simpanan
          </button>
          <button
            onClick={() => { setActiveTab('pinjaman'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pinjaman' 
              ? 'bg-[#004A9C] text-white shadow-lg shadow-[#004A9C]/20' 
              : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <CreditCard size={18} />
            Pinjaman
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'simpanan' ? (
          <motion.div key="simpanan-tab" variants={tabContentVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-8">
            {/* Savings Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total S. Pokok', value: savingsStats.pokok, icon: Wallet, color: 'text-[#004A9C]', bg: 'bg-[#004A9C]/10' },
                { label: 'Total S. Wajib', value: savingsStats.wajib, icon: TrendingUp, color: 'text-[#27AE60]', bg: 'bg-[#27AE60]/10' },
                { label: 'Total S. Sukarela', value: savingsStats.sukarela, icon: PiggyBank, color: 'text-[#F2994A]', bg: 'bg-[#F2994A]/10' },
                { label: 'Akumulasi Dana', value: savingsStats.total, icon: Wallet, color: 'text-white', bg: 'bg-[#004A9C]', dark: true },
              ].map((stat, idx) => (
                <div key={idx} className={`${stat.dark ? stat.bg : 'bg-white'} p-6 rounded-3xl border ${stat.dark ? 'border-transparent' : 'border-gray-100'} shadow-sm`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.dark ? 'bg-white/20 text-white' : stat.bg + ' ' + stat.color}`}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${stat.dark ? 'text-white/60' : 'text-gray-400'}`}>{stat.label}</p>
                  <p className={`text-xl font-black mt-1 ${stat.dark ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(stat.value)}</p>
                </div>
              ))}
            </div>

            {/* Savings Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input 
                      placeholder="Cari anggota atau ID..." 
                      className="pl-10 !py-2.5" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:w-auto flex items-center justify-center gap-2 !py-2.5">
                      <Download size={18} />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-[0.1em] border-b border-gray-50">
                       <th className="py-5 px-6">Anggota</th>
                       <th className="py-5 px-6 text-right">Pokok</th>
                       <th className="py-5 px-6 text-right">Wajib</th>
                       <th className="py-5 px-6 text-right">Sukarela</th>
                       <th className="py-5 px-6 text-right">Total Simpanan</th>
                       <th className="py-5 px-6 text-center">Aksi</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {filteredSavings.length > 0 ? (
                       filteredSavings.map((item) => (
                         <tr key={item.id} className="group hover:bg-[#DFEAF4]/20 transition-colors">
                           <td className="py-4 px-6">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-[#004A9C] font-bold text-sm border border-gray-100">
                                 {item.nama_lengkap.charAt(0)}
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-800">{item.nama_lengkap}</span>
                                  <span className="text-[10px] text-gray-400 font-mono tracking-wider">{item.no_anggota}</span>
                               </div>
                             </div>
                           </td>
                           <td className="py-4 px-6 text-right text-xs font-bold text-gray-600">{formatCurrency(item.pokok)}</td>
                           <td className="py-4 px-6 text-right text-xs font-bold text-gray-600">{formatCurrency(item.wajib)}</td>
                           <td className="py-4 px-6 text-right text-xs font-bold text-[#F2994A]">{formatCurrency(item.sukarela)}</td>
                           <td className="py-4 px-6 text-right text-sm font-black text-[#004A9C]">{formatCurrency(item.pokok + item.wajib + item.sukarela)}</td>
                           <td className="py-4 px-6 text-center">
                             {canEdit ? (
                               <div className="flex items-center justify-center gap-1">
                                 <button onClick={() => handleInputBaruClick(item)} className="p-2 text-gray-400 hover:text-[#27AE60] hover:bg-[#27AE60]/10 rounded-xl transition-all" title="Input Transaksi Baru">
                                   <PlusCircle size={16} />
                                 </button>
                                 <button onClick={() => handleUpdateSavingsClick(item)} className="p-2 text-gray-400 hover:text-[#004A9C] hover:bg-[#DFEAF4] rounded-xl transition-all" title="Edit Total Saldo">
                                   <Edit2 size={16} />
                                 </button>
                               </div>
                             ) : (
                               <span className="text-[9px] font-bold text-gray-300 uppercase italic">View Only</span>
                             )}
                           </td>
                         </tr>
                       ))
                     ) : (
                       <tr><td colSpan={6} className="py-20 text-center text-gray-400">Data tidak ditemukan</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
            
            <div className="bg-[#DFEAF4]/30 border border-[#004A9C]/10 rounded-3xl p-6 flex items-start gap-4">
              <div className="p-3 bg-white rounded-2xl text-[#004A9C] shadow-sm"><Info size={24} /></div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Kebijakan Simpanan</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Simpanan Pokok & Wajib bersifat wajib bagi seluruh anggota. Simpanan Sukarela bersifat opsional dan dapat ditarik sewaktu-waktu.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="pinjaman-tab" variants={tabContentVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-8">
            {/* Loan Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Outstanding Pinjaman', value: loanStats.outstanding, icon: Wallet, color: 'text-[#004A9C]', bg: 'bg-[#004A9C]/10' },
                { label: 'Menunggu Review', value: loanStats.pending, icon: Clock, color: 'text-[#F2994A]', bg: 'bg-[#F2994A]/10', isCount: true },
                { label: 'Pinjaman Aktif', value: loanStats.active, icon: Briefcase, color: 'text-[#27AE60]', bg: 'bg-[#27AE60]/10', isCount: true },
                { label: 'Total Dana Keluar', value: loanStats.total_disbursed, icon: TrendingDown, color: 'text-white', bg: 'bg-[#EB5757]', dark: true },
              ].map((stat, idx) => (
                <div key={idx} className={`${stat.dark ? stat.bg : 'bg-white'} p-6 rounded-3xl border ${stat.dark ? 'border-transparent' : 'border-gray-100'} shadow-sm`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.dark ? 'bg-white/20 text-white' : stat.bg + ' ' + stat.color}`}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${stat.dark ? 'text-white/60' : 'text-gray-400'}`}>{stat.label}</p>
                  <p className={`text-xl font-black mt-1 ${stat.dark ? 'text-white' : 'text-gray-800'}`}>
                    {stat.isCount ? stat.value : formatCurrency(stat.value)}
                    {stat.isCount && <span className="text-[10px] ml-1 opacity-50 font-bold uppercase">Kasus</span>}
                  </p>
                </div>
              ))}
            </div>

            {/* Loan Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-50 flex flex-col lg:flex-row justify-between items-center gap-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                     <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input 
                          placeholder="Cari anggota..." 
                          className="pl-10 !py-2.5" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                     </div>
                     <div className="flex p-1 bg-gray-50 rounded-xl border border-gray-100 w-full sm:w-auto overflow-x-auto">
                       {['Semua', 'Pending', 'Approved', 'Lunas'].map((f) => (
                         <button
                           key={f}
                           onClick={() => setActiveLoanFilter(f)}
                           className={`flex-1 sm:px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all min-w-[70px] ${
                             activeLoanFilter === f 
                             ? 'bg-[#004A9C] text-white shadow-sm' 
                             : 'text-gray-400 hover:text-gray-600'
                           }`}
                         >
                           {f}
                         </button>
                       ))}
                     </div>
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-bold uppercase tracking-wider border-b border-gray-50">
                       <th className="py-5 px-6">Identitas</th>
                       <th className="py-5 px-6">Tipe & Keperluan</th>
                       <th className="py-5 px-6 text-right">Nominal Diajukan</th>
                       <th className="py-5 px-6 text-center">Tenor</th>
                       <th className="py-5 px-6 text-right">Angsuran</th>
                       <th className="py-5 px-6">Status</th>
                       <th className="py-5 px-6 text-center">Aksi</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {filteredLoans.length > 0 ? (
                       filteredLoans.map((loan) => (
                         <tr key={loan.id} className="group hover:bg-[#DFEAF4]/20 transition-colors">
                           <td className="py-4 px-6">
                             <div className="flex items-center gap-3">
                               <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-[#004A9C] font-bold text-xs border border-gray-100">
                                 {loan.nama_lengkap.charAt(0)}
                               </div>
                               <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-800">{loan.nama_lengkap}</span>
                                  <span className="text-[9px] text-gray-400 font-medium">{loan.tgl_pengajuan}</span>
                               </div>
                             </div>
                           </td>
                           <td className="py-4 px-6">
                              <div className="flex flex-col gap-0.5">
                                 <span className={`text-[9px] w-fit font-bold px-1.5 py-0.5 rounded uppercase ${loan.jenis === 'Barang' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-[#004A9C]'}`}>{loan.jenis}</span>
                                 <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{loan.keperluan}</span>
                              </div>
                           </td>
                           <td className="py-4 px-6 text-right text-xs font-bold text-gray-600">{formatCurrency(loan.jumlah_diajukan)}</td>
                           <td className="py-4 px-6 text-center text-xs font-bold text-gray-600">{loan.tenor} <span className="text-[9px] text-gray-400">Bln</span></td>
                           <td className="py-4 px-6 text-right text-xs font-bold text-[#EB5757]">{formatCurrency(loan.angsuran)}</td>
                           <td className="py-4 px-6"><StatusBadge status={loan.status} /></td>
                           <td className="py-4 px-6 text-center">
                             {canEdit ? (
                               <div className="flex items-center justify-center gap-1">
                                 {loan.status === 'Pending' ? (
                                   <button onClick={() => handleLoanActionClick(loan, 'review')} className="p-1.5 text-[#F2994A] hover:bg-[#F2994A]/10 rounded-lg"><CheckCircle size={18} /></button>
                                 ) : (
                                   <button onClick={() => handleLoanActionClick(loan, 'edit')} className="p-1.5 text-gray-400 hover:text-[#004A9C] hover:bg-[#DFEAF4] rounded-lg"><Edit2 size={16} /></button>
                                 )}
                               </div>
                             ) : (
                               <span className="text-[9px] font-bold text-gray-300 uppercase italic">View Only</span>
                             )}
                           </td>
                         </tr>
                       ))
                     ) : (
                       <tr><td colSpan={7} className="py-20 text-center text-gray-400">Data tidak ditemukan</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODALS --- */}
      {/* Update Savings Modal */}
      <Modal isOpen={isUpdateSavingsModalOpen} onClose={() => setIsUpdateSavingsModalOpen(false)} title="Update Data Simpanan" confirmText="Simpan Perubahan" onConfirm={() => setIsUpdateSavingsModalOpen(false)}>
        <div className="space-y-6 pt-2">
           <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-[#004A9C] text-white rounded-xl flex items-center justify-center font-bold text-lg">{selectedMember?.nama_lengkap.charAt(0)}</div>
              <div><h4 className="font-bold text-gray-800">{selectedMember?.nama_lengkap}</h4><p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">ID: {selectedMember?.no_anggota}</p></div>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Simpanan Pokok (IDR)</label><Input defaultValue={selectedMember?.pokok} type="number" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Simpanan Wajib (IDR)</label><Input defaultValue={selectedMember?.wajib} type="number" /></div>
              <div className="sm:col-span-2 space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Simpanan Sukarela (IDR)</label><Input defaultValue={selectedMember?.sukarela} type="number" /></div>
           </div>
        </div>
      </Modal>

      {/* Loan Review Modal */}
      <Modal isOpen={isLoanActionModalOpen} onClose={() => setIsLoanActionModalOpen(false)} title={loanActionType === 'review' ? 'Review Pinjaman' : 'Edit Pinjaman'} confirmText={loanActionType === 'review' ? 'Setujui' : 'Simpan'} onConfirm={() => setIsLoanActionModalOpen(false)}>
        <div className="space-y-6 pt-2 text-left">
           <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-12 h-12 bg-[#004A9C] text-white rounded-xl flex items-center justify-center font-bold text-lg">{selectedLoan?.nama_lengkap.charAt(0)}</div>
              <div><h4 className="font-bold text-gray-800">{selectedLoan?.nama_lengkap}</h4><p className="text-[10px] text-gray-400 uppercase tracking-widest">ID: {selectedLoan?.no_anggota}</p></div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase">Jumlah Diajukan</label><Input value={selectedLoan?.jumlah_diajukan} disabled /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-[#004A9C] uppercase">Jumlah Disetujui</label><Input defaultValue={selectedLoan?.jumlah_disetujui || selectedLoan?.jumlah_diajukan} type="number" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase">Tenor (Bulan)</label><Input defaultValue={selectedLoan?.tenor} type="number" /></div>
              <div className="space-y-1.5"><label className="text-[10px] font-bold text-gray-400 uppercase">Status</label><select className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white"><option>Pending</option><option>Approved</option><option>Rejected</option><option>Lunas</option></select></div>
           </div>
           {loanActionType === 'review' && (
             <div className="flex gap-3 pt-2">
                <Button className="flex-1 bg-[#27AE60] !py-2.5 text-sm">Review Setuju</Button>
                <Button className="flex-1 bg-[#EB5757] !py-2.5 text-sm">Review Tolak</Button>
             </div>
           )}
        </div>
      </Modal>
    </motion.div>
  );
}
