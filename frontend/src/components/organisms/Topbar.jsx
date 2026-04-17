import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Info, CheckCircle2, Clock, Wallet, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ toggleSidebar }) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Dynamic user info
  const userName = user?.nama_lengkap || user?.email || 'User';
  const userRole = user?.role === 'Anggota' 
    ? `Anggota ${user?.status_keanggotaan || ''}` 
    : user?.role?.replace(/_/g, ' ') || 'User';
  const userInitials = userName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const notifications = [
    { id: 1, title: 'Pinjaman Disetujui', message: 'Pengajuan pinjaman Anda sebesar Rp 5.000.000 telah disetujui.', time: '5 mnt lalu', type: 'success', icon: CheckCircle2, isRead: false },
    { id: 2, title: 'Tagihan Jatuh Tempo', message: 'Tagihan pinjaman bulan ini jatuh tempo dalam 3 hari.', time: '2 jam lalu', type: 'warning', icon: Clock, isRead: false },
    { id: 3, title: 'Simpanan Sukses', message: 'Simpanan Wajib bulan April berhasil dipotong.', time: '1 hari lalu', type: 'info', icon: Wallet, isRead: true },
    { id: 4, title: 'Promo Merdeka', message: 'Dapatkan bunga pinjaman spesial hanya 0.8% bulan ini!', time: '2 hari lalu', type: 'promo', icon: Star, isRead: true },
    { id: 5, title: 'Pembayaran Diterima', message: 'Terima kasih, angsuran pinjaman Anda telah kami terima.', time: '3 hari lalu', type: 'success', icon: CheckCircle2, isRead: true },
  ];

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const getIconStatusColor = (type) => {
    switch (type) {
      case 'success': return 'text-[#27AE60] bg-[#27AE60]/10';
      case 'warning': return 'text-[#F2994A] bg-[#F2994A]/10';
      case 'promo': return 'text-[#004A9C] bg-[#004A9C]/10';
      case 'info': 
      default: return 'text-gray-500 bg-gray-100';
    }
  };
  return (
    <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-gray-500 hover:text-[#004A9C] hover:bg-gray-100 rounded-lg md:hidden transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">
          Dashboard {user?.role === 'Anggota' ? 'Anggota' : 'Pengurus'}
        </h1>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:text-[#004A9C] transition-colors relative"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#EB5757] rounded-full border-2 border-white animate-pulse"></span>
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50 focus:outline-none"
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-semibold text-gray-800">Notifikasi</h3>
                  <button className="text-xs text-[#004A9C] hover:underline font-medium">Tandai semua dibaca</button>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto w-full no-scrollbar">
                  {notifications.map((notif) => {
                    const NotifIcon = notif.icon;
                    return (
                      <div 
                        key={notif.id} 
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-4 cursor-pointer relative ${!notif.isRead ? 'bg-[#DFEAF4]/20' : ''}`}
                      >
                        {!notif.isRead && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#004A9C]"></div>
                        )}
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getIconStatusColor(notif.type)}`}>
                          <NotifIcon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm tracking-tight mb-0.5 ${!notif.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-1">
                            {notif.message}
                          </p>
                          <span className="text-[10px] font-medium text-gray-400 flex items-center">
                            <Clock size={10} className="mr-1" />
                            {notif.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="p-3 border-t border-gray-100 text-center bg-gray-50/50">
                  <button className="text-sm text-[#004A9C] font-semibold hover:underline">
                    Lihat semua notifikasi
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button className="p-2 text-gray-500 hover:text-[#004A9C] transition-colors relative">
          <Info size={20} />          
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{userName}</p>
            <p className="text-xs text-gray-500">{userRole}</p>
          </div>
          <Link to="/profile" className="w-10 h-10 rounded-full bg-[#004A9C] text-white flex items-center justify-center font-semibold border-2 border-[#DFEAF4] hover:ring-2 hover:ring-[#004A9C] hover:ring-offset-2 transition-all">
            {userInitials}
          </Link>
        </div>
      </div>
    </header>
  );
}
