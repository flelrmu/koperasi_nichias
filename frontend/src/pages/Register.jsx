import { Info } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AuthLayout from "../templates/AuthLayout";
import RegisterForm from "../components/organisms/RegisterForm";

export default function Register() {
  const headerRightObj = (
    <Link 
      to="/rules"
      className="flex items-center gap-2 text-gray-400 hover:text-[#004A9C] transition-colors cursor-pointer mr-2"
    >
      <Info className="w-5 h-5" />
      <span className="text-sm font-bold hidden sm:inline-block uppercase tracking-widest">
        Aturan Koperasi
      </span>
    </Link>
  );

  return (
    <AuthLayout headerRight={headerRightObj}>
      <motion.div 
        key="register"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="w-full max-w-4xl"
      >
        <RegisterForm />
      </motion.div>
    </AuthLayout>
  );
}
