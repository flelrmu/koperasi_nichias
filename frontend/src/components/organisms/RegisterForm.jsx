import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Input from "../atoms/Input";
import Select from "../atoms/Select";
import Textarea from "../atoms/Textarea";
import Button from "../atoms/Button";
import Modal from "../molecules/Modal";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Check, X, ShieldCheck, Calendar, Loader2 } from "lucide-react";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const API_URL = "http://localhost:5000/api";

const JABATAN_OPTIONS = [
  { value: "", label: "-- Pilih Jabatan --" },
  { value: "Staff", label: "Staff" },
  { value: "Assistant_Manager", label: "Assistant Manager" },
  { value: "Manager", label: "Manager" },
];

const DIVISI_OPTIONS = [
  { value: "", label: "-- Pilih Divisi --" },
  { value: "Marketing", label: "Marketing" },
  { value: "Purchasing", label: "Purchasing" },
  { value: "HRD", label: "HRD" },
  { value: "Admin", label: "Admin" },
  { value: "Keuangan", label: "Keuangan" },
];

// Password validation rules
const PASSWORD_RULES = [
  { label: "Minimal 8 karakter", test: (p) => p.length >= 8 },
  { label: "Huruf besar (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "Huruf kecil (a-z)", test: (p) => /[a-z]/.test(p) },
  { label: "Angka (0-9)", test: (p) => /\d/.test(p) },
  { label: "Simbol (!@#$%...)", test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export default function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nama_lengkap: "",
    no_identitas: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jabatan: "",
    divisi: "",
    no_hp: "",
    no_rekening_bank: "",
    alamat: "",
  });

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const passedRules = PASSWORD_RULES.filter((rule) => rule.test(formData.password));
    return {
      passed: passedRules.length,
      total: PASSWORD_RULES.length,
      percentage: (passedRules.length / PASSWORD_RULES.length) * 100,
      rules: PASSWORD_RULES.map((rule) => ({
        ...rule,
        passed: rule.test(formData.password),
      })),
    };
  }, [formData.password]);

  const strengthColor = useMemo(() => {
    if (passwordStrength.percentage <= 20) return "#EB5757";
    if (passwordStrength.percentage <= 40) return "#F2994A";
    if (passwordStrength.percentage <= 60) return "#F2C94C";
    if (passwordStrength.percentage <= 80) return "#6FCF97";
    return "#27AE60";
  }, [passwordStrength.percentage]);

  const strengthLabel = useMemo(() => {
    if (passwordStrength.percentage <= 20) return "Sangat Lemah";
    if (passwordStrength.percentage <= 40) return "Lemah";
    if (passwordStrength.percentage <= 60) return "Cukup";
    if (passwordStrength.percentage <= 80) return "Kuat";
    return "Sangat Kuat";
  }, [passwordStrength.percentage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation (Semua 11 field wajib diisi)
    if (
      !formData.email ||
      !formData.password ||
      !formData.nama_lengkap ||
      !formData.no_identitas ||
      !formData.tempat_lahir ||
      !formData.tanggal_lahir ||
      !formData.jabatan ||
      !formData.divisi ||
      !formData.no_hp ||
      !formData.no_rekening_bank ||
      !formData.alamat
    ) {
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Pendaftaran Gagal",
        message:
          "Mohon lengkapi seluruh data pendaftaran (11 field wajib diisi).",
      });
      return;
    }

    // Validasi domain email
    const emailDomainRegex = /^[^\s@]+@koperasi-nichias\.co\.id$/i;
    if (!emailDomainRegex.test(formData.email)) {
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Pendaftaran Gagal",
        message: "Email harus menggunakan domain @koperasi-nichias.co.id",
      });
      return;
    }

    // Validasi password complexity
    if (passwordStrength.passed < passwordStrength.total) {
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Pendaftaran Gagal",
        message:
          "Password harus memenuhi semua syarat: minimal 8 karakter, huruf besar, huruf kecil, angka, dan simbol.",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);

      setModalConfig({
        isOpen: true,
        type: "success",
        title: "Pendaftaran Berhasil! 🎉",
        message:
          "Pendaftaran Anda sedang diproses. Silakan lakukan pembayaran simpanan pokok untuk mengaktifkan keanggotaan.",
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Terjadi kesalahan pada server. Silakan coba lagi.";

      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Pendaftaran Gagal",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    const wasSuccess = modalConfig.type === "success";
    setModalConfig({ ...modalConfig, isOpen: false });

    // Redirect ke dashboard pending jika registrasi berhasil
    if (wasSuccess) {
      navigate("/dashboard/pending");
    }
  };

  return (
    <>
      <motion.div
        className="w-full flex flex-col"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
          }
        }}
      >
        <div className="mb-10 lg:text-left text-center">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Register</h2>
          <p className="text-gray-400 font-medium mt-1">Lengkapi data untuk bergabung menjadi anggota</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
            {/* Row 1: Email & Password */}
            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Email Perusahaan</label>
              <Input
                id="register-email"
                name="email"
                type="email"
                placeholder="email@koperasi-nichias.co.id"
                value={formData.email}
                onChange={handleChange}
                required
                className="!py-3.5 bg-gray-50 border-gray-100 focus:bg-white transition-all"
              />
              {formData.email && !/^[^\s@]+@koperasi-nichias\.co\.id$/i.test(formData.email) && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-[#EB5757] mt-1.5 ml-1 font-bold italic"
                >
                  * Harus menggunakan domain @koperasi-nichias.co.id
                </motion.p>
              )}
            </motion.div>

            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Create Password</label>
              <div className="relative">
                <Input
                  id="register-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setTimeout(() => setPasswordFocused(false), 200)}
                  className="pr-12 !py-3.5 bg-gray-50 border-gray-100 focus:bg-white transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#004A9C] transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              <AnimatePresence>
                {formData.password && (passwordFocused || passwordStrength.passed < passwordStrength.total) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 overflow-hidden bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
                  >
                    {/* Strength Bar */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordStrength.percentage}%` }}
                          transition={{ duration: 0.3 }}
                          style={{ backgroundColor: strengthColor }}
                        />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap" style={{ color: strengthColor }}>
                        {strengthLabel}
                      </span>
                    </div>

                    {/* Rules Checklist */}
                    <div className="grid grid-cols-1 gap-1.5">
                      {passwordStrength.rules.map((rule, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex items-center gap-2"
                        >
                          <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-colors ${rule.passed ? 'bg-[#27AE60]/10' : 'bg-gray-100'}`}>
                            {rule.passed ? (
                              <Check size={8} className="text-[#27AE60] shrink-0" />
                            ) : (
                              <X size={8} className="text-gray-300 shrink-0" />
                            )}
                          </div>
                          <span className={`text-[10px] font-bold ${rule.passed ? 'text-[#27AE60]' : 'text-gray-400'}`}>
                            {rule.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Row 2: Nama & No Identitas */}
            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Nama Lengkap</label>
              <Input
                id="register-nama"
                name="nama_lengkap"
                placeholder="Nama sesuai KTP"
                value={formData.nama_lengkap}
                onChange={handleChange}
                required
                className="!py-3.5 bg-gray-50 border-gray-100 focus:bg-white transition-all"
              />
            </motion.div>
            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">No. Identitas (NIK)</label>
              <Input
                id="register-no-identitas"
                name="no_identitas"
                placeholder="16 Digit NIK"
                value={formData.no_identitas}
                onChange={handleChange}
                required
                className="!py-3.5 bg-gray-50 border-gray-100 focus:bg-white transition-all"
              />
            </motion.div>

            {/* Row 3: Tempat & Tanggal Lahir */}
            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Tempat Lahir</label>
              <Input
                id="register-tempat-lahir"
                name="tempat_lahir"
                placeholder="Kota Kelahiran"
                value={formData.tempat_lahir}
                onChange={handleChange}
                required
                className="!py-3.5 bg-gray-50 border-gray-100 focus:bg-white transition-all"
              />
            </motion.div>
            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Tanggal Lahir</label>
              <DatePicker
                selected={formData.tanggal_lahir ? new Date(formData.tanggal_lahir) : null}
                onChange={(date) => setFormData(prev => ({ ...prev, tanggal_lahir: date ? date.toISOString().split('T')[0] : "" }))}
                dateFormat="dd/MM/yyyy"
                placeholderText="DD/MM/YYYY"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                maxDate={new Date()}
                className="w-full !py-3.5 px-4 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004A9C]/20 focus:bg-white transition-all text-gray-700 font-medium lg:text-[12px] text-base"
                required
              />
              <Calendar className="absolute right-4 top-[38px] text-gray-400 pointer-events-none" size={18} />
            </motion.div>


            {/* Row 4: Jabatan & Divisi */}
            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Jabatan</label>
              <Select
                id="register-jabatan"
                name="jabatan"
                options={JABATAN_OPTIONS}
                value={formData.jabatan}
                onChange={handleChange}
                required
                className="!py-3.5 bg-gray-50 border-gray-100 focus:bg-white transition-all"
              />
            </motion.div>
            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Unit Kerja / Divisi</label>
              <Select
                id="register-divisi"
                name="divisi"
                options={DIVISI_OPTIONS}
                value={formData.divisi}
                onChange={handleChange}
                required
                className="!py-3.5 bg-gray-50 border-gray-100 focus:bg-white transition-all"
              />
            </motion.div>

            {/* Row 5: No HP & No Rekening */}
            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Nomor Telepon (WhatsApp)</label>
              <Input
                id="register-no-hp"
                name="no_hp"
                placeholder="08xxxxxxxx"
                value={formData.no_hp}
                onChange={handleChange}
                required
                className="!py-3.5 bg-gray-50 border-gray-100 focus:bg-white transition-all"
              />
            </motion.div>
            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Nomor Rekening Bank</label>
              <Input
                id="register-no-rekening"
                name="no_rekening_bank"
                placeholder="Untuk pencairan dana"
                value={formData.no_rekening_bank}
                onChange={handleChange}
                required
                className="!py-3.5 bg-gray-50 border-gray-100 focus:bg-white transition-all"
              />
            </motion.div>

            {/* Row 6: Alamat (full width) */}
            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }} className="md:col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Alamat Lengkap Sesuai KTP</label>
              <Textarea
                id="register-alamat"
                name="alamat"
                placeholder="Jl. Nama Jalan No. 12, RT/RW..."
                value={formData.alamat}
                onChange={handleChange}
                rows={3}
                required
                className="!py-3.5 bg-gray-50 border-gray-100 focus:bg-white transition-all"
              />
            </motion.div>
          </div>

          <motion.div 
            variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            className="w-full flex flex-col items-center justify-center space-y-6"
          >
            {/* Email domain info */}
            <div className="w-full flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <ShieldCheck size={20} className="text-[#004A9C] shrink-0" />
              <p className="text-[11px] text-[#004A9C] font-bold leading-relaxed">
                Verifikasi keamanan: Akun hanya dapat dibuat menggunakan email perusahaan resmi dengan domain <span className="underline decoration-2">@koperasi-nichias.co.id</span>
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full md:w-auto !px-12 !py-3.5 shadow-2xl shadow-blue-900/20 active:scale-[0.98] transition-all"
            >


              {isLoading ? (
                <span className="flex items-center gap-2 text-xs">
                  <Loader2 size={16} className="animate-spin" />
                  Memproses...
                </span>

              ) : (
                <span className="font-black uppercase tracking-[0.2em] text-xs">Register</span>
              )}
            </Button>
            
            <div className="text-sm text-gray-400 font-medium">
              Sudah memiliki akun?{" "}
              <Link
                to="/login"
                className="font-black text-[#004A9C] hover:text-blue-700 transition-colors"
              >
                Login Di Sini
              </Link>
            </div>
          </motion.div>
        </form>
      </motion.div>

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={handleModalClose}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </>
  );
}
