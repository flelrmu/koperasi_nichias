import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, RefreshCcw, ChevronDown, ChevronUp, Lock, Unlock, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import Button from '../../components/atoms/Button';
import moment from 'moment';
import 'moment/locale/id';
import Modal from '../../components/molecules/Modal';
import { useAuth } from '../../context/AuthContext';

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function NeracaInlineTab({ api, showNotification, exportTrigger }) {
  const { user } = useAuth();
  const [yearlyData, setYearlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [expandedMonth, setExpandedMonth] = useState(new Date().getMonth() + 1);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const now = new Date();
  const yearOptions = Array.from({ length: now.getFullYear() - 2024 + 2 }, (_, i) => 2024 + i);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/keuangan/neraca/tahunan?tahun=${tahun}`);
      if (res.data.success) {
        setYearlyData(res.data.data);
      }
    } catch (error) {
      showNotification('Gagal mengambil data neraca', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tahun]);

  const formatRupiah = (val) => {
    const num = parseFloat(val || 0);
    const formatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(num));
    return num < 0 ? `(${formatted})` : formatted;
  };

  const handleExportExcel = (monthItem) => {
    try {
      const monthName = MONTHS[monthItem.bulan - 1];
      const filename = `Neraca_${monthName}_${tahun}.xls`;
      
      const totalDebitCol = monthItem.data.filter(d => !d.isTotalRow).reduce((a, c) => a + parseFloat(c.debit || 0), 0);
      const totalKreditCol = monthItem.data.filter(d => !d.isTotalRow).reduce((a, c) => a + parseFloat(c.kredit || 0), 0);

      let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Neraca ${monthName}</x:Name>
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
              <td colspan="5" class="subtitle-cell">Periode: ${monthName} ${tahun}</td>
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

      monthItem.data.filter(item => !item.nama_kategori.includes('CHECK')).forEach((item) => {
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
              <td style="background-color: #004A9C; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #003B7D;">${moment(`${tahun}-${String(monthItem.bulan).padStart(2, '0')}-01`).format('MMM-YY')}</td>
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

  const handleExportYearlyExcel = () => {
    try {
      const filename = `Neraca_Tahunan_${tahun}.xls`;
      
      let xmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Neraca ${tahun}</x:Name>
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
            table { border-collapse: collapse; width: 100%; margin-top: 10px; margin-bottom: 40px; }
            th { background-color: #004A9C; color: #ffffff; font-weight: bold; border: 1px solid #cccccc; padding: 10px 12px; text-align: left; font-size: 13px; text-transform: uppercase; }
            td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 12px; color: #4a5568; }
            .title-cell { font-size: 18px; font-weight: bold; color: #004A9C; text-align: center; }
            .subtitle-cell { font-size: 12px; color: #718096; text-align: center; font-style: italic; }
            .total-row { font-weight: bold; background-color: #f7fafc; border-top: 2px solid #cbd5e0; }
            .number-cell { text-align: right; }
          </style>
        </head>
        <body>
      `;

      yearlyData.forEach((monthItem, idx) => {
        const monthName = MONTHS[monthItem.bulan - 1];
        const totalDebitCol = monthItem.data.filter(d => !d.isTotalRow).reduce((a, c) => a + parseFloat(c.debit || 0), 0);
        const totalKreditCol = monthItem.data.filter(d => !d.isTotalRow).reduce((a, c) => a + parseFloat(c.kredit || 0), 0);

        xmlContent += `
          <!-- Table for ${monthName} -->
          <table>
            <tr>
              <td colspan="5" class="title-cell" style="border: none;">KOPERASI NICHIAS</td>
            </tr>
            <tr>
              <td colspan="5" class="title-cell" style="border: none;">LAPORAN NERACA KEUANGAN BULANAN</td>
            </tr>
            <tr>
              <td colspan="5" class="subtitle-cell" style="border: none;">Periode: ${monthName} ${tahun}</td>
            </tr>
            <tr style="height: 15px; border: none;"><td colspan="5" style="border: none;"></td></tr>
            <thead>
              <tr>
                <th style="background-color: #004A9C; color: #ffffff; font-weight: bold; border: 1px solid #003B7D;">DESKRIPSI</th>
                <th style="background-color: #004A9C; color: #ffffff; font-weight: bold; text-align: right; border: 1px solid #003B7D;">SALDO AWAL</th>
                <th style="background-color: #004A9C; color: #ffffff; font-weight: bold; text-align: right; border: 1px solid #003B7D;">DEBIT</th>
                <th style="background-color: #004A9C; color: #ffffff; font-weight: bold; text-align: right; border: 1px solid #003B7D;">CREDIT</th>
                <th style="background-color: #004A9C; color: #ffffff; font-weight: bold; text-align: right; border: 1px solid #003B7D;">SALDO AKHIR</th>
              </tr>
            </thead>
            <tbody>
        `;

        monthItem.data.filter(item => !item.nama_kategori.includes('CHECK')).forEach((item) => {
          const isTotal = item.isTotalRow || item.nama_kategori === 'TOTAL ASSET';
          const rowClass = isTotal ? 'class="total-row"' : '';
          
          xmlContent += `
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

        xmlContent += `
              <tr style="background-color: #004A9C; color: #ffffff; font-weight: bold;">
                <td style="background-color: #004A9C; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #003B7D;">${moment(`${tahun}-${String(monthItem.bulan).padStart(2, '0')}-01`).format('MMM-YY')}</td>
                <td style="background-color: #004A9C; color: #ffffff; font-weight: bold; border: 1px solid #003B7D;"></td>
                <td style="background-color: #004A9C; color: #ffffff; font-weight: bold; text-align: right; border: 1px solid #003B7D;">${formatRupiah(totalDebitCol)}</td>
                <td style="background-color: #004A9C; color: #ffffff; font-weight: bold; text-align: right; border: 1px solid #003B7D;">${formatRupiah(totalKreditCol)}</td>
                <td style="background-color: #004A9C; color: #ffffff; font-weight: bold; border: 1px solid #003B7D;"></td>
              </tr>
            </tbody>
          </table>
          <br/>
          <br/>
        `;
      });

      xmlContent += `
        </body>
        </html>
      `;

      const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      showNotification('Gagal mengekspor laporan tahunan', 'error');
    }
  };

  useEffect(() => {
    if (exportTrigger > 0 && yearlyData.length > 0) {
      handleExportYearlyExcel();
    }
  }, [exportTrigger]);

  const handleTutupBuku = (bulan) => {
    const monthData = yearlyData.find(m => m.bulan === bulan);
    if (!monthData) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Tutup Buku Neraca',
      message: `Apakah Anda yakin ingin melakukan TUTUP BUKU untuk periode ${MONTHS[bulan - 1]} ${tahun}? Setelah ditutup, transaksi di bulan ini TIDAK DAPAT diubah lagi.`,
      onConfirm: () => executeTutupBuku(bulan)
    });
  };

  const executeTutupBuku = async (bulan) => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    try {
      await api.post('/keuangan/tutup-buku', {
        bulan: parseInt(bulan), 
        tahun: parseInt(tahun)
      });
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal tutup buku', 'error');
    }
  };

  const handleCancelTutupBuku = (bulan) => {
    const monthData = yearlyData.find(m => m.bulan === bulan);
    if (!monthData) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'Buka Kembali Buku Neraca',
      message: `Apakah Anda yakin ingin membatalkan TUTUP BUKU untuk periode ${MONTHS[bulan - 1]} ${tahun}? Ini akan membuka kembali periode dan menghapus snapshot saldo.`,
      onConfirm: () => executeCancelTutupBuku(bulan)
    });
  };

  const executeCancelTutupBuku = async (bulan) => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    try {
      await api.post('/keuangan/cancel-tutup-buku', {
        bulan: parseInt(bulan), 
        tahun: parseInt(tahun)
      });
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal membuka kembali buku', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-4 bg-white rounded-3xl border border-gray-100">
        <RefreshCcw className="animate-spin" size={40} />
        <p className="font-medium">Menghitung neraca...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-gray-400" />
          <span className="text-sm font-bold text-gray-600">Laporan Neraca Tahun:</span>
          <select
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none cursor-pointer"
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-400">Menampilkan 12 tabel neraca bulanan</p>
      </div>

      {}
      {yearlyData.map((monthItem) => {
        const isExpanded = expandedMonth === monthItem.bulan;
        const hasData = monthItem.data.some(d => d.saldo_akhir !== 0 || d.debit !== 0 || d.kredit !== 0);
        
        const totalBalance = monthItem.data
          .filter(d => !d.isTotalRow)
          .reduce((acc, curr) => acc + parseFloat(curr.saldo_akhir || 0), 0);
        const isBalanced = Math.abs(totalBalance) < 1;

        return (
          <motion.div
            key={monthItem.bulan}
            layout
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {}
            <button
              onClick={() => setExpandedMonth(isExpanded ? null : monthItem.bulan)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${hasData ? 'bg-[#004A9C]/10 text-[#004A9C]' : 'bg-gray-100 text-gray-400'}`}>
                  {String(monthItem.bulan).padStart(2, '0')}
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-800">{MONTHS[monthItem.bulan - 1]} {tahun}</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {monthItem.isClosed ? '🔒 Buku Ditutup' : hasData ? '📊 Data Tersedia' : '📭 Belum Ada Data'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {monthItem.isClosed && <Lock size={14} className="text-red-400" />}
                {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
            </button>

            {}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#004A9C] border-b-2 border-[#003B7D] text-white">
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-tight border-r border-white/10 text-white">DESKRIPSI</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-tight text-right border-r border-white/10 text-white">SALDO AWAL</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-tight text-right border-r border-white/10 text-white">DEBIT</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-tight text-right border-r border-white/10 text-white">CREDIT</th>
                            <th className="px-6 py-4 text-xs font-black uppercase tracking-tight text-right text-white">SALDO AKHIR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {monthItem.data.filter(item => !item.nama_kategori.includes('CHECK')).map((item, idx) => (
                            <tr
                              key={idx}
                              className={`transition-all ${item.isTotalRow ? 'bg-gray-100/80 border-t-2 border-gray-300' : 'hover:bg-gray-50/50'}`}
                            >
                              <td className={`px-6 py-3 border-r border-gray-200 ${item.isTotalRow ? 'text-red-500 font-black text-sm' : item.isCalculated ? 'text-[#004A9C] font-bold text-sm' : 'text-sm font-bold text-gray-700'}`}>
                                {item.nama_kategori}
                              </td>
                              <td className={`px-6 py-3 text-sm text-right border-r border-gray-200 ${item.isTotalRow ? 'font-black text-gray-900' : 'text-gray-600 font-medium'}`}>
                                {item.saldo_awal === 0 ? '-' : formatRupiah(item.saldo_awal)}
                              </td>
                              <td className={`px-6 py-3 text-sm text-right border-r border-gray-200 ${item.isTotalRow ? 'font-black text-gray-900' : 'text-blue-600 font-medium'}`}>
                                {item.debit === 0 ? '-' : formatRupiah(item.debit)}
                              </td>
                              <td className={`px-6 py-3 text-sm text-right border-r border-gray-200 ${item.isTotalRow ? 'font-black text-gray-900' : 'text-red-500 font-medium'}`}>
                                {item.kredit === 0 ? '-' : formatRupiah(item.kredit)}
                              </td>
                              <td className={`px-6 py-3 text-sm text-right bg-blue-50/10 ${item.isTotalRow ? 'font-black text-[#004A9C] text-sm' : 'font-bold text-gray-800'}`}>
                                {item.nama_kategori.includes('CHECK') ? (
                                  <div className="flex justify-end">
                                    {Math.abs(item.saldo_akhir) < 1 ? (
                                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20">
                                        <CheckCircle2 size={12} />
                                        Seimbang
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 animate-pulse">
                                        <AlertTriangle size={12} />
                                        Tidak Seimbang
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  item.saldo_akhir === 0 ? '-' : formatRupiah(item.saldo_akhir)
                                )}
                              </td>
                            </tr>
                          ))}
                          {}
                          <tr className="bg-[#004A9C] border-t-2 border-[#003B7D] text-white">
                            <td className="px-6 py-3 text-xs font-black text-center border-r border-white/10 uppercase text-white">
                              {moment(`${tahun}-${String(monthItem.bulan).padStart(2, '0')}-01`).format('MMM-YY')}
                            </td>
                            <td className="px-6 py-3 text-xs font-black text-right border-r border-white/10 text-white">
                              {formatRupiah(monthItem.data.filter(d => !d.isTotalRow).reduce((a, c) => a + parseFloat(c.saldo_awal || 0), 0))}
                            </td>
                            <td className="px-6 py-3 text-xs font-black text-right border-r border-white/10 text-white">
                              {formatRupiah(monthItem.data.filter(d => !d.isTotalRow).reduce((a, c) => a + parseFloat(c.debit || 0), 0))}
                            </td>
                            <td className="px-6 py-3 text-xs font-black text-right border-r border-white/10 text-white">
                              {formatRupiah(monthItem.data.filter(d => !d.isTotalRow).reduce((a, c) => a + parseFloat(c.kredit || 0), 0))}
                            </td>
                            <td className="px-6 py-3 text-xs font-black text-right text-white">
                              {formatRupiah(monthItem.data.filter(d => !d.isTotalRow).reduce((a, c) => a + parseFloat(c.saldo_akhir || 0), 0))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {}
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status Neraca:</span>
                          {isBalanced ? (
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20">
                              <CheckCircle2 size={14} />
                              Seimbang
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 animate-pulse">
                              <AlertTriangle size={14} />
                              Tidak Seimbang
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {monthItem.isClosed ? (
                          user?.role === 'Bendahara' && (
                            <Button
                              onClick={() => handleCancelTutupBuku(monthItem.bulan)}
                              className="flex items-center gap-2 !px-6 text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold"
                            >
                              <Unlock size={14} /> Batal Tutup Buku {MONTHS[monthItem.bulan - 1]}
                            </Button>
                          )
                        ) : (
                          <Button
                            onClick={() => handleTutupBuku(monthItem.bulan)}
                            disabled={!isBalanced}
                            className={`flex items-center gap-2 !px-6 text-xs font-bold ${
                              !isBalanced 
                                ? '!bg-gray-100 !text-gray-400 cursor-not-allowed' 
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            <Unlock size={14} /> Tutup Buku {MONTHS[monthItem.bulan - 1]}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
      {}
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
