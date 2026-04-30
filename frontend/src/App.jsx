import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/molecules/ProtectedRoute';
import { MANAGEMENT_ROLES } from './utils/roles';
import Register from './pages/Register';
import Login from './pages/Login';
import DashboardLayout from './components/templates/DashboardLayout';
import Dashboard from './pages/anggota/Dashboard';
import SimpanPinjamMember from './pages/anggota/SimpanPinjam';
import Invoice from './pages/anggota/Invoice';
import Profile from './pages/Profile';
import KoperasiRules from './pages/KoperasiRules';
import RuleDetail from './pages/RuleDetail';
import PengajuanKeluar from './pages/anggota/PengajuanKeluar';
import DashboardPending from './pages/anggota/DashboardPending';
import DashboardKeluar from './pages/anggota/DashboardKeluar';
import AdminDashboard from './pages/admin/AdminDashboard';
import ConfigRules from './pages/admin/ConfigRules';
import EditRuleDetail from './pages/admin/EditRuleDetail';
import TambahPeraturan from './pages/admin/TambahPeraturan';
import UserManagement from './pages/admin/UserManagement';
import SimpanPinjam from './pages/admin/SimpanPinjam';
import InputBaruSimpanan from './pages/admin/InputBaruSimpanan';
import ManajemenSaldo from './pages/admin/ManajemenSaldo';
import FinanceManagement from './pages/admin/FinanceManagement';
import AdminProfile from './pages/admin/AdminProfile';
import TambahUser from './pages/admin/TambahUser';
import GuestLayout from './components/templates/GuestLayout';
import GuestRules from './pages/GuestRules';
import GuestRuleDetail from './pages/GuestRuleDetail';

import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import NotificationToast from './components/molecules/NotificationToast';
import EditUser from './pages/admin/EditUser';
import SemuaNotifikasi from './pages/SemuaNotifikasi';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <Router>
            <NotificationToast />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              
              {/* Guest Rules Routes */}
              <Route path="/rules" element={<GuestLayout />}>
                <Route index element={<GuestRules />} />
                <Route path=":id" element={<GuestRuleDetail />} />
              </Route>

              {/* Anggota Pending Dashboard */}
              <Route
                path="/dashboard/pending"
                element={
                  <ProtectedRoute allowedRoles={['Anggota']} allowedStatus={['Pending']}>
                    <DashboardPending />
                  </ProtectedRoute>
                }
              />

              {/* Anggota Keluar Dashboard */}
              <Route
                path="/dashboard/keluar"
                element={
                  <ProtectedRoute allowedRoles={['Anggota']} allowedStatus={['Keluar']}>
                    <DashboardKeluar />
                  </ProtectedRoute>
                }
              />

              {/* Anggota Aktif Dashboard */}
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={['Anggota']} allowedStatus={['Aktif', 'Pending_Keluar']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="simpan-pinjam" element={<SimpanPinjamMember />} />
                <Route path="pinjaman/invoice/:id" element={<Invoice />} />
                <Route path="profile" element={<Profile />} />
                <Route path="koperasi-rules" element={<KoperasiRules />} />
                <Route path="koperasi-rules/:id" element={<RuleDetail />} />
                <Route path="pengajuan-keluar" element={<PengajuanKeluar />} />
                <Route path="notifikasi" element={<SemuaNotifikasi />} />
              </Route>

              {/* Admin/Pengurus Dashboard */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['Ketua', 'Wakil_Ketua', 'Sekretaris', 'Bendahara', 'Koordinator_Simpan_Pinjam']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route 
                  path="notifikasi" 
                  element={
                    <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                      <SemuaNotifikasi />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="profile" 
                  element={
                    <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                      <AdminProfile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="users" 
                  element={
                    <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                      <UserManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="users/tambah" 
                  element={
                    <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                      <TambahUser />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="users/edit/:type/:id" 
                  element={
                    <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                      <EditUser />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="simpan-pinjam" 
                  element={
                    <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                      <SimpanPinjam />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="simpan-pinjam/input-baru/:id" 
                  element={
                    <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                      <InputBaruSimpanan />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="simpan-pinjam/manajemen-saldo/:id" 
                  element={
                    <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                      <ManajemenSaldo />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="keuangan" 
                  element={
                    <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                      <FinanceManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="konfigurasi" 
                  element={
                    <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                      <ConfigRules />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="konfigurasi/tambah" 
                  element={
                    <ProtectedRoute allowedRoles={['Sekretaris']}>
                      <TambahPeraturan />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="konfigurasi/:id" 
                  element={
                    <ProtectedRoute allowedRoles={MANAGEMENT_ROLES}>
                      <EditRuleDetail />
                    </ProtectedRoute>
                  } 
                />
              </Route>

              {/* Catch-all: redirect to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;