import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  UserCheck,
  UserX
} from 'lucide-react';

export default function StatusBadge({ status, children }) {
  const displayStatus = status || children;
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  let Icon = Clock;
  
  const s = displayStatus?.toString().toLowerCase();

  switch(s) {
    case 'aktif':
    case 'lunas':
    case 'success':
    case 'selesai':
    case 'kredit':
    case 'approved':
      bgColor = 'bg-[#27AE60]/10';
      textColor = 'text-[#27AE60]';
      Icon = s === 'aktif' ? UserCheck : CheckCircle2;
      break;
    case 'peringatan':
    case 'progres':
    case 'pending':
    case 'pending_keluar':
    case 'menunggu':
      bgColor = 'bg-[#F2994A]/10';
      textColor = 'text-[#F2994A]';
      Icon = s === 'pending_keluar' ? AlertTriangle : Clock;
      break;
    case 'bahaya':
    case 'hutang':
    case 'error':
    case 'gagal':
    case 'debit':
    case 'keluar':
    case 'rejected':
      bgColor = 'bg-[#EB5757]/10';
      textColor = 'text-[#EB5757]';
      Icon = s === 'keluar' ? UserX : XCircle;
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${bgColor} ${textColor} border border-current/10 shadow-sm transition-all hover:scale-105`}>
      <Icon size={12} className="stroke-[3]" />
      {displayStatus}
    </span>
  );
}
