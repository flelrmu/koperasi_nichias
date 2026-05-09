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
import DashboardLayout from '../../templates/DashboardLayout';
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
  const [formData, setFormData] = useState({ nama_kategori: '', jenis: 'Debit' });

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
      if (editData) {
        await axios.put(`${API_URL}/keuangan/kategori/${editData.kategori_id}`, formData, config);
        showNotification('Kategori berhasil diupdate', 'success');
      } else {
        await axios.post(`${API_URL}/keuangan/kategori`, formData, config);
        showNotification('Kategori berhasil ditambahkan', 'success');
      }
      setShowModal(false);
      setFormData({ nama_kategori: '', jenis: 'Debit' });
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
    item.nama_kategori?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Kategori Kas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-2xl">
              <Tags className="text-purple-600" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Manajemen Kategori</h1>
              <p className="text-gray-500 text-sm mt-0.5">Kelola daftar klasifikasi untuk setiap transaksi arus kas.</p>
            </div>
          </div>
          <Button onClick={() => { setEditData(null); setFormData({nama_kategori: '', jenis: 'Debit'}); setShowModal(true); }} className="flex items-center gap-2 !px-6 bg-[#004A9C]">
            <Plus size={18} /> Tambah Kategori
          </Button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari kategori..." 
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
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nama Kategori</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jenis Default</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan="3" className="px-6 py-4 text-center">Loading...</td></tr>
                  ) : filteredData.length === 0 ? (
                    <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-400">Tidak ada data.</td></tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.kategori_id} className="hover:bg-gray-50/30 transition-all">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-700">{item.nama_kategori}</span>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={item.jenis}>{item.jenis === 'Kredit' ? 'Pemasukan' : 'Pengeluaran'}</StatusBadge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => { setEditData(item); setFormData({nama_kategori: item.nama_kategori, jenis: item.jenis}); setShowModal(true); }}
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

          <div className="space-y-6">
            <div className="bg-[#004A9C] rounded-[24px] p-8 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
              <Settings2 className="absolute -right-4 -bottom-4 text-white/10" size={120} />
              <h3 className="text-lg font-bold mb-2">Informasi Penting</h3>
              <ul className="space-y-3 text-sm text-blue-100">
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 shrink-0"></div>
                  Kategori yang sudah digunakan dalam transaksi Arus Kas tidak dapat dihapus.
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 shrink-0"></div>
                  <strong>Kredit</strong> diartikan sebagai Kas Masuk / Pemasukan.
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 shrink-0"></div>
                  <strong>Debit</strong> diartikan sebagai Kas Keluar / Pengeluaran.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{editData ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><Plus size={24} className="rotate-45" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nama Kategori</label>
                    <input 
                      type="text" required placeholder="Contoh: Biaya Operasional"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#004A9C]/20 outline-none"
                      value={formData.nama_kategori}
                      onChange={(e) => setFormData({...formData, nama_kategori: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Jenis Default</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, jenis: 'Kredit'})}
                        className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${formData.jenis === 'Kredit' ? 'border-[#27AE60] bg-[#27AE60]/5 text-[#27AE60]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                      >
                        Kredit (In)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, jenis: 'Debit'})}
                        className={`py-3 rounded-2xl text-sm font-bold border-2 transition-all ${formData.jenis === 'Debit' ? 'border-[#EB5757] bg-[#EB5757]/5 text-[#EB5757]' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                      >
                        Debit (Out)
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="button" onClick={() => setShowModal(false)} className="flex-1 !bg-gray-100 !text-gray-500">Batal</Button>
                    <Button type="submit" className="flex-1">Simpan</Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
