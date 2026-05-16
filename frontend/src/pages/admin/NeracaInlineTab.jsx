import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, RefreshCcw, ChevronDown, ChevronUp, Lock, Unlock, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import Button from '../../components/atoms/Button';
import moment from 'moment';
import 'moment/locale/id';

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function NeracaInlineTab({ api, showNotification }) {
  const [yearlyData, setYearlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [expandedMonth, setExpandedMonth] = useState(new Date().getMonth() + 1);

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

  const handleTutupBuku = async (bulan) => {
    const monthData = yearlyData.find(m => m.bulan === bulan);
    if (!monthData) return;
    if (!window.confirm(`Tutup buku untuk ${MONTHS[bulan - 1]} ${tahun}?`)) return;
    try {
      await api.post('/keuangan/neraca/tutup-buku', {
        bulan, tahun: parseInt(tahun), dataNeraca: monthData.data
      });
      showNotification(`Berhasil tutup buku ${MONTHS[bulan - 1]} ${tahun}`, 'success');
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal tutup buku', 'error');
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
      {/* Year Filter */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-gray-400" />
          <span className="text-sm font-bold text-gray-600">Laporan Neraca Tahun:</span>
          <select
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none"
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <p className="text-xs text-gray-400">Menampilkan 12 tabel neraca bulanan</p>
      </div>

      {/* Monthly Accordion Tables */}
      {yearlyData.map((monthItem) => {
        const isExpanded = expandedMonth === monthItem.bulan;
        const hasData = monthItem.data.some(d => d.saldo_akhir !== 0 || d.debit !== 0 || d.kredit !== 0);

        return (
          <motion.div
            key={monthItem.bulan}
            layout
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Month Header */}
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

            {/* Expandable Content */}
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
                          <tr className="bg-[#FFFF00] border-b-2 border-gray-300">
                            <th className="px-6 py-4 text-xs font-black text-gray-900 uppercase tracking-tight border-r border-gray-300">DESKRIPSI</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-900 uppercase tracking-tight text-right border-r border-gray-300">SALDO AWAL</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-900 uppercase tracking-tight text-right border-r border-gray-300">DEBIT</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-900 uppercase tracking-tight text-right border-r border-gray-300">CREDIT</th>
                            <th className="px-6 py-4 text-xs font-black text-gray-900 uppercase tracking-tight text-right bg-blue-50/30">SALDO AKHIR</th>
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
                          {/* Footer */}
                          <tr className="bg-[#FFFF00] border-t-2 border-gray-300">
                            <td className="px-6 py-3 text-xs font-black text-center border-r border-gray-300 uppercase">
                              {moment(`${tahun}-${String(monthItem.bulan).padStart(2, '0')}-01`).format('MMM-YY')}
                            </td>
                            <td className="px-6 py-3 text-xs font-black text-right border-r border-gray-300">
                              {formatRupiah(monthItem.data.filter(d => !d.isTotalRow).reduce((a, c) => a + parseFloat(c.saldo_awal || 0), 0))}
                            </td>
                            <td className="px-6 py-3 text-xs font-black text-right border-r border-gray-300">
                              {formatRupiah(monthItem.data.filter(d => !d.isTotalRow).reduce((a, c) => a + parseFloat(c.debit || 0), 0))}
                            </td>
                            <td className="px-6 py-3 text-xs font-black text-right border-r border-gray-300">
                              {formatRupiah(monthItem.data.filter(d => !d.isTotalRow).reduce((a, c) => a + parseFloat(c.kredit || 0), 0))}
                            </td>
                            <td className="px-6 py-3 text-xs font-black text-right bg-blue-50/20">
                              {formatRupiah(monthItem.data.filter(d => !d.isTotalRow).reduce((a, c) => a + parseFloat(c.saldo_akhir || 0), 0))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Month Actions & Status */}
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                      <div>
                        {(() => {
                          // Calculate overall balance: sum of all non-aggregate rows
                          // Since Assets are (+) and Pasiva are (-), sum should be 0
                          const totalBalance = monthItem.data
                            .filter(d => !d.isTotalRow)
                            .reduce((acc, curr) => acc + parseFloat(curr.saldo_akhir || 0), 0);
                          
                          const isBalanced = Math.abs(totalBalance) < 1;
                          return (
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
                          );
                        })()}
                      </div>

                      {!monthItem.isClosed && (
                        <Button
                          onClick={() => handleTutupBuku(monthItem.bulan)}
                          className="flex items-center gap-2 !px-6 text-xs bg-red-500 hover:bg-red-600"
                        >
                          <Unlock size={14} /> Tutup Buku {MONTHS[monthItem.bulan - 1]}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
