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
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/atoms/Button';
import Modal from '../../components/molecules/Modal';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/id';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Neraca() {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('monthly'); // 'monthly' or 'yearly'
  const [filter, setFilter] = useState({
    bulan: moment().format('MM'),
    tahun: moment().format('YYYY')
  });
  const [meta, setMeta] = useState({ isClosed: false });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

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

  const handleCancelTutupBuku = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Buka Kembali Buku Neraca',
      message: `Apakah Anda yakin ingin membatalkan TUTUP BUKU untuk bulan ${moment(`${filter.tahun}-${filter.bulan}-01`).format('MMMM YYYY')}? Action ini akan membuka kembali periode dan menghapus snapshot saldo.`,
      onConfirm: executeCancelTutupBuku
    });
  };

  const executeCancelTutupBuku = async () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    try {
      const res = await axios.post(`${API_URL}/keuangan/cancel-tutup-buku`, {
        bulan: parseInt(filter.bulan),
        tahun: parseInt(filter.tahun)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        fetchData();
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal membuka kembali buku', 'error');
    }
  };

  const handleTutupBuku = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Tutup Buku Neraca',
      message: `Apakah Anda yakin ingin melakukan TUTUP BUKU untuk bulan ${moment(`${filter.tahun}-${filter.bulan}-01`).format('MMMM YYYY')}? Action ini akan menyimpan snapshot saldo final.`,
      onConfirm: executeTutupBuku
    });
  };

  const executeTutupBuku = async () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    try {
      const res = await axios.post(`${API_URL}/keuangan/tutup-buku`, {
        bulan: parseInt(filter.bulan),
        tahun: parseInt(filter.tahun)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        fetchData();
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal tutup buku', 'error');
    }
  };

  const handleExportExcel = () => {
    try {
      const filename = `Neraca_${filter.bulan}_${filter.tahun}.xls`;
      
      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Neraca Bulanan</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; margin-top: 10px; }
            th { background-color: #004A9C; color: #ffffff; font-weight: bold; border: 1px solid #cccccc; padding: 10px 12px; text-align: left; font-size: 13px; text-transform: uppercase; }
            td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 12px; color: #4a5568; }
            .title-cell { font-size: 18px; font-weight: bold; color: #004A9C; text-align: center; }
            .subtitle-cell { font-size: 12px; color: #718096; text-align: center; font-style: italic; }
            .total-row { font-weight: bold; background-color: #f7fafc; border-top: 2px solid #cbd5e0; }
            .footer-row { background-color: #004A9C; color: #ffffff; font-weight: bold; border-top: 2px solid #003B7D; }
            .footer-cell { color: #ffffff !important; }
            .number-cell { text-align: right; }
          </style>
        </head>
        <body>
          <table>
            <tr>
              <td colspan="5" class="title-cell">KOPERASI NICHIAS</td>
            </tr>
            <tr>
              <td colspan="5" class="title-cell">LAPORAN NERACA KEUANGAN BULANAN</td>
            </tr>
            <tr>
              <td colspan="5" class="subtitle-cell">Periode: ${moment(`${filter.tahun}-${filter.bulan}-01`).format('MMMM YYYY')}</td>
            </tr>
            <tr style="height: 15px;"></tr>
            <thead>
              <tr>
                <th>DESKRIPSI</th>
                <th style="text-align: right;">SALDO AWAL</th>
                <th style="text-align: right;">DEBIT</th>
                <th style="text-align: right;">CREDIT</th>
                <th style="text-align: right;">SALDO AKHIR</th>
              </tr>
            </thead>
            <tbody>
      `;

      data.forEach((item) => {
        const isTotal = item.isTotalRow || item.nama_kategori === 'TOTAL ASSET';
        const rowClass = isTotal ? 'class="total-row"' : '';
        
        htmlContent += `
          <tr ${rowClass}>
            <td style="font-weight: ${isTotal ? 'bold' : 'normal'}; color: ${isTotal ? '#ef4444' : '#2d3748'};">
              ${item.nama_kategori}
            </td>
            <td class="number-cell" style="font-weight: ${isTotal ? 'bold' : 'normal'};">
              ${item.saldo_awal === 0 ? '-' : formatRupiah(item.saldo_awal)}
            </td>
            <td class="number-cell" style="font-weight: ${isTotal ? 'bold' : 'normal'}; color: ${isTotal ? '#2d3748' : '#2563eb'};">
              ${item.debit === 0 ? '-' : formatRupiah(item.debit)}
            </td>
            <td class="number-cell" style="font-weight: ${isTotal ? 'bold' : 'normal'}; color: ${isTotal ? '#2d3748' : '#ef4444'};">
              ${item.kredit === 0 ? '-' : formatRupiah(item.kredit)}
            </td>
            <td class="number-cell" style="font-weight: bold; background-color: ${isTotal ? '#EBF3FC' : 'transparent'}; color: ${isTotal ? '#004A9C' : '#2d3748'};">
              ${item.saldo_akhir === 0 ? '-' : formatRupiah(item.saldo_akhir)}
            </td>
          </tr>
        `;
      });

      htmlContent += `
            <tr style="background-color: #004A9C; color: #ffffff; font-weight: bold;">
              <td style="background-color: #004A9C; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #003B7D;">${moment(`${filter.tahun}-${filter.bulan}-01`).format('MMM-YY')}</td>
              <td style="background-color: #004A9C; color: #ffffff; font-weight: bold; border: 1px solid #003B7D;"></td>
              <td style="background-color: #004A9C; color: #ffffff; font-weight: bold; text-align: right; border: 1px solid #003B7D;">${formatRupiah(totalDebitCol)}</td>
              <td style="background-color: #004A9C; color: #ffffff; font-weight: bold; text-align: right; border: 1px solid #003B7D;">${formatRupiah(totalKreditCol)}</td>
              <td style="background-color: #004A9C; color: #ffffff; font-weight: bold; border: 1px solid #003B7D;"></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
      `;

      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      showNotification('Gagal mengekspor laporan ke Excel', 'error');
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

            {meta.isClosed ? (
              user?.role === 'Bendahara' ? (
                <Button 
                  onClick={handleCancelTutupBuku} 
                  disabled={loading}
                  className="flex items-center gap-2 !px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold"
                >
                  <Unlock size={18} />
                  Batal Tutup Buku
                </Button>
              ) : (
                <Button 
                  disabled={true}
                  className="flex items-center gap-2 !px-6 !bg-gray-100 !text-gray-400 cursor-not-allowed"
                >
                  <Lock size={18} />
                  Buku Ditutup
                </Button>
              )
            ) : (
              <Button 
                onClick={handleTutupBuku} 
                disabled={loading}
                className="flex items-center gap-2 !px-6 bg-red-500 hover:bg-red-600 text-white font-bold"
              >
                <Unlock size={18} />
                Tutup Buku
              </Button>
            )}
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
                  <tr className="bg-[#004A9C] border-b-2 border-[#003B7D] text-white">
                    <th className="px-8 py-5 text-sm font-black uppercase tracking-tight border-r border-white/10 text-white">DESKRIPSI</th>
                    <th className="px-8 py-5 text-sm font-black uppercase tracking-tight text-right border-r border-white/10 text-white">SALDO AWAL</th>
                    <th className="px-8 py-5 text-sm font-black uppercase tracking-tight text-right border-r border-white/10 text-white">DEBIT</th>
                    <th className="px-8 py-5 text-sm font-black uppercase tracking-tight text-right border-r border-white/10 text-white">CREDIT</th>
                    <th className="px-8 py-5 text-sm font-black uppercase tracking-tight text-right text-white">SALDO AKHIR</th>
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
                  <tr className="bg-[#004A9C] border-t-2 border-[#003B7D] text-white">
                    <td className="px-8 py-4 text-sm font-black text-center border-r border-white/10 uppercase text-white">
                      {moment(`${filter.tahun}-${filter.bulan}-01`).format('MMM-YY')}
                    </td>
                    <td className="border-r border-white/10"></td>
                    <td className="px-8 py-4 text-sm font-black text-right border-r border-white/10 text-white">
                      {formatRupiah(totalDebitCol)}
                    </td>
                    <td className="px-8 py-4 text-sm font-black text-right border-r border-white/10 text-white">
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
              <button 
                onClick={() => showNotification('Fitur ekspor PDF sedang disiapkan.', 'info')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <Download size={14} /> PDF
              </button>
              <button 
                onClick={handleExportExcel}
                className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
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
      {/* Confirm Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        message={confirmModal.message}
        type="warning"
        onConfirm={confirmModal.onConfirm}
        confirmText={confirmModal.title?.includes('Buka') ? 'Ya, Buka Buku' : 'Ya, Tutup Buku'}
        cancelText="Batal"
      />
    </div>
  );
}
