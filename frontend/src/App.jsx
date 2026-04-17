import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/molecules/ProtectedRoute';
import Register from './pages/Register';
import Login from './pages/Login';
import DashboardLayout from './components/templates/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Simpanan from './pages/Simpanan';
import Pinjaman from './pages/Pinjaman';
import Invoice from './pages/Invoice';
import Profile from './pages/Profile';
import PengajuanKeluar from './pages/PengajuanKeluar';
import DashboardPending from './pages/DashboardPending';
import DashboardDitolak from './pages/DashboardDitolak';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Anggota Pending Dashboard */}
          <Route
            path="/dashboard/pending"
            element={
              <ProtectedRoute allowedRoles={['Anggota']} allowedStatus={['Pending']}>
                <DashboardPending />
              </ProtectedRoute>
            }
          />

          {/* Anggota Ditolak Dashboard */}
          <Route
            path="/dashboard/ditolak"
            element={
              <ProtectedRoute allowedRoles={['Anggota']} allowedStatus={['Ditolak']}>
                <DashboardDitolak />
              </ProtectedRoute>
            }
          />

          {/* Anggota Aktif Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['Anggota']} allowedStatus={['Aktif']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="simpanan" element={<Simpanan />} />
            <Route path="pinjaman" element={<Pinjaman />} />
            <Route path="pinjaman/invoice/:id" element={<Invoice />} />
            <Route path="profile" element={<Profile />} />
            <Route path="pengajuan-keluar" element={<PengajuanKeluar />} />
          </Route>

          {/* Admin/Pengurus Dashboard */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Ketua', 'Wakil_Ketua', 'Sekretaris', 'Bendahara', 'Koordinator_Simpan_Pinjam']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all: redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;