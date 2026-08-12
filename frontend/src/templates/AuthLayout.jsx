import { motion } from "framer-motion";
import Logo from "../components/atoms/Logo";
import authBg from "../assets/auth-bg.png";
import { ShieldCheck, Users, TrendingUp } from "lucide-react";

export default function AuthLayout({ children, headerRight }) {
  return (
    <div className="min-h-screen w-full flex bg-white font-['Poppins'] overflow-hidden">
      {}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#004A9C] overflow-hidden">
        {}
        <div className="absolute inset-0">
          <img 
            src={authBg} 
            alt="Branding" 
            className="w-full h-full object-cover opacity-40 scale-110 animate-pulse-slow" 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#004A9C] via-[#004A9C]/80 to-transparent" />
        </div>

        {}
        <div className="relative z-10 w-full p-16 flex flex-col justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Logo variant="white" />
          </motion.div>

          <div className="space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
                Membangun <br />
                <span className="text-[#DFEAF4]">Masa Depan</span> <br />
                Bersama Koperasi.
              </h1>
              <p className="mt-6 text-blue-100/80 text-lg max-w-md font-medium leading-relaxed">
                Bergabunglah dengan komunitas finansial yang transparan, aman, dan mementingkan kesejahteraan seluruh anggota.
              </p>
            </motion.div>


          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-blue-100/40 text-sm font-medium"
          >
            &copy; 2026 Koperasi Karyawan Nichias Sunijaya. All rights reserved.
          </motion.p>
        </div>

        {}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
      </div>

      {}
      <div className="w-full lg:w-1/2 min-h-screen relative flex flex-col bg-slate-50 lg:bg-white">
        {}
        <div className="lg:hidden w-full p-8 flex justify-between items-center bg-white border-b border-gray-100 shadow-sm">
          <Logo />
          {headerRight}
        </div>

        {}
        <div className="hidden lg:flex absolute top-10 right-10 z-20">
          {headerRight}
        </div>

        {}
        <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-20 relative">
          {}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-50/30 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

          <div className="w-full max-w-xl relative z-10">
            {}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 text-center lg:text-left"
            >
              <h1 className="text-xl md:text-2xl font-black text-[#004A9C] tracking-tight lg:hidden mb-2">
                KOPERASI KARYAWAN NICHIAS SUNIJAYA
              </h1>
            </motion.div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
