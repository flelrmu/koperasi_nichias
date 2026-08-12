import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Info, Clock, UserPlus, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelativeTime } from '../molecules/NotificationToast';

function getNotifIconAndColor(tipe, isRead) {
  switch (tipe) {
    case 'pendaftaran':
      return {
        Icon: UserPlus,
        color: isRead ? 'text-gray-400 bg-gray-100' : 'text-[#004A9C] bg-[#004A9C]/10',
      };
    case 'sistem':
      return {
        Icon: CheckCircle2,
        color: isRead ? 'text-gray-400 bg-gray-100' : 'text-[#F2994A] bg-[#F2994A]/10',
      };
    default:
      return {
        Icon: Bell,
        color: isRead ? 'text-gray-400 bg-gray-100' : 'text-gray-500 bg-gray-100',
      };
  }
}

export default function Topbar({ toggleSidebar }) {
  const { user, updateUserData } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  
  const notifContext = useNotifications();

  
  const notifications = notifContext.notifications;
  const unreadCount = notifContext.unreadCount;
  const markAsRead = notifContext.markAsRead;
  const markAllAsRead = notifContext.markAllAsRead;

  
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

  
  useEffect(() => {
    if (!socket || !user) return;
    const handlePhotoUpdated = (e) => {
      if ((e.type === 'anggota' && user.role === 'Anggota' && e.data.user_id === user.user_id) ||
          (e.type === 'pengurus' && user.role !== 'Anggota' && e.data.user_id === user.user_id)) {
          updateUserData({ foto_profil: e.data.foto_profil });
      }
    };
    socket.on('user:photoUpdated', handlePhotoUpdated);
    return () => socket.off('user:photoUpdated', handlePhotoUpdated);
  }, [socket, user, updateUserData]);

  const handleNotifClick = (notif) => {
    
    if (!notif.is_read && notif.id) {
      markAsRead(notif.id);
    }
    
    if (notif.link) {
      navigate(notif.link);
    }
    setShowNotifications(false);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
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
          {(() => {
            const path = location.pathname;
            if (path === '/dashboard' || path === '/admin/dashboard') return `Dashboard ${user?.role === 'Anggota' ? 'Anggota' : 'Pengurus'}`;
            if (path.includes('/simpanan')) return 'Simpanan';
            if (path.includes('/pinjaman')) return 'Pinjaman';
            if (path.includes('/admin/users')) return 'Manajemen Users';
            if (path.includes('/simpan-pinjam')) return 'Simpan Pinjam';
            if (path.includes('/admin/keuangan')) return 'Keuangan';
            if (path.includes('/admin/konfigurasi')) return 'Konfigurasi';
            if (path.includes('/profile')) return 'Profil Saya';
            if (path.includes('/koperasi-rules')) return 'Peraturan Koperasi';
            if (path.includes('/notifikasi')) return 'Notifikasi';
            if (path.includes('/pengajuan-keluar')) return 'Pengajuan Keluar';
            return `Dashboard ${user?.role === 'Anggota' ? 'Anggota' : 'Pengurus'}`;
          })()}
        </h1>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:text-[#004A9C] transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 bg-[#EB5757] rounded-full border-2 border-white flex items-center justify-center"
              >
                <span className="text-white text-[10px] font-bold leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </motion.span>
            )}
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">Notifikasi</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-[#004A9C] text-white text-[10px] font-bold rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#004A9C] hover:underline font-medium"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>
                
                <div className="max-h-[400px] overflow-y-auto w-full no-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notif) => {
                      const { Icon, color } = getNotifIconAndColor(notif.tipe, notif.is_read);
                      return (
                        <motion.div 
                          key={notif.id} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-4 cursor-pointer relative ${!notif.is_read ? 'bg-[#DFEAF4]/20' : ''}`}
                          onClick={() => handleNotifClick(notif)}
                        >
                          {!notif.is_read && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#004A9C]"></div>
                          )}
                          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                            <Icon size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm tracking-tight mb-0.5 ${!notif.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                              {notif.judul}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-1">
                              {notif.pesan}
                            </p>
                            <span className="text-[10px] font-medium text-gray-400 flex items-center">
                              <Clock size={10} className="mr-1" />
                              {formatRelativeTime(notif.created_at)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-14 h-14 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200 mb-3">
                        <Bell size={28} />
                      </div>
                      <p className="text-sm font-semibold text-gray-400">Belum ada notifikasi</p>
                      <p className="text-xs text-gray-300 mt-1">Notifikasi baru akan muncul di sini</p>
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-100 text-center bg-gray-50/50 hover:bg-gray-100 transition-colors">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(user?.role === 'Anggota' ? '/notifikasi' : '/admin/notifikasi');
                      }}
                      className="text-xs text-[#004A9C] font-bold w-full h-full"
                    >
                      Lihat Semua Notifikasi &rarr;
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {user?.role === 'Anggota' && (
          <Link 
            to="/koperasi-rules" 
            className="p-2 text-gray-500 hover:text-[#004A9C] hover:bg-gray-100 rounded-lg transition-all"
            title="Peraturan Koperasi"
          >
            <Info size={20} />          
          </Link>
        )}
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{userName}</p>
            <p className="text-xs text-gray-500">{userRole}</p>
          </div>
          <Link 
            to={user?.role === 'Anggota' ? '/profile' : '/admin/profile'} 
            className="w-10 h-10 rounded-full bg-[#004A9C] text-white flex items-center justify-center font-semibold border-2 border-[#DFEAF4] hover:ring-2 hover:ring-[#004A9C] hover:ring-offset-2 transition-all overflow-hidden shrink-0"
          >
            {user?.foto_profil ? (
               <img src={`http://localhost:5000${user.foto_profil}`} alt="Avatar" className="w-full h-full object-cover" />
            ) : userInitials}
          </Link>
        </div>
      </div>
    </header>
  );
}
