import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Input from "../atoms/Input";
import Button from "../atoms/Button";
import Modal from "../molecules/Modal";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  // Store redirect path for after modal close
  const [pendingRedirect, setPendingRedirect] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate empty fields
    if (!formData.email || !formData.password) {
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Login Gagal",
        message: "Mohon masukkan email dan password Anda.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { user, redirectPath } = await login(formData.email, formData.password);

      setPendingRedirect(redirectPath);
      setModalConfig({
        isOpen: true,
        type: "success",
        title: "Login Berhasil! 🎉",
        message: `Selamat datang, ${user.nama_lengkap || user.email}!`,
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Terjadi kesalahan pada server. Silakan coba lagi.";

      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Login Gagal",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));

    if (pendingRedirect) {
      navigate(pendingRedirect);
      setPendingRedirect(null);
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
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        <div className="mb-8">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Login</h2>
          <p className="text-gray-400 font-medium mt-1">Masuk ke akun anggota koperasi Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col">
          <div className="w-full flex flex-col gap-y-5 mb-8">
            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Email Perusahaan</label>
              <Input
                id="login-email"
                name="email"
                type="email"
                placeholder="email@koperasi-nichias.co.id"
                value={formData.email}
                onChange={handleChange}
                className="!py-4 bg-gray-50 border-gray-100 focus:bg-white transition-all"
              />
            </motion.div>
            
            <motion.div variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Password</label>
              <div className="relative">
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pr-12 !py-4 bg-gray-50 border-gray-100 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#004A9C] transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </motion.div>
          </div>

          <motion.div 
            variants={{ hidden: { y: 10, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
            className="w-full flex flex-col items-center space-y-6"
          >
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full !py-3.5 shadow-2xl shadow-blue-900/20 active:scale-[0.98] transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </span>
              ) : (
                <span className="font-black uppercase tracking-[0.2em] text-xs">Login</span>
              )}
            </Button>
            <div className="text-sm text-gray-400 font-medium">
              Belum punya akun?{" "}
              <Link
                to="/register"
                className="font-black text-[#004A9C] hover:text-blue-700 transition-colors"
              >
                Daftar Sekarang
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
