import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Calendar, 
  ChevronDown, 
  Download, 
  RefreshCcw,
  Lock,
  Unlock,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/atoms/Button';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/id';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Neraca() {
  const { showNotification } = useNotification();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('monthly'); // 'monthly' or 'yearly'
  const [filter, setFilter] = useState({
    bulan: moment().format('MM'),
    tahun: moment().format('YYYY')
  });
  const [meta, setMeta] = useState({ isClosed: false });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/keuangan/neraca`, {
        params: filter,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setData(res.data.data);
        setMeta(res.data.meta);
      }
    } catch (error) {
      showNotification('Gagal mengambil data neraca', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleTutupBuku = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin melakukan TUTUP BUKU untuk bulan ${moment(`${filter.tahun}-${filter.bulan}-01`).format('MMMM YYYY')}? Action ini akan menyimpan snapshot saldo final.`)) return;

    try {
      const res = await axios.post(`${API_URL}/keuangan/neraca/tutup-buku`, {
        bulan: parseInt(filter.bulan),
        tahun: parseInt(filter.tahun),
        dataNeraca: data
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        showNotification(res.data.message, 'success');
        fetchData();
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal tutup buku', 'error');
    }
  };

  const formatRupiah = (val) => {
    const num = parseFloat(val || 0);
    const formatted = new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(Math.abs(num));
    
    return num < 0 ? `(${formatted})` : formatted;
  };

  // Group data by Tipe Neraca (excluding total rows for calculations)
  const assets = data.filter(item => item.tipe_neraca === 'Asset' && !item.isTotalRow);
  const liabilities = data.filter(item => item.tipe_neraca === 'Liability' && !item.isTotalRow);
  const equities = data.filter(item => item.tipe_neraca === 'Equity' && !item.isTotalRow);

  const totalAssets = assets.reduce((acc, curr) => acc + parseFloat(curr.saldo_akhir), 0);
  const totalLiabilities = liabilities.reduce((acc, curr) => acc + parseFloat(curr.saldo_akhir), 0);
  const totalEquity = equities.reduce((acc, curr) => acc + parseFloat(curr.saldo_akhir), 0);

  const totalDebitCol = data.filter(item => !item.isTotalRow).reduce((acc, curr) => acc + parseFloat(curr.debit || 0), 0);
  const totalKreditCol = data.filter(item => !item.isTotalRow).reduce((acc, curr) => acc + parseFloat(curr.kredit || 0), 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <BarChart3 className="text-[#004A9C]" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Neraca Keuangan</h1>
              <p className="text-gray-500 text-sm mt-0.5">Laporan posisi keuangan aset, liabilitas, dan ekuitas.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button 
                onClick={() => setViewType('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewType === 'monthly' ? 'bg-white text-[#004A9C] shadow-sm' : 'text-gray-400'}`}
              >
                Bulanan
              </button>
              <button 
                onClick={() => setViewType('yearly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewType === 'yearly' ? 'bg-white text-[#004A9C] shadow-sm' : 'text-gray-400'}`}
              >
                Tahunan
              </button>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
              <Calendar size={16} className="text-gray-400" />
              <select 
                className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
                value={filter.bulan}
                onChange={(e) => setFilter({...filter, bulan: e.target.value})}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i+1} value={String(i+1).padStart(2, '0')}>
                    {moment().month(i).format('MMMM')}
                  </option>
                ))}
              </select>
              <select 
                className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
                value={filter.tahun}
                onChange={(e) => setFilter({...filter, tahun: e.target.value})}
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <Button 
              onClick={handleTutupBuku} 
              disabled={meta.isClosed || loading}
              className={`flex items-center gap-2 !px-6 ${meta.isClosed ? '!bg-gray-100 !text-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {meta.isClosed ? <Lock size={18} /> : <Unlock size={18} />}
              {meta.isClosed ? 'Buku Ditutup' : 'Tutup Buku'}
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <motion.div 
          layout
          className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden"
        >
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-4">
              <RefreshCcw className="animate-spin" size={40} />
              <p className="font-medium">Menghitung neraca...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFFF00] border-b-2 border-gray-300">
                    <th className="px-8 py-5 text-sm font-black text-gray-900 uppercase tracking-tight border-r border-gray-300">DESKRIPSI</th>
                    <th className="px-8 py-5 text-sm font-black text-gray-900 uppercase tracking-tight text-right border-r border-gray-300">SALDO AWAL</th>
                    <th className="px-8 py-5 text-sm font-black text-gray-900 uppercase tracking-tight text-right border-r border-gray-300">DEBIT</th>
                    <th className="px-8 py-5 text-sm font-black text-gray-900 uppercase tracking-tight text-right border-r border-gray-300">CREDIT</th>
                    <th className="px-8 py-5 text-sm font-black text-gray-900 uppercase tracking-tight text-right bg-blue-50/30">SALDO AKHIR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.map((item, idx) => (
                    <tr 
                      key={idx} 
                      className={`group transition-all ${
                        item.isTotalRow 
                          ? 'bg-gray-100/80 border-t-2 border-gray-300' 
                          : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <td className={`px-8 py-4 border-r border-gray-200 ${item.isTotalRow ? 'text-red-500 font-black text-base' : 'text-sm font-bold text-gray-700'}`}>
                        {item.nama_kategori}
                      </td>
                      <td className={`px-8 py-4 text-sm text-right border-r border-gray-200 ${item.isTotalRow ? 'font-black text-gray-900' : 'text-gray-600 font-medium'}`}>
                        {item.saldo_awal === 0 ? '-' : formatRupiah(item.saldo_awal)}
                      </td>
                      <td className={`px-8 py-4 text-sm text-right border-r border-gray-200 ${item.isTotalRow ? 'font-black text-gray-900' : 'text-blue-600 font-medium'}`}>
                        {item.debit === 0 ? '-' : formatRupiah(item.debit)}
                      </td>
                      <td className={`px-8 py-4 text-sm text-right border-r border-gray-200 ${item.isTotalRow ? 'font-black text-gray-900' : 'text-red-500 font-medium'}`}>
                        {item.kredit === 0 ? '-' : formatRupiah(item.kredit)}
                      </td>
                      <td className={`px-8 py-4 text-sm text-right bg-blue-50/10 ${item.isTotalRow ? 'font-black text-[#004A9C] text-base' : 'font-bold text-gray-800'}`}>
                        {item.saldo_akhir === 0 ? '-' : formatRupiah(item.saldo_akhir)}
                      </td>
                    </tr>
                  ))}
                  {/* Empty Footer Row for Month-Year label like in image */}
                  <tr className="bg-[#FFFF00] border-t-2 border-gray-300">
                    <td className="px-8 py-4 text-sm font-black text-center border-r border-gray-300 uppercase">
                      {moment(`${filter.tahun}-${filter.bulan}-01`).format('MMM-YY')}
                    </td>
                    <td className="border-r border-gray-300"></td>
                    <td className="px-8 py-4 text-sm font-black text-right border-r border-gray-300">
                      {formatRupiah(totalDebitCol)}
                    </td>
                    <td className="px-8 py-4 text-sm font-black text-right border-r border-gray-300">
                      {formatRupiah(totalKreditCol)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-500/20">
            <FileSpreadsheet className="absolute -right-6 -bottom-6 text-white/10" size={140} />
            <h4 className="text-lg font-bold mb-2">Export Laporan</h4>
            <p className="text-blue-100 text-xs mb-6 leading-relaxed">Unduh laporan neraca dalam format PDF atau Excel untuk keperluan dokumentasi rapat tahunan.</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                <Download size={14} /> PDF
              </button>
              <button className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                <Download size={14} /> Excel
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm md:col-span-2">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-orange-50 rounded-2xl">
                <Filter className="text-orange-500" size={24} />
              </div>
              <h4 className="text-lg font-bold text-gray-800">Status Integritas Data</h4>
            </div>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Laporan ini dibuat secara otomatis dengan menggabungkan saldo awal kategori dan seluruh mutasi kas (Debit/Kredit). 
              {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1 ? (
                <span className="text-green-600 font-bold ml-1">✅ Neraca Seimbang (Balance).</span>
              ) : (
                <span className="text-red-500 font-bold ml-1">⚠️ Neraca Tidak Seimbang. Selisih: {formatRupiah(totalAssets - (totalLiabilities + totalEquity))}</span>
              )}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Last Update</p>
                <p className="text-sm font-bold text-gray-700">{moment().format('DD/MM/YY HH:mm')}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status Buku</p>
                <p className={`text-sm font-bold ${meta.isClosed ? 'text-red-500' : 'text-green-500'}`}>
                  {meta.isClosed ? 'Closed' : 'Open'}
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
