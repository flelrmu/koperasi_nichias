import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Bell, X, Clock } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

function formatRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function getNotifIcon(tipe) {
  switch (tipe) {
    case 'pendaftaran': return UserPlus;
    default: return Bell;
  }
}

function getNotifColor(tipe) {
  switch (tipe) {
    case 'pendaftaran': return { bg: 'bg-[#004A9C]/10', text: 'text-[#004A9C]', border: 'border-[#004A9C]/20', glow: 'shadow-[#004A9C]/10' };
    case 'sistem': return { bg: 'bg-[#F2994A]/10', text: 'text-[#F2994A]', border: 'border-[#F2994A]/20', glow: 'shadow-[#F2994A]/10' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200', glow: 'shadow-gray-200/10' };
  }
}

function SingleToast({ toast, onDismiss, index }) {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(100);
  const Icon = getNotifIcon(toast.tipe);
  const colors = getNotifColor(toast.tipe);
  const DURATION = 8000;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(toast._toastId);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast._toastId, onDismiss]);

  const handleClick = () => {
    if (toast.link) {
      navigate(toast.link);
    }
    onDismiss(toast._toastId);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 400, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.8, transition: { duration: 0.3 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      style={{ top: `${index * 8 + 24}px` }}
      className={`relative w-[380px] bg-white rounded-2xl shadow-2xl ${colors.glow} border ${colors.border} overflow-hidden cursor-pointer group hover:scale-[1.02] transition-transform`}
      onClick={handleClick}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
        <motion.div
          className="h-full bg-[#004A9C] rounded-r-full"
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
      </div>

      <div className="flex items-start gap-3.5 p-4 pt-5">
        {/* Icon */}
        <div className={`shrink-0 w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text}`}>
          <Icon size={22} strokeWidth={2.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <h4 className="text-sm font-bold text-gray-800 tracking-tight mb-0.5">
            {toast.judul}
          </h4>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {toast.pesan}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <Clock size={10} className="text-gray-300" />
            <span className="text-[10px] font-semibold text-gray-400">
              {formatRelativeTime(toast.created_at)}
            </span>
            {toast.link && (
              <span className="text-[10px] font-bold text-[#004A9C] ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                Lihat Detail →
              </span>
            )}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(toast._toastId);
          }}
          className="absolute top-3 right-3 p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
}

export default function NotificationToast() {
  const { toastQueue, dismissToast } = useNotifications();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toastQueue.slice(0, 5).map((toast, index) => (
          <div key={toast._toastId} className="pointer-events-auto">
            <SingleToast
              toast={toast}
              onDismiss={dismissToast}
              index={index}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export { formatRelativeTime };
