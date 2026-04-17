import { motion } from 'framer-motion';
import { Wallet, CreditCard, ArrowUpRight, ArrowDownRight, Clock, Plus } from 'lucide-react';
import Button from '../components/atoms/Button';
import StatusBadge from '../components/atoms/StatusBadge';

export default function Dashboard() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  const recentTransactions = [
    { id: 'TRX-001', type: 'Simpanan Wajib', amount: 50000, date: '12 Apr 2026', status: 'Lunas', income: true },
    { id: 'TRX-002', type: 'Angsuran Pinjaman', amount: 350000, date: '10 Apr 2026', status: 'Lunas', income: false },
    { id: 'TRX-003', type: 'Pencairan Pinjaman', amount: 5000000, date: '05 Apr 2026', status: 'Selesai', income: true },
    { id: 'TRX-004', type: 'Simpanan Pokok', amount: 100000, date: '01 Apr 2026', status: 'Lunas', income: true },
  ];

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ringkasan Keuangan</h2>
          <p className="text-gray-500 mt-1">Pantau simpanan dan pinjaman Anda di sini.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#004A9C]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#004A9C]/10 rounded-lg flex items-center justify-center text-[#004A9C]">
              <Wallet size={24} />
            </div>
            <StatusBadge status="Aktif" />
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Simpanan</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">Rp 1.250.000</p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="flex items-center text-[#27AE60] bg-[#27AE60]/10 px-2 py-0.5 rounded-full font-medium">
              <ArrowUpRight size={14} className="mr-1" /> +Rp 50.000
            </span>
            <span className="text-gray-400">Bulan ini</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#EB5757]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#EB5757]/10 rounded-lg flex items-center justify-center text-[#EB5757]">
              <CreditCard size={24} />
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <Clock size={12} className="mr-1" /> 12 Bulan
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Sisa Pinjaman</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">Rp 3.500.000</p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="bg-[#F2994A] h-2 rounded-full" style={{ width: '40%' }}></div>
            </div>
            <span className="text-gray-500 whitespace-nowrap">40% lunas</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#004A9C] to-[#0a3d80] rounded-xl shadow-md p-6 text-white relative overflow-hidden lg:mt-0">
          <div className="absolute right-[-20%] top-[-20%] w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <h3 className="text-white/80 text-sm font-medium mb-1">Tanggal Bergabung</h3>
          <p className="text-lg font-semibold mb-6">10 Jan 2025</p>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-white/20 pb-2">
              <span className="text-white/80">Lama Keanggotaan</span>
              <span className="font-medium">400 Hari</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/80">SHU Tahun Ini</span>
              <span className="font-medium">Rp 125.000</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions Table */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Aktifitas Terakhir</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="py-4 px-6 font-medium">ID Transaksi</th>
                <th className="py-4 px-6 font-medium">Keterangan</th>
                <th className="py-4 px-6 font-medium">Tanggal</th>
                <th className="py-4 px-6 font-medium">Nominal</th>
                <th className="py-4 px-6 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentTransactions.map((trx, index) => (
                <tr key={trx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-gray-800">{trx.id}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{trx.type}</td>
                  <td className="py-4 px-6 text-sm text-gray-500">{trx.date}</td>
                  <td className="py-4 px-6 text-sm font-medium">
                    <span className={trx.income ? 'text-[#27AE60]' : 'text-gray-800'}>
                      {trx.income ? '+' : '-'}Rp {trx.amount.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={trx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Mobile View for Table (Cards instead of rows on very small screens if needed, but table handles scroll with overflow-x-auto) */}
          {recentTransactions.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              Belum ada transaksi.
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 bg-gray-50/30">
          <span>Menampilkan 10 dari 100 data</span>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-white bg-gray-50 disabled:opacity-50 transition-colors" disabled>Sebelumnya</button>
            <button className="px-3 py-1.5 rounded-md bg-[#004A9C] text-white shadow-sm">1</button>
            <button className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-white bg-gray-50 transition-colors hidden sm:block">2</button>
            <button className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-white bg-gray-50 transition-colors hidden sm:block">3</button>
            <span className="px-2 py-1.5 hidden sm:block">...</span>
            <button className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-white bg-gray-50 transition-colors hidden sm:block">10</button>
            <button className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-white bg-gray-50 transition-colors">Selanjutnya</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
