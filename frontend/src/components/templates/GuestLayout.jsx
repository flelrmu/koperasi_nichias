import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import Logo from '../atoms/Logo';
import Button from '../atoms/Button';
import { motion } from 'framer-motion';

export default function GuestLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDetail = location.pathname !== '/rules';

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-poppins flex flex-col">
      {/* Premium Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="cursor-pointer" onClick={() => navigate('/register')}>
              <Logo />
            </div>
            
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-[#DFEAF4] rounded-full">
              <div className="w-2 h-2 rounded-full bg-[#004A9C] animate-pulse"></div>
              <span className="text-xs font-bold text-[#004A9C] uppercase tracking-wider">Public Information</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(isDetail ? '/rules' : '/register')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all ${
                isDetail 
                ? 'text-gray-500 hover:text-[#004A9C] hover:bg-[#DFEAF4]' 
                : 'bg-white text-[#004A9C] border border-[#004A9C] hover:bg-[#004A9C] hover:text-white shadow-sm'
              }`}
            >
              {isDetail ? <ChevronLeft size={18} /> : <Home size={18} />}
              <span className="hidden sm:inline">{isDetail ? 'Kembali' : 'Pendaftaran'}</span>
            </motion.button>
            
            <div className="h-8 w-[1px] bg-gray-200 mx-2 hidden sm:block"></div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="bg-[#004A9C] hover:bg-[#003B7A] text-white px-8 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-900/10 transition-all"
            >
              Login
            </motion.button>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Basic Footer */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center text-sm text-gray-500">
          <p>© 2026 Koperasi Karyawan Nichias Sunijaya. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
