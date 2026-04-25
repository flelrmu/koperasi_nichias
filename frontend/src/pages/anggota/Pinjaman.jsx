import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from '../../components/atoms/StatusBadge';
import Button from '../../components/atoms/Button';
import Input from '../../components/atoms/Input';
import Select from '../../components/atoms/Select';
import Textarea from '../../components/atoms/Textarea';

export default function Pinjaman() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    jenis_pinjaman: 'uang',
    nama_barang: '',
    jumlah_pinjaman: '',
    terbilang: '',
    keperluan: '',
    tenor: '10'
  });

  const formatNumber = (value) => {
    if (!value) return '';
    // Remove all non-digit characters
    const numberValue = value.replace(/\D/g, '');
    // Format with dots as thousands separators
    return numberValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'jumlah_pinjaman') {
      const formattedValue = formatNumber(value);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { y: -20, opacity: 0, transition: { duration: 0.3 } }
  };

  const pinjamanTerbaru = [
    { id: 1, jenis: 'Barang', namaBarang: 'Motor', jumlah: 'Rp 15.000.000', bunga: '-', totalAngsuran: '-', tenor: '-', angsuran: '-', status: 'Pending', invoice: null },
    { id: 2, jenis: 'Uang', namaBarang: 'Motor', jumlah: 'Rp 15.000.000', bunga: '2%', totalAngsuran: 'Rp 17.000.000', tenor: '10 Bulan', angsuran: 'Rp 2.000.000', status: 'Approved', invoice: 'Lihat' },
  ];

  const riwayatPinjaman = [
    { id: 3, jenis: 'Barang', namaBarang: 'Motor', jumlah: 'Rp 15.000.000', bunga: '2%', totalAngsuran: 'Rp 17.000.000', tenor: '10 Bulan', angsuran: 'Rp 2.000.000', status: 'Lunas', invoice: 'Lihat' },
    { id: 4, jenis: 'Uang', namaBarang: 'Motor', jumlah: 'Rp 15.000.000', bunga: '2%', totalAngsuran: 'Rp 17.000.000', tenor: '10 Bulan', angsuran: 'Rp 2.000.000', status: 'Lunas', invoice: 'Lihat' },
  ];

  const renderTable = (data) => (
    <div className="overflow-x-auto w-full border-t border-b border-gray-100">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-white text-[#1e293b] text-sm border-b border-gray-100">
            <th className="py-6 px-6 font-bold whitespace-nowrap">Jenis</th>
            <th className="py-6 px-6 font-bold whitespace-nowrap">Nama Barang</th>
            <th className="py-6 px-6 font-bold whitespace-nowrap">Jumlah</th>
            <th className="py-6 px-6 font-bold whitespace-nowrap">Bunga</th>
            <th className="py-6 px-6 font-bold whitespace-nowrap">Total Angsuran</th>
            <th className="py-6 px-6 font-bold whitespace-nowrap">Tenor</th>
            <th className="py-6 px-6 font-bold whitespace-nowrap">Angsuran</th>
            <th className="py-6 px-6 font-bold whitespace-nowrap">Status</th>
            <th className="py-6 px-6 font-bold whitespace-nowrap">Invoice</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50/50 transition-colors bg-white">
              <td className="py-6 px-6 text-sm text-gray-600 whitespace-nowrap">{row.jenis}</td>
              <td className="py-6 px-6 text-sm text-gray-600 whitespace-nowrap">{row.namaBarang}</td>
              <td className="py-6 px-6 text-sm text-gray-600 whitespace-nowrap">{row.jumlah}</td>
              <td className="py-6 px-6 text-sm text-gray-600 whitespace-nowrap">{row.bunga}</td>
              <td className="py-6 px-6 text-sm text-gray-600 whitespace-nowrap">{row.totalAngsuran}</td>
              <td className="py-6 px-6 text-sm text-gray-600 whitespace-nowrap">{row.tenor}</td>
              <td className="py-6 px-6 text-sm text-gray-600 whitespace-nowrap">{row.angsuran}</td>
              <td className="py-6 px-6 whitespace-nowrap">
                <StatusBadge status={row.status} />
              </td>
              <td className="py-6 px-6 text-sm text-gray-500 font-medium whitespace-nowrap">
                 {row.invoice ? (
                   <Link to={`/pinjaman/invoice/${row.id}`} className="underline cursor-pointer hover:text-[#004A9C] transition-colors text-blue-600">
                     {row.invoice}
                   </Link>
                 ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const Pagination = () => (
    <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400 font-medium">
      <span className="whitespace-nowrap">Showing <span className="font-bold text-gray-700">1-5</span> from <span className="font-bold text-gray-700">100</span> data</span>
      <div className="flex gap-2 justify-center items-center overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-hide">
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors" disabled>
           <ChevronLeft size={20} />
        </button>
        <button className="w-10 h-10 rounded-full bg-[#1e293b] text-white shadow-sm flex items-center justify-center text-sm font-semibold shrink-0">1</button>
        <button className="w-10 h-10 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center text-sm font-semibold shrink-0">2</button>
        <button className="w-10 h-10 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center text-sm font-semibold shrink-0">3</button>
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
           <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );

  const FormLabel = ({ children }) => (
    <label className="block text-[#64748b] text-[15px] font-semibold mb-3">
      {children}
    </label>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pinjaman Anggota</h2>
          <p className="text-gray-500 mt-1">
            {isFormOpen ? "Isi formulir di bawah ini untuk mengajukan pinjaman baru." : "Kelola dan pantau pengajuan pinjaman Anda."}
          </p>
        </div>
        {isFormOpen ? (
          <Button 
            className="flex items-center gap-2 !px-6 !py-2.5 bg-white !text-gray-700 border border-gray-200 hover:!bg-gray-50 hover:border-gray-300 shadow-sm"
            onClick={() => setIsFormOpen(false)}
          >
            <ArrowLeft size={18} />
            Kembali
          </Button>
        ) : (
          <Button 
            className="flex items-center gap-2 !px-6 !py-2.5"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus size={18} />
            Ajukan Pinjaman
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isFormOpen ? (
          <motion.div
            key="form"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="bg-white rounded-[20px] shadow-sm p-8"
          >
            <form className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Column 1 */}
                <div className="space-y-8">
                  <div>
                    <FormLabel>Jenis Pinjaman</FormLabel>
                    <Select 
                      name="jenis_pinjaman"
                      value={formData.jenis_pinjaman}
                      onChange={handleInputChange}
                      options={[
                        { value: 'uang', label: 'Uang' },
                        { value: 'barang', label: 'Barang' }
                      ]}
                      className="text-[#3b2a63] font-bold"
                    />
                  </div>

                  {formData.jenis_pinjaman === 'barang' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <FormLabel>Nama Barang</FormLabel>
                      <Input 
                        name="nama_barang"
                        value={formData.nama_barang}
                        onChange={handleInputChange}
                        placeholder="Masukkan nama barang"
                        className="text-[#3b2a63] font-bold"
                      />
                    </motion.div>
                  )}

                  <div>
                    <FormLabel>Jumlah Pinjaman</FormLabel>
                    <Input 
                      name="jumlah_pinjaman"
                      value={formData.jumlah_pinjaman}
                      onChange={handleInputChange}
                      placeholder="10.000.000"
                      className="text-[#3b2a63] font-bold"
                    />
                  </div>
                  <div>
                    <FormLabel>Terbilang</FormLabel>
                    <Input 
                      name="terbilang"
                      value={formData.terbilang}
                      onChange={handleInputChange}
                      placeholder="Sepuluh Juta Rupiah"
                      className="text-[#3b2a63] font-bold"
                    />
                  </div>
                  <div>
                    <FormLabel>Untuk Keperluan</FormLabel>
                    <Input 
                      name="keperluan"
                      value={formData.keperluan}
                      onChange={handleInputChange}
                      placeholder="Bisnis"
                      className="text-[#3b2a63] font-bold"
                    />
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-8">
                  <div>
                    <FormLabel>Pinjaman yang Disetujui</FormLabel>
                    <Input 
                      placeholder="10.000.000"
                      disabled
                      className="placeholder-[#e2e8f0] text-[#e2e8f0] bg-white border-[#f1f5f9] !opacity-100 font-bold"
                    />
                  </div>
                  <div>
                    <FormLabel>Lama Angsuran</FormLabel>
                    <Select 
                      name="tenor"
                      value={formData.tenor}
                      onChange={handleInputChange}
                      options={[
                        { value: '10', label: '10 Bulan' },
                        { value: '15', label: '15 Bulan' },
                        { value: '20', label: '20 Bulan' }
                      ]}
                      className="text-[#3b2a63] font-bold"
                    />
                  </div>
                  <div>
                    <FormLabel>Catatan Pengurus</FormLabel>
                    <Textarea 
                      rows={5}
                      disabled
                      className="!bg-white border-[#f1f5f9] !opacity-100"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons for Form */}
              <div className="flex justify-end pt-4 gap-4 border-t border-gray-100">
                <Button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="!bg-white border border-gray-200 !text-gray-600 hover:!bg-gray-50 hover:border-gray-300"
                >
                  Batal
                </Button>
                <Button type="button" className="shadow-md shadow-[#004A9C]/20 hover:shadow-lg hover:shadow-[#004A9C]/30 transition-all">
                  Simpan Pengajuan
                </Button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="lists"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="space-y-8"
          >
            <motion.div variants={itemVariants} className="bg-white rounded-[20px] shadow-sm overflow-hidden">
              <div className="px-8 py-7">
                <h3 className="text-2xl font-bold text-[#1e293b]">Pinjaman Terbaru</h3>
              </div>
              
              {renderTable(pinjamanTerbaru)}
              <Pagination />
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-[20px] shadow-sm overflow-hidden">
              <div className="px-8 py-7">
                <h3 className="text-2xl font-bold text-[#1e293b]">Riwayat Pinjaman</h3>
              </div>
              
              {renderTable(riwayatPinjaman)}
              <Pagination />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

