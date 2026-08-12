import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, UserPlus, Clock, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import Button from '../components/atoms/Button';
import { formatRelativeTime } from '../components/molecules/NotificationToast';

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

export default function SemuaNotifikasi() {
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const socket = useSocket();
  const { markAllAsRead, markAsRead: contextMarkAsRead, unreadCount } = useNotifications();
  
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchPage = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.get(`/notifications?page=${page}&limit=15`);
      if (res.data.success) {
        setNotifications(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages);
          setTotalItems(res.data.pagination.totalItems);
          setCurrentPage(res.data.pagination.currentPage);
        } else {
          setTotalItems(res.data.data.length);
        }
      }
    } catch (error) {
      console.error('Error fetching paginated notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchPage(currentPage);
  }, [currentPage, fetchPage]);

  
  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotif = () => {
      if (currentPage === 1) {
        
        setTimeout(() => fetchPage(1), 500);
      }
    };

    socket.on('notifikasi:pendaftaran-baru', handleNewNotif);
    socket.on('member:approved', handleNewNotif);
    socket.on('notifikasi:simpanan', handleNewNotif);
    socket.on('notifikasi:pinjaman', handleNewNotif);
    socket.on('notifikasi:anggota-keluar', handleNewNotif);

    return () => {
      socket.off('notifikasi:pendaftaran-baru', handleNewNotif);
      socket.off('member:approved', handleNewNotif);
      socket.off('notifikasi:simpanan', handleNewNotif);
      socket.off('notifikasi:pinjaman', handleNewNotif);
      socket.off('notifikasi:anggota-keluar', handleNewNotif);
    };
  }, [socket, currentPage, fetchPage]);

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      
      await contextMarkAsRead(notif.id);
    }
    
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await markAllAsRead();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-[#004A9C] rounded-xl flex items-center justify-center shadow-sm">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Semua Notifikasi</h1>
            <p className="text-sm text-gray-500 mt-1">
              Menampilkan total {totalItems} riwayat aktivitas.
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <Button 
            onClick={handleMarkAllRead} 
            className="!bg-[#DFEAF4]/50 !text-[#004A9C] hover:!bg-[#DFEAF4] border border-[#004A9C]/10 flex items-center gap-2 px-5"
          >
            <Check size={18} />
            <span>Tandai Semua Dibaca</span>
          </Button>
        )}
      </motion.div>

      {}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        {isLoading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-10 h-10 border-4 border-gray-200 border-t-[#004A9C] rounded-full"
            />
            <p className="text-gray-400 font-medium animate-pulse">Memuat notifikasi...</p>
          </div>
        ) : notifications.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-gray-50"
          >
            <AnimatePresence mode="popLayout">
              {notifications.map((notif) => {
                const { Icon, color } = getNotifIconAndColor(notif.tipe, notif.is_read);
                return (
                  <motion.div 
                    layout
                    variants={itemVariants}
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={`p-5 sm:p-6 hover:bg-gray-50 transition-colors flex gap-5 sm:gap-6 cursor-pointer relative group ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                  >
                    {!notif.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#004A9C] rounded-r-full shadow-[0_0_10px_rgba(0,74,156,0.3)]"></div>
                    )}
                    
                    <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
                      <Icon size={24} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-4 mb-1.5">
                        <h4 className={`text-base tracking-tight ${!notif.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                          {notif.judul}
                        </h4>
                        <div className="flex flex-col items-end shrink-0 whitespace-nowrap">
                          <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 bg-gray-100/50 px-2.5 py-1 rounded-md mb-1">
                            <Clock size={12} />
                            {formatRelativeTime(notif.created_at)}
                          </span>
                          <span className="text-[10px] font-medium text-gray-400 pr-1">
                            {new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-sm leading-relaxed ${!notif.is_read ? 'text-gray-600' : 'text-gray-500'}`}>
                        {notif.pesan}
                      </p>
                    </div>

                    <div className="hidden sm:flex shrink-0 items-center justify-center w-10">
                      <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 transition-all group-hover:text-[#004A9C] group-hover:border-[#004A9C]/30 shadow-sm">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="py-32 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mb-4">
              <Bell size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">Belum Ada Notifikasi</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Anda tidak memiliki notifikasi apapun saat ini. Segala aktivitas terkait akun Anda akan muncul di sini.
            </p>
          </div>
        )}
      </div>

      {}
      {totalPages > 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100"
        >
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-[#004A9C] hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-600 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Sebelumnya
          </button>
          
          <div className="text-sm font-medium text-gray-500">
            Halaman <span className="font-bold text-[#004A9C]">{currentPage}</span> dari {totalPages}
          </div>
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-[#004A9C] hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-600 cursor-pointer disabled:cursor-not-allowed"
          >
            Selanjutnya
            <ChevronRight size={16} />
          </button>
        </motion.div>
      )}
    </div>
  );
}
