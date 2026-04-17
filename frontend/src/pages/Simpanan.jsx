import { motion } from 'framer-motion';
import { Wallet, Plus, ArrowUpRight, Clock } from 'lucide-react';
import Button from '../components/atoms/Button';
import StatusBadge from '../components/atoms/StatusBadge';

export default function Simpanan() {
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

  const simpananTransactions = [
    { id: 'SM-001', type: 'Simpanan Sukarela', amount: 150000, date: '15 Apr 2026', status: 'Lunas', income: true },
    { id: 'SM-002', type: 'Simpanan Wajib', amount: 50000, date: '01 Apr 2026', status: 'Lunas', income: true },
    { id: 'SM-003', type: 'Simpanan Pokok', amount: 100000, date: '10 Jan 2025', status: 'Lunas', income: true },
  ];

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Simpanan Anggota</h2>
          <p className="text-gray-500 mt-1">Kelola dan pantau seluruh simpanan Anda.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#004A9C]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#004A9C]/10 rounded-lg flex items-center justify-center text-[#004A9C]">
              <Wallet size={24} />
            </div>
            <StatusBadge status="Aktif" />
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Simpanan Pokok</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">Rp 100.000</p>
          <p className="text-xs text-gray-400 mt-2">Dibayar sekali saat bergabung</p>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#27AE60]/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#27AE60]/10 rounded-lg flex items-center justify-center text-[#27AE60]">
              <Clock size={24} />
            </div>
            <StatusBadge status="Aktif" />
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Simpanan Wajib</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">Rp 750.000</p>
          <p className="text-xs text-[#27AE60] mt-2 font-medium flex items-center"><ArrowUpRight size={14} className="mr-1"/> +Rp 50.000 / bulan</p>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#004A9C] to-[#0a3d80] rounded-xl shadow-md p-6 text-white relative overflow-hidden lg:mt-0 flex flex-col">
          <div className="absolute right-[-20%] top-[-20%] w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
           <div className="flex items-center justify-between mb-2 opacity-80">
            <Wallet size={28} />
          </div>
          <h3 className="text-white/80 text-sm font-medium mb-1">Simpanan Sukarela</h3>
          <p className="text-3xl font-bold mb-4 mt-1">Rp 400.000</p>
          <div className="mt-auto pt-4 border-t border-white/20">
             <div className="flex justify-between items-center text-sm">
              <span className="text-white/80">Total Semua Simpanan</span>
              <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis pl-2">Rp 1.250.000</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Table Section */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-800">Riwayat Transaksi Simpanan</h3>
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-1">
             <select className="bg-transparent text-gray-700 text-sm focus:ring-0 focus:outline-none block p-1.5 w-full">
              <option>Semua Kategori</option>
              <option>Simpanan Pokok</option>
              <option>Simpanan Wajib</option>
              <option>Simpanan Sukarela</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="py-4 px-6 font-medium whitespace-nowrap">ID Transaksi</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Keterangan</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Tanggal</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Nominal</th>
                <th className="py-4 px-6 font-medium whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {simpananTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-gray-800 whitespace-nowrap">{trx.id}</td>
                  <td className="py-4 px-6 text-sm text-gray-600 whitespace-nowrap">{trx.type}</td>
                  <td className="py-4 px-6 text-sm text-gray-500 whitespace-nowrap">{trx.date}</td>
                  <td className="py-4 px-6 text-sm font-medium whitespace-nowrap">
                    <span className={trx.income ? 'text-[#27AE60]' : 'text-[#EB5757]'}>
                      {trx.income ? '+' : '-'}Rp {trx.amount.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <StatusBadge status={trx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {simpananTransactions.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              Belum ada transaksi simpanan.
            </div>
          )}
        </div>
        
        {/* Pagination Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 bg-gray-50/30">
          <span className="whitespace-nowrap">Menampilkan 3 dari 12 data</span>
          <div className="flex gap-1 justify-center overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-hide">
            <button className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-white bg-gray-50 disabled:opacity-50 transition-colors min-w-[80px]" disabled>Prev</button>
            <button className="px-3 py-1.5 rounded-md bg-[#004A9C] text-white shadow-sm shrink-0">1</button>
            <button className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-white bg-gray-50 transition-colors hidden sm:block shrink-0">2</button>
            <button className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-white bg-gray-50 transition-colors hidden sm:block shrink-0">3</button>
            <button className="px-3 py-1.5 rounded-md border border-gray-200 hover:bg-white bg-gray-50 transition-colors min-w-[80px]">Next</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
