import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { isManagement } from '../utils/roles';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const socket = useSocket();
  const { api, user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastQueue, setToastQueue] = useState([]);

  // Use refs to avoid stale closures in socket handlers
  const authRef = useRef({ isAuthenticated, user });
  useEffect(() => {
    authRef.current = { isAuthenticated, user };
  }, [isAuthenticated, user]);

  // Fetch notifications from API (for persisted notifications)
  const fetchNotifications = useCallback(async () => {
    if (!authRef.current.isAuthenticated) return;
    
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    }
  }, [api]);

  // Fetch on mount and when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, user?.role, fetchNotifications]);

  // Listen for real-time Socket.IO events
  useEffect(() => {
    if (!socket) return;

    const handleNewRegistration = (data) => {
      console.log('🔔 Real-time notifikasi:pendaftaran-baru received:', data);
      
      const { isAuthenticated: authed, user: currentUser } = authRef.current;
      if (!authed || currentUser?.role !== 'Sekretaris') return;

      const newNotif = {
        id: `temp_${Date.now()}`,
        judul: data.notifikasi.judul,
        pesan: data.notifikasi.pesan,
        tipe: data.notifikasi.tipe,
        link: data.notifikasi.link,
        is_read: false,
        created_at: data.notifikasi.created_at,
      };

      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      setToastQueue(prev => [...prev, { ...newNotif, _toastId: Date.now() }]);

      // Refetch from DB to get real notification IDs
      setTimeout(() => fetchNotifications(), 1500);
    };

    // Handle member approval notification (for Anggota role)
    const handleMemberApproved = (data) => {
      console.log('🔔 Real-time member:approved received:', data);
      
      const { isAuthenticated: authed, user: currentUser } = authRef.current;
      if (!authed) return;

      // Check if this approval is for the current user
      if (currentUser?.user_id === data.user_id) {
        const newNotif = {
          id: `temp_approved_${Date.now()}`,
          judul: 'Pendaftaran Diterima! 🎉',
          pesan: 'Selamat! Pendaftaran Anda telah disetujui. Anda sekarang resmi menjadi anggota Koperasi Nichias.',
          tipe: 'sistem',
          link: '/dashboard',
          is_read: false,
          created_at: new Date().toISOString(),
        };

        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
        // Toast disabled for approval as per user request
        // setToastQueue(prev => [...prev, { ...newNotif, _toastId: Date.now() }]);
      }
    };

    const handleSimpananNotif = (data) => {
      console.log('🔔 Real-time notifikasi:simpanan received:', data);
      const { isAuthenticated: authed, user: currentUser } = authRef.current;
      if (!authed || currentUser?.user_id !== data.user_id) return;

      const newNotif = {
        id: `temp_simpanan_${Date.now()}`,
        judul: data.notifikasi.judul,
        pesan: data.notifikasi.pesan,
        tipe: 'simpanan',
        link: '/simpan-pinjam',
        is_read: false,
        created_at: new Date().toISOString(),
      };

      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Don't show toast for initial Simpanan Pokok notification
      if (!data.notifikasi.judul.includes('Simpanan Pokok')) {
        setToastQueue(prev => [...prev, { ...newNotif, _toastId: Date.now() }]);
      }
      
      setTimeout(() => fetchNotifications(), 1500);
    };

    const handleUserUpdated = (data) => {
      console.log('🔔 Real-time user:updated received:', data);
      const { isAuthenticated: authed, user: currentUser } = authRef.current;
      if (!authed || !currentUser) return;

      // Check if current user is the one updated
      if (data.type === 'Anggota' && data.id === currentUser.anggota_id) {
        if (data.data?.status_keanggotaan === 'Keluar') {
          // Update local storage and redirect
          const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
          savedUser.status_keanggotaan = 'Keluar';
          localStorage.setItem('user', JSON.stringify(savedUser));
          window.location.href = '/dashboard/keluar';
        } else if (data.data?.status_keanggotaan === 'Aktif') {
          // If approved from pending_keluar or similar
          const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
          savedUser.status_keanggotaan = 'Aktif';
          localStorage.setItem('user', JSON.stringify(savedUser));
          // Don't necessarily redirect if they are already on dashboard
        }
      }
    };

    const handleAnggotaKeluarNotif = (data) => {
      console.log('🔔 Real-time notifikasi:anggota-keluar received:', data);
      const { isAuthenticated: authed, user: currentUser } = authRef.current;
      
      // Only show to Sekretaris (administrative responsibility)
      if (!authed || currentUser?.role !== 'Sekretaris') return;

      const newNotif = {
        id: `temp_keluar_${Date.now()}`,
        judul: data.notifikasi.judul,
        pesan: data.notifikasi.pesan,
        tipe: 'anggota',
        link: data.notifikasi.link,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      setToastQueue(prev => [...prev, { ...newNotif, _toastId: Date.now() }]);
      
      setTimeout(() => fetchNotifications(), 1500);
    };

    const handlePinjamanNotif = (data) => {
      console.log('🔔 Real-time notifikasi:pinjaman received:', data);
      const { isAuthenticated: authed, user: currentUser } = authRef.current;
      
      // Only show if it's meant for the current user
      if (!authed || currentUser?.user_id !== data.user_id) return;

      const newNotif = {
        id: data.notifikasi?.id || `temp_pinjaman_${Date.now()}`,
        judul: data.notifikasi?.judul || 'Pembaruan Pinjaman 📝',
        pesan: data.notifikasi?.pesan || 'Ada pembaruan pada pengajuan pinjaman Anda.',
        tipe: 'pinjaman',
        link: data.notifikasi?.link || (currentUser?.role === 'Koordinator_Simpan_Pinjam' ? '/admin/simpan-pinjam' : '/simpan-pinjam'),
        is_read: false,
        created_at: data.notifikasi?.created_at || new Date().toISOString(),
      };

      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      setToastQueue(prev => [...prev, { ...newNotif, _toastId: Date.now() }]);
      
      // Still fetch from DB to ensure state consistency (real IDs, etc.)
      setTimeout(() => fetchNotifications(), 1500);
    };

    const handleSHUNotif = (data) => {
      console.log('🔔 Real-time notifikasi:shu received:', data);
      const { isAuthenticated: authed, user: currentUser } = authRef.current;
      if (!authed || currentUser?.role !== 'Anggota') return;

      const newNotif = {
        id: `temp_shu_${Date.now()}`,
        judul: data.notifikasi?.judul || 'SHU Telah Diterima 🎉',
        pesan: data.notifikasi?.pesan || 'Pembagian SHU telah masuk ke akun Anda.',
        tipe: 'sistem',
        link: '/dashboard',
        is_read: false,
        created_at: new Date().toISOString(),
      };

      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      setToastQueue(prev => [...prev, { ...newNotif, _toastId: Date.now() }]);
      
      setTimeout(() => fetchNotifications(), 1500);
    };

    const handleSHUProsesSukses = (data) => {
      console.log('🔔 Real-time notifikasi:shu-proses-sukses received:', data);
      const { isAuthenticated: authed, user: currentUser } = authRef.current;
      if (!authed || currentUser?.role !== 'Bendahara') return;

      const newNotif = {
        id: `temp_shu_proses_${Date.now()}`,
        judul: data.notifikasi?.judul || 'SHU Berhasil Diproses 📊',
        pesan: data.notifikasi?.pesan || 'Data SHU berhasil diproses oleh Bendahara.',
        tipe: 'sistem',
        link: '/admin/simpan-pinjam',
        is_read: false,
        created_at: new Date().toISOString(),
      };

      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      setToastQueue(prev => [...prev, { ...newNotif, _toastId: Date.now() }]);
      
      setTimeout(() => fetchNotifications(), 1500);
    };

    const handleSHUFinalSukses = (data) => {
      console.log('🔔 Real-time notifikasi:shu-final-sukses received:', data);
      const { isAuthenticated: authed, user: currentUser } = authRef.current;
      if (!authed || currentUser?.role !== 'Bendahara') return;

      const newNotif = {
        id: `temp_shu_final_${Date.now()}`,
        judul: data.notifikasi?.judul || 'SHU Berhasil Dibagikan 🎉',
        pesan: data.notifikasi?.pesan || 'Distribusi SHU berhasil diselesaikan.',
        tipe: 'sistem',
        link: '/admin/simpan-pinjam',
        is_read: false,
        created_at: new Date().toISOString(),
      };

      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
      setToastQueue(prev => [...prev, { ...newNotif, _toastId: Date.now() }]);
      
      setTimeout(() => fetchNotifications(), 1500);
    };

    const handleReconnect = () => {
      console.log('🔄 Socket reconnected, refetching notifications...');
      const { isAuthenticated: authed } = authRef.current;
      if (authed) {
        fetchNotifications();
      }
    };

    socket.on('notifikasi:pendaftaran-baru', handleNewRegistration);
    socket.on('notifikasi:simpanan', handleSimpananNotif);
    socket.on('notifikasi:anggota-keluar', handleAnggotaKeluarNotif);
    socket.on('notifikasi:pinjaman', handlePinjamanNotif);
    socket.on('notifikasi:shu', handleSHUNotif);
    socket.on('notifikasi:shu-proses-sukses', handleSHUProsesSukses);
    socket.on('notifikasi:shu-final-sukses', handleSHUFinalSukses);
    socket.on('member:approved', handleMemberApproved);
    socket.on('user:updated', handleUserUpdated);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('notifikasi:pendaftaran-baru', handleNewRegistration);
      socket.off('notifikasi:simpanan', handleSimpananNotif);
      socket.off('notifikasi:anggota-keluar', handleAnggotaKeluarNotif);
      socket.off('notifikasi:pinjaman', handlePinjamanNotif);
      socket.off('notifikasi:shu', handleSHUNotif);
      socket.off('notifikasi:shu-proses-sukses', handleSHUProsesSukses);
      socket.off('notifikasi:shu-final-sukses', handleSHUFinalSukses);
      socket.off('member:approved', handleMemberApproved);
      socket.off('user:updated', handleUserUpdated);
      socket.off('connect', handleReconnect);
    };
  }, [socket, fetchNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id) => {
    if (String(id).startsWith('temp_')) {
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }, [api]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
    }
  }, [api]);

  // Remove a toast from the queue
  const dismissToast = useCallback((toastId) => {
    setToastQueue(prev => prev.filter(t => t._toastId !== toastId));
  }, []);

  // Manual notification trigger
  const showNotification = useCallback((pesan, tipe = 'sistem', judul = 'Pemberitahuan') => {
    const newToast = {
      id: `toast_${Date.now()}`,
      judul,
      pesan,
      tipe,
      is_read: false,
      created_at: new Date().toISOString(),
      _toastId: Date.now()
    };
    setToastQueue(prev => [...prev, newToast]);
  }, []);

  const value = {
    notifications,
    unreadCount,
    toastQueue,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissToast,
    showNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Alias for convenience
export const useNotification = useNotifications;

export default NotificationContext;
