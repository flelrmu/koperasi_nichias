import { motion } from "framer-motion";
import AuthLayout from "../templates/AuthLayout";
import LoginForm from "../components/organisms/LoginForm";

export default function Login() {
  return (
    <AuthLayout>
      <motion.div 
        key="login"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="w-full max-w-[400px]"
      >
        <LoginForm />
      </motion.div>
    </AuthLayout>
  );
}
