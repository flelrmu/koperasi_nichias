import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import Logo from '../components/atoms/Logo';
import Button from '../components/atoms/Button';
import StatusBadge from '../components/atoms/StatusBadge';

export default function Invoice() {
  const { id } = useParams();

  // Mock data for the invoice based on the image
  const invoiceData = {
    nomor: `aaa`, // To match the image "aaa"
    tanggalTerbit: '1-1-2025',
    tanggalJatuhTempo: '1-11-2025',
    noHp: '085156462439',
    tempatTanggalLahir: 'Padang, 13-10-2003',
    jabatan: 'Manajer',
    unitKerja: 'HRD',
    alamatLengkap: 'Padang, Padang Panjang',
    noRekening: '23123818244y2',
    status: 'Approved' // Added status for improved design
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  const FormattedField = ({ label, value }) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-[#64748b] uppercase tracking-wide">{label}</span>
      <span className="text-[16px] font-bold text-[#1e293b]">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link to="/pinjaman" className="inline-flex w-full sm:w-auto">
          <Button className="w-full !bg-white border border-gray-200 !text-gray-700 hover:!bg-gray-50 flex items-center justify-center gap-2 shadow-sm rounded-xl py-2.5">
            <ArrowLeft size={18} />
            Kembali ke Pinjaman
          </Button>
        </Link>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-md shadow-[#004A9C]/20 rounded-xl bg-[#004A9C] text-white hover:bg-[#003B7A] py-2.5">
            <Printer size={18} />
            <span>Cetak Invoice</span>
          </Button>
        </div>
      </div>

      {/* Invoice Paper Document */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden relative"
      >
        {/* Decorative Header Border */}
        <div className="h-2 w-full bg-gradient-to-r from-[#004A9C] to-[#4A90E2]"></div>

        <div className="p-8 sm:p-12">
          {/* Invoice Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b border-gray-100 pb-8">
            <div className="transform scale-110 origin-left">
              <Logo />
            </div>
            <div className="text-left md:text-right">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1e293b] tracking-tight">
                INVOICE KOPERASI KARYAWAN
              </h1>
              <h2 className="text-lg sm:text-xl font-bold text-[#004A9C] mt-1 uppercase tracking-widest">
                PT NICHIAS SUNIJAYA
              </h2>
            </div>
          </div>

          {/* Invoice Summary Status */}
          <div className="mb-10 flex justify-between items-end">
             <div>
               <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Status Dokumen</p>
               <StatusBadge status={invoiceData.status} />
             </div>
             <div className="text-right">
               <p className="text-gray-400 text-[13px] font-semibold uppercase tracking-wider mb-1">Invoice ID</p>
               <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <span className="text-lg font-bold text-[#004A9C]">#INV-{id || invoiceData.nomor}-KSP</span>
               </div>
             </div>
          </div>

          {/* Invoice Grid Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-8 bg-[#f8fafc] p-8 rounded-2xl border border-gray-100/80">
            {/* Column 1 */}
            <div className="space-y-8 relative">
              <FormattedField label="Nomor Invoice" value={invoiceData.nomor} />
              <FormattedField label="Tanggal Terbit" value={invoiceData.tanggalTerbit} />
              <FormattedField label="Tanggal Jatuh Tempo" value={invoiceData.tanggalJatuhTempo} />
            </div>

            {/* Column 2 */}
            <div className="space-y-8 relative">
              <div className="hidden sm:block absolute left-[-20px] top-4 bottom-4 w-px bg-gray-200/80"></div>
              <FormattedField label="No HP" value={invoiceData.noHp} />
              <FormattedField label="Tempat Tanggal Lahir" value={invoiceData.tempatTanggalLahir} />
              <FormattedField label="Jabatan" value={invoiceData.jabatan} />
            </div>

            {/* Column 3 */}
            <div className="space-y-8 relative">
              <div className="hidden lg:block absolute left-[-20px] top-4 bottom-4 w-px bg-gray-200/80"></div>
              <FormattedField label="Unit Kerja" value={invoiceData.unitKerja} />
              <FormattedField label="Alamat Lengkap" value={invoiceData.alamatLengkap} />
              <FormattedField label="No Rekening Bank" value={invoiceData.noRekening} />
            </div>
          </div>

          {/* Footer details (To make it look like a complete invoice) */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <div>
              <p className="text-sm font-semibold text-gray-800">Pusat Bantuan Koperasi:</p>
              <p className="text-[13px] text-gray-500 mt-1 flex items-center justify-center md:justify-start gap-3">
                 <span>Email: admin@koperasinichias.com</span>
                 <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                 <span>Telp: (021) 898-1234</span>
              </p>
            </div>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 inline-block w-full md:w-auto">
               <p className="text-[11px] text-[#004A9C] font-semibold text-center uppercase tracking-wider">
                 Dokumen ini digenerate secara otomatis oleh sistem<br/>dan sah tanpa tanda tangan fisik.
               </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
