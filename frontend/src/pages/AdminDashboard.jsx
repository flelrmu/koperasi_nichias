import { motion } from 'framer-motion';
import { Users, Clock, Wallet, CreditCard, LogOut, LayoutDashboard, UserCheck, Settings, PiggyBank, BarChart3 } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/atoms/Logo';
import StatusBadge from '../components/atoms/StatusBadge';

// Menu items per role
const ALL_MENU_ITEMS = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: ['Ketua', 'Wakil_Ketua', 'Sekretaris', 'Bendahara', 'Koordinator_Simpan_Pinjam'] },
  { name: 'Manajemen Anggota', path: '/admin/anggota', icon: UserCheck, roles: ['Sekretaris'] },
  { name: 'Simpan Pinjam', path: '/admin/simpan-pinjam', icon: PiggyBank, roles: ['Koordinator_Simpan_Pinjam'] },
  { name: 'Keuangan', path: '/admin/keuangan', icon: BarChart3, roles: ['Bendahara'] },
  { name: 'Konfigurasi', path: '/admin/konfigurasi', icon: Settings, roles: ['Sekretaris'] },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = user?.role?.replace(/_/g, ' ') || 'Pengurus';
  const userInitials = (user?.nama_lengkap || 'P')
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Filter menu based on user role
  const visibleMenuItems = ALL_MENU_ITEMS.filter(item => item.roles.includes(user?.role));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  // Placeholder stats
  const stats = [
    { label: 'Total Anggota', value: '3', icon: Users, color: '#004A9C' },
    { label: 'Pending Approval', value: '0', icon: Clock, color: '#F2994A' },
    { label: 'Total Simpanan', value: 'Rp 3.750.000', icon: Wallet, color: '#27AE60' },
    { label: 'Total Pinjaman Aktif', value: 'Rp 8.500.000', icon: CreditCard, color: '#EB5757' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-poppins flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#DFEAF4] flex-col fixed inset-y-0 left-0 z-50">
        <div className="flex items-center p-6 h-20 border-b border-[#004A9C]/10">
          <Logo className="w-32" />
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#004A9C] text-white shadow-md'
                    : 'text-gray-700 hover:bg-[#004A9C]/10 hover:text-[#004A9C]'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#004A9C]/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#EB5757] hover:bg-[#EB5757]/10 rounded-xl transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <h1 className="text-xl font-semibold text-gray-800">Dashboard Pengurus</h1>

          <div className="flex items-center gap-3 pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{user?.nama_lengkap || 'Pengurus'}</p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#004A9C] text-white flex items-center justify-center font-semibold border-2 border-[#DFEAF4]">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">
            {/* Welcome */}
            <motion.div variants={itemVariants}>
              <h2 className="text-2xl font-bold text-gray-800">
                Selamat Datang, {user?.nama_lengkap || 'Pengurus'}!
              </h2>
              <p className="text-gray-500 mt-1">
                Anda login sebagai <strong>{roleLabel}</strong>. Kelola koperasi dari panel ini.
              </p>
            </motion.div>

            {/* Role badge */}
            <motion.div variants={itemVariants} className="flex items-center gap-2">
              <StatusBadge status="Aktif" />
              <span className="text-sm text-gray-500">Role: {roleLabel}</span>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                      >
                        <Icon size={20} />
                      </div>
                    </div>
                    <h3 className="text-gray-500 text-xs font-medium">{stat.label}</h3>
                    <p className="text-xl font-bold text-gray-800 mt-1">{stat.value}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Placeholder Notice */}
            <motion.div
              variants={itemVariants}
              className="bg-[#DFEAF4]/50 border border-[#004A9C]/10 rounded-2xl p-6 text-center"
            >
              <LayoutDashboard size={32} className="text-[#004A9C]/40 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Fitur Pengurus Sedang Dikembangkan</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Fitur detail untuk setiap role pengurus (Manajemen Anggota, Simpan Pinjam, Keuangan, Konfigurasi) akan segera tersedia.
              </p>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
