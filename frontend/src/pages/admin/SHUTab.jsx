import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Users, Wallet, TrendingUp, CheckCircle2, AlertTriangle, FileText, Download, Settings2 } from 'lucide-react';
import Button from '../../components/atoms/Button';
import Modal from '../../components/molecules/Modal';
import { Search } from 'lucide-react';

export default function SHUTab({ api, showNotification }) {
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [finalAmounts, setFinalAmounts] = useState({
    jatah_anggota: 0,
    jatah_pengurus: 0,
    laba_ditahan: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancellingFinalize, setIsCancellingFinalize] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [confirmProcess, setConfirmProcess] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmCancelFinalize, setConfirmCancelFinalize] = useState(false);

  const yearOptions = Array.from({ length: new Date().getFullYear() - 2024 + 1 }, (_, i) => 2024 + i);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/keuangan/shu/preview?tahun=${tahun}`);
      if (res.data.success) {
        setPreviewData(res.data.data);
        setFinalAmounts({
          jatah_anggota: res.data.data.rekomendasi.jatah_anggota,
          jatah_pengurus: res.data.data.rekomendasi.jatah_pengurus,
          laba_ditahan: res.data.data.rekomendasi.laba_ditahan
        });
      }
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal mengambil preview SHU', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [tahun]);

  const handleProcessSHU = async () => {
    setConfirmProcess(false);
    setIsProcessing(true);
    try {
      await api.post('/keuangan/shu/proses', {
        tahun,
        ...finalAmounts
      });
      // Notification removed per request
      fetchPreview();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal memproses SHU', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalizeSHU = async () => {
    setConfirmFinalize(false);
    setIsFinalizing(true);
    try {
      await api.put('/keuangan/shu/finalize', { tahun });
      // Notification removed per request
      fetchPreview();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal menyimpan data SHU', 'error');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleCancelSHU = async () => {
    setConfirmCancel(false);
    setIsCancelling(true);
    try {
      await api.delete(`/keuangan/shu/${tahun}`);
      // Notification removed per request
      fetchPreview();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal membatalkan SHU', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelFinalizeSHU = async () => {
    setConfirmCancelFinalize(false);
    setIsCancellingFinalize(true);
    try {
      await api.put(`/keuangan/shu/cancel-finalize`, { tahun });
      showNotification(`Finalisasi SHU Tahun ${tahun} telah dibatalkan.`, 'info');
      fetchPreview();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Gagal membatalkan finalisasi SHU', 'error');
    } finally {
      setIsCancellingFinalize(false);
    }
  };

  const filteredDetails = previewData?.existingRekap?.details?.filter(d => 
    d.anggota?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.anggota?.no_anggota?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-4 bg-white rounded-3xl border border-gray-100">
      <Calculator className="animate-bounce" size={40} />
      <p className="font-medium italic">Menganalisis performa tahunan...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-2xl text-[#004A9C]">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800">Kalkulasi SHU Tahunan</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Berdasarkan proporsi simpanan anggota</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200">
            <span className="text-xs font-bold text-gray-500 ml-2">Pilih Tahun Buku:</span>
            <select 
              value={tahun} 
              onChange={(e) => setTahun(e.target.value)}
              className="bg-white px-4 py-2 rounded-xl text-sm font-black border-none outline-none shadow-sm"
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
      </div>

      {previewData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary Cards */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-[#004A9C] to-blue-700 p-6 rounded-[32px] text-white shadow-xl relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
                     <Wallet size={120} />
                  </div>
                  <p className="text-xs font-bold opacity-80 uppercase tracking-tighter">Total Laba Bersih (SHU)</p>
                  <h3 className="text-3xl font-black mt-1">{formatCurrency(previewData.totalProfit)}</h3>
                  <div className="mt-4 flex items-center gap-2 text-[10px] bg-white/20 w-fit px-2 py-1 rounded-full">
                    <CheckCircle2 size={12} /> Terakumulasi s/d 31 Desember
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Simpanan Koperasi</p>
                    <h3 className="text-2xl font-black text-gray-800 mt-1">{formatCurrency(previewData.totalSimpananKoperasi)}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-gray-500">
                    <Users size={16} />
                    <span className="text-xs font-bold">{previewData.memberCount} Anggota Terdaftar</span>
                  </div>
                </div>
              </div>

              {/* Config & Action */}
              <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                 <div className="flex items-center gap-2 mb-2">
                   <Settings2 size={18} className="text-gray-400" />
                   <h4 className="text-sm font-black text-gray-700">Konfigurasi Pembagian</h4>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Jatah Anggota (80%)</label>
                      <input 
                        type="number" 
                        className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-2xl font-bold text-sm outline-none focus:border-blue-200 transition-all disabled:opacity-50"
                        value={previewData.existingRekap ? previewData.existingRekap.jatah_anggota : finalAmounts.jatah_anggota}
                        disabled={!!previewData.existingRekap}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setFinalAmounts(prev => ({ 
                            ...prev, 
                            jatah_anggota: val,
                            laba_ditahan: previewData.totalProfit - val - prev.jatah_pengurus
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Jatah Pengurus (15%)</label>
                      <input 
                        type="number" 
                        className="w-full bg-gray-50 border-2 border-gray-100 p-3 rounded-2xl font-bold text-sm outline-none focus:border-blue-200 transition-all disabled:opacity-50"
                        value={previewData.existingRekap ? previewData.existingRekap.jatah_pengurus : finalAmounts.jatah_pengurus}
                        disabled={!!previewData.existingRekap}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setFinalAmounts(prev => ({ 
                            ...prev, 
                            jatah_pengurus: val,
                            laba_ditahan: previewData.totalProfit - prev.jatah_anggota - val
                          }));
                        }}
                      />
                    </div>
                     <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Laba Ditahan (5%)</label>
                      <div className="w-full bg-gray-100 border-2 border-gray-100 p-3 rounded-2xl font-bold text-sm text-gray-500">
                         {formatCurrency(previewData.existingRekap ? previewData.existingRekap.laba_ditahan : finalAmounts.laba_ditahan)}
                      </div>
                    </div>
                 </div>

                 <div className="pt-4 flex items-center justify-between border-t border-dashed border-gray-100">
                    <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                      <AlertTriangle size={16} />
                      <span className="text-[10px] font-bold">
                        {previewData.existingRekap 
                          ? (previewData.existingRekap.is_finalized ? 'Data SHU tahun ini sudah final.' : 'Data sudah diproses sementara. Klik simpan untuk finalisasi.')
                          : 'Pastikan data simpanan sudah final sebelum memproses.'}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      {previewData.existingRekap ? (
                        <>
                          {!previewData.existingRekap.is_finalized && (
                            <>
                              <Button 
                                onClick={() => setConfirmCancel(true)}
                                className="!bg-red-50 !text-red-600 border border-red-100 hover:!bg-red-100 flex items-center gap-2"
                                disabled={isCancelling || isFinalizing}
                              >
                                {isCancelling ? 'Membatalkan...' : 'Cancel Proses'}
                              </Button>
                              <Button 
                                onClick={() => setConfirmFinalize(true)}
                                className="!bg-[#004A9C] hover:!bg-blue-800 !text-white flex items-center gap-2 shadow-lg shadow-blue-200"
                                disabled={isFinalizing || isCancelling}
                              >
                                <TrendingUp size={18} /> {isFinalizing ? 'Menyimpan...' : 'Simpan Data SHU'}
                              </Button>
                            </>
                          )}
                          {previewData.existingRekap.is_finalized && (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 px-6 py-3 rounded-2xl border border-green-100">
                                <CheckCircle2 size={20} />
                                <span>SHU SUDAH FINAL</span>
                              </div>
                              <Button 
                                onClick={() => setConfirmCancelFinalize(true)}
                                className="!bg-red-50 !text-red-600 border border-red-100 hover:!bg-red-100 flex items-center gap-2"
                                disabled={isCancellingFinalize}
                              >
                                {isCancellingFinalize ? 'Membatalkan...' : 'Batalkan Finalisasi'}
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <Button 
                          onClick={() => setConfirmProcess(true)}
                          className="!bg-green-600 hover:!bg-green-700 !text-white flex items-center gap-2"
                          disabled={isProcessing}
                        >
                          <CheckCircle2 size={18} /> {isProcessing ? 'Memproses...' : 'Proses SHU Sekarang'}
                        </Button>
                      )}
                    </div>
                 </div>
              </div>
            </div>

            {/* Right Info */}
            <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-200/50 flex flex-col gap-6">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-3">Ketentuan Pembagian</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <p className="text-[11px] text-gray-600 leading-relaxed font-medium">Berdasarkan AD/ART, pembagian anggota diprioritaskan bagi yang memiliki simpanan aktif.</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <p className="text-[11px] text-gray-600 leading-relaxed font-medium">Dana Cadangan berfungsi memperkuat modal koperasi tahun buku berikutnya.</p>
                  </li>
                </ul>
              </div>

              <div className="mt-auto p-4 bg-[#004A9C]/5 rounded-2xl border border-blue-100 flex flex-col gap-2">
                 <div className="flex items-center gap-2 text-[#004A9C]">
                    <FileText size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">Laporan Distribusi</span>
                 </div>
                 <p className="text-[10px] text-blue-600/70 font-medium leading-tight">Daftar rincian SHU per anggota dapat diunduh setelah proses kalkulasi selesai.</p>
                 <button className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-white text-[#004A9C] text-[10px] font-bold rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors">
                    <Download size={14} /> Download PDF Rekap
                 </button>
              </div>
            </div>
          </div>

          {/* TABLE SECTION */}
          {previewData.existingRekap && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h4 className="text-lg font-black text-gray-800">Rincian Pembagian Per Anggota</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase">Hasil kalkulasi proporsional berdasarkan saldo simpanan</p>
                </div>
                <div className="relative w-full md:w-64">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Cari Nama / No Anggota..."
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold outline-none focus:border-[#004A9C] transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">No</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Anggota</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Total Simpanan</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Proporsi (%)</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">SHU Dibagikan</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Pembulatan</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Yield (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredDetails.length > 0 ? (
                      filteredDetails.map((detail, idx) => {
                        const pembulatan = Math.floor(detail.shu_diterima / 100) * 100; // Round to nearest 100
                        const yieldVal = detail.total_simpanan > 0 ? (detail.shu_diterima / detail.total_simpanan) * 100 : 0;
                        
                        return (
                          <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-6 py-4 text-[10px] font-bold text-gray-400">{idx + 1}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-gray-800">{detail.anggota?.nama_lengkap}</span>
                                <span className="text-[10px] font-bold text-[#004A9C] opacity-60 tracking-tighter">{detail.anggota?.no_anggota}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-600">
                              {formatCurrency(detail.total_simpanan)}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <span className="text-[10px] font-black bg-blue-50 text-[#004A9C] px-2 py-1 rounded-lg border border-blue-100">
                                 {(detail.persentase * 100).toFixed(4)}%
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                               {formatCurrency(detail.shu_diterima)}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <span className="text-sm font-black text-green-600">
                                 {formatCurrency(pembulatan)}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <span className="text-[10px] font-black text-blue-500">
                                 {yieldVal.toFixed(2)}%
                               </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-8 py-20 text-center text-gray-400 italic">
                           Tidak ada data yang cocok dengan pencarian.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* CONFIRMATION MODALS */}
          <Modal 
            isOpen={confirmProcess} 
            onClose={() => setConfirmProcess(false)}
            title="Proses Kalkulasi SHU"
            message={`Lakukan kalkulasi pembagian SHU untuk tahun ${tahun}? Anda masih bisa membatalkan atau mengubah data sebelum disimpan ke Neraca.`}
            type="warning"
            onConfirm={handleProcessSHU}
            confirmText="Ya, Proses"
          />

          <Modal 
            isOpen={confirmFinalize} 
            onClose={() => setConfirmFinalize(false)}
            title="Simpan Data ke Neraca"
            message={`Finalisasi data SHU tahun ${tahun}? Laba ditahan akan dipindahkan ke saldo awal Neraca tahun berikutnya. Anda masih dapat membatalkannya nanti melalui tombol Batalkan Finalisasi jika diperlukan.`}
            type="warning"
            onConfirm={handleFinalizeSHU}
            confirmText="Simpan & Finalisasi"
          />

          <Modal 
            isOpen={confirmCancel} 
            onClose={() => setConfirmCancel(false)}
            title="Batalkan Proses SHU"
            message="Semua perhitungan sementara akan dihapus. Anda harus memproses ulang jika ingin melakukan pembagian kembali."
            type="error"
            onConfirm={handleCancelSHU}
            confirmText="Ya, Batalkan"
          />

          <Modal 
            isOpen={confirmCancelFinalize} 
            onClose={() => setConfirmCancelFinalize(false)}
            title="Batalkan Finalisasi SHU"
            message="Apakah Anda yakin ingin membatalkan finalisasi SHU? Laba ditahan akan dikeluarkan kembali dari Neraca dan status data akan kembali menjadi draft (belum final)."
            type="error"
            onConfirm={handleCancelFinalizeSHU}
            confirmText="Ya, Batalkan Finalisasi"
          />
        </div>
      )}
    </div>
  );
}
