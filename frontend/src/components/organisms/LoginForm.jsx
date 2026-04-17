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
      <motion.form
        onSubmit={handleSubmit}
        className="w-full flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-[18px] font-semibold text-[#3b476e] mb-5">Login</h2>

        <div className="w-full flex flex-col gap-y-4 mb-6">
          <Input
            id="login-email"
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <div className="relative">
            <Input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="w-full flex flex-col items-center space-y-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memproses...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn size={16} />
                Login
              </span>
            )}
          </Button>
          <div className="text-[12px] text-gray-500">
            <Link
              to="/register"
              className="font-semibold text-[#0d4c9e] hover:underline"
            >
              Register
            </Link>{" "}
            jika anda belum memiliki akun
          </div>
        </div>
      </motion.form>

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
