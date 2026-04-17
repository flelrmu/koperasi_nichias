export default function StatusBadge({ status, children }) {
  const displayStatus = status || children;
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-800';
  
  switch(displayStatus?.toString().toLowerCase()) {
    case 'aktif':
    case 'lunas':
    case 'success':
    case 'selesai':
      bgColor = 'bg-[#27AE60]/10';
      textColor = 'text-[#27AE60]';
      break;
    case 'peringatan':
    case 'progres':
    case 'pending':
    case 'menunggu':
      bgColor = 'bg-[#F2994A]/10';
      textColor = 'text-[#F2994A]';
      break;
    case 'bahaya':
    case 'hutang':
    case 'error':
    case 'gagal':
    case 'ditolak':
      bgColor = 'bg-[#EB5757]/10';
      textColor = 'text-[#EB5757]';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {displayStatus}
    </span>
  );
}
