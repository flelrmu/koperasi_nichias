import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tags, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  AlertCircle,
  Settings2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/atoms/Button';
import StatusBadge from '../../components/atoms/StatusBadge';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function KategoriKas() {
  const { showNotification } = useNotification();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({ 
    nama_kategori: '', 
    jenis: 'Debit', 
    kode_akun: '', 
    tipe_neraca: 'Asset',
    saldo_awal: 0 
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/keuangan/kategori`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) setData(res.data.data);
    } catch (error) {
      showNotification('Gagal mengambil data kategori', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const payload = {
        ...formData,
        saldo_awal: parseFloat(formData.saldo_awal || 0)
      };

      if (editData) {
        await axios.put(`${API_URL}/keuangan/kategori/${editData.kategori_id}`, payload, config);
        showNotification('Kategori berhasil diupdate', 'success');
      } else {
        await axios.post(`${API_URL}/keuangan/kategori`, payload, config);
        showNotification('Kategori berhasil ditambahkan', 'success');
      }
      setShowModal(false);
      setFormData({ nama_kategori: '', jenis: 'Debit', kode_akun: '', tipe_neraca: 'Asset', saldo_awal: 0 });
      setEditData(null);
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Terjadi kesalahan', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return;
    try {
      await axios.delete(`${API_URL}/keuangan/kategori/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      showNotification('Kategori berhasil dihapus', 'success');
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal menghapus kategori', 'error');
    }
  };

  const filteredData = data.filter(item => 
    item.nama_kategori?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kode_akun?.includes(searchTerm)
  );

  const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(val || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <Tags className="text-[#004A9C]" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Manajemen Akun & Kategori</h1>
              <p className="text-gray-500 text-sm mt-0.5">Kelola bagan akun untuk Arus Kas dan laporan Neraca.</p>
            </div>
          </div>
          <Button onClick={() => { 
            setEditData(null); 
            setFormData({nama_kategori: '', jenis: 'Debit', kode_akun: '', tipe_neraca: 'Asset', saldo_awal: 0}); 
            setShowModal(true); 
          }} className="flex items-center gap-2 !px-6 bg-[#004A9C]">
            <Plus size={18} /> Tambah Akun
          </Button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari akun atau kode..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kode</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Akun</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipe Neraca</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Saldo Awal</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jenis Kas</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan="6" className="px-6 py-4 text-center">Loading...</td></tr>
                  ) : filteredData.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-400">Tidak ada data.</td></tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.kategori_id} className="hover:bg-gray-50/30 transition-all">
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold text-[#004A9C] bg-blue-50 px-2 py-1 rounded-md">{item.kode_akun || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-700">{item.nama_kategori}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-gray-500">{item.tipe_neraca}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{formatRupiah(item.saldo_awal)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={item.jenis}>{item.jenis === 'Debit' ? 'Pemasukan' : 'Pengeluaran'}</StatusBadge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => { 
                                setEditData(item); 
                                setFormData({
                                  nama_kategori: item.nama_kategori, 
                                  jenis: item.jenis,
                                  kode_akun: item.kode_akun || '',
                                  tipe_neraca: item.tipe_neraca || 'Asset',
                                  saldo_awal: item.saldo_awal || 0
                                }); 
                                setShowModal(true); 
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.kategori_id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{editData ? 'Edit Akun' : 'Tambah Akun Baru'}</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><Plus size={24} className="rotate-45" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nama Akun / Kategori</label>
                      <input 
                        type="text" required placeholder="Contoh: BANK BCA"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none"
                        value={formData.nama_kategori}
                        onChange={(e) => setFormData({...formData, nama_kategori: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kode Akun</label>
                      <input 
                        type="text" placeholder="Contoh: 11011"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none font-mono"
                        value={formData.kode_akun}
                        onChange={(e) => setFormData({...formData, kode_akun: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tipe Akun (Neraca)</label>
                      <select 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none"
                        value={formData.tipe_neraca}
                        onChange={(e) => setFormData({...formData, tipe_neraca: e.target.value})}
                      >
                        <option value="Asset">Asset (Aktiva)</option>
                        <option value="Liability">Liability (Pasiva/Hutang)</option>
                        <option value="Equity">Equity (Modal)</option>
                        <option value="Income">Income (Pendapatan)</option>
                        <option value="Expense">Expense (Beban/Biaya)</option>
                      </select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Saldo Awal (Rp)</label>
                      <input 
                        type="number" placeholder="0"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none"
                        value={formData.saldo_awal}
                        onChange={(e) => setFormData({...formData, saldo_awal: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Jenis Default Kas</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, jenis: 'Debit'})}
                        className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${formData.jenis === 'Debit' ? 'border-[#27AE60] bg-[#27AE60]/5 text-[#27AE60]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                      >
                        Pemasukan (Debit)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, jenis: 'Kredit'})}
                        className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${formData.jenis === 'Kredit' ? 'border-[#EB5757] bg-[#EB5757]/5 text-[#EB5757]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                      >
                        Pengeluaran (Kredit)
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" onClick={() => setShowModal(false)} className="flex-1 !bg-gray-100 !text-gray-500">Batal</Button>
                    <Button type="submit" className="flex-1">Simpan Akun</Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}
