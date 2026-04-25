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
import { Eye, EyeOff, Check, X, ShieldCheck } from "lucide-react";

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
      <form onSubmit={handleSubmit} className="w-full">
        <h2 className="text-[18px] font-semibold text-[#3b476e] mb-5 lg:text-left text-center">
          Register
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-7">
          {/* Baris 1: Email & Password */}
          <div>
            <Input
              id="register-email"
              name="email"
              type="email"
              placeholder="Email (@koperasi-nichias.co.id) *"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {formData.email && !/^[^\s@]+@koperasi-nichias\.co\.id$/i.test(formData.email) && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-[#EB5757] mt-1.5 ml-1"
              >
                Gunakan email @koperasi-nichias.co.id
              </motion.p>
            )}
          </div>

          <div>
            <div className="relative">
              <Input
                id="register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password *"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setTimeout(() => setPasswordFocused(false), 200)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                  className="mt-2 overflow-hidden"
                >
                  {/* Strength Bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength.percentage}%` }}
                        transition={{ duration: 0.3 }}
                        style={{ backgroundColor: strengthColor }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: strengthColor }}>
                      {strengthLabel}
                    </span>
                  </div>

                  {/* Rules Checklist */}
                  <div className="grid grid-cols-1 gap-1">
                    {passwordStrength.rules.map((rule, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-1.5"
                      >
                        {rule.passed ? (
                          <Check size={12} className="text-[#27AE60] shrink-0" />
                        ) : (
                          <X size={12} className="text-gray-300 shrink-0" />
                        )}
                        <span className={`text-[10px] ${rule.passed ? 'text-[#27AE60]' : 'text-gray-400'}`}>
                          {rule.label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Baris 2: Nama & No Identitas */}
          <Input
            id="register-nama"
            name="nama_lengkap"
            placeholder="Nama Lengkap *"
            value={formData.nama_lengkap}
            onChange={handleChange}
            required
          />
          <Input
            id="register-no-identitas"
            name="no_identitas"
            placeholder="No. Identitas (NIK/KTP) *"
            value={formData.no_identitas}
            onChange={handleChange}
            required
          />

          {/* Baris 3: Tempat Lahir & Tanggal Lahir */}
          <Input
            id="register-tempat-lahir"
            name="tempat_lahir"
            placeholder="Tempat Lahir *"
            value={formData.tempat_lahir}
            onChange={handleChange}
            required
          />
          <Input
            id="register-tanggal-lahir"
            name="tanggal_lahir"
            type="date"
            placeholder="Tanggal Lahir *"
            value={formData.tanggal_lahir}
            onChange={handleChange}
            required
          />

          {/* Baris 4: Jabatan & Divisi */}
          <Select
            id="register-jabatan"
            name="jabatan"
            options={JABATAN_OPTIONS}
            value={formData.jabatan}
            onChange={handleChange}
            required
          />
          <Select
            id="register-divisi"
            name="divisi"
            options={DIVISI_OPTIONS}
            value={formData.divisi}
            onChange={handleChange}
            required
          />

          {/* Baris 5: No HP & No Rekening */}
          <Input
            id="register-no-hp"
            name="no_hp"
            placeholder="Nomor Telepon *"
            value={formData.no_hp}
            onChange={handleChange}
            required
          />
          <Input
            id="register-no-rekening"
            name="no_rekening_bank"
            placeholder="No Rekening Bank *"
            value={formData.no_rekening_bank}
            onChange={handleChange}
            required
          />

          {/* Baris 6: Alamat (full width) */}
          <div className="md:col-span-2">
            <Textarea
              id="register-alamat"
              name="alamat"
              placeholder="Alamat Lengkap *"
              value={formData.alamat}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>
        </div>

        {/* Email domain info */}
        <div className="flex items-center gap-2 mb-5 p-3 bg-[#DFEAF4]/50 rounded-xl border border-[#004A9C]/10">
          <ShieldCheck size={16} className="text-[#004A9C] shrink-0" />
          <p className="text-[11px] text-[#004A9C]/80">
            Gunakan email perusahaan Anda dengan domain <strong>@koperasi-nichias.co.id</strong>
          </p>
        </div>

        <div className="w-full flex flex-col items-center justify-center space-y-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Memproses..." : "Register"}
          </Button>
          <div className="text-[12px] text-gray-500">
            <Link
              to="/login"
              className="font-semibold text-[#0d4c9e] hover:underline"
            >
              Login
            </Link>{" "}
            jika anda sudah memiliki akun
          </div>
        </div>
      </form>

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
