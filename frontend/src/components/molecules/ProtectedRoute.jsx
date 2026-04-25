import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute - Route guard component
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string[]} [props.allowedRoles] - Roles yang diizinkan (opsional)
 * @param {string[]} [props.allowedStatus] - Status keanggotaan yang diizinkan (opsional, untuk Anggota)
 */
export default function ProtectedRoute({ children, allowedRoles, allowedStatus }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#004A9C] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  // Belum login → redirect ke login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Cek role jika ada allowedRoles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect berdasarkan role
    if (user.role === 'Anggota') {
      const status = user.status_keanggotaan;
      if (status === 'Pending') return <Navigate to="/dashboard/pending" replace />;
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Cek status keanggotaan jika ada allowedStatus (untuk Anggota)
  if (allowedStatus && user.role === 'Anggota') {
    if (!allowedStatus.includes(user.status_keanggotaan)) {
      const status = user.status_keanggotaan;
      if (status === 'Pending') return <Navigate to="/dashboard/pending" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
