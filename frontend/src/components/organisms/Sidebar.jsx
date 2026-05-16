import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  LogOut, 
  X, 
  LayoutDashboard, 
  User, 
  PiggyBank, 
  BarChart3, 
  Settings
} from 'lucide-react';
import Logo from '../atoms/Logo';
import Modal from '../molecules/Modal';
import { useAuth } from '../../context/AuthContext';
import { MANAGEMENT_ROLES } from '../../utils/roles';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
    navigate('/login');
  };

  // Menu items for Anggota
  const MEMBER_MENU_ITEMS = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Simpan Pinjam', path: '/simpan-pinjam', icon: PiggyBank },
  ];

  // Menu items for Admin/Pengurus
  const ADMIN_MENU_ITEMS = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard, roles: MANAGEMENT_ROLES },
    { name: 'Manajemen Users', path: '/admin/users', icon: User, roles: MANAGEMENT_ROLES },
    { name: 'Simpan Pinjam', path: '/admin/simpan-pinjam', icon: PiggyBank, roles: MANAGEMENT_ROLES },
    { name: 'Keuangan', path: '/admin/keuangan', icon: BarChart3, roles: MANAGEMENT_ROLES },
    { name: 'Konfigurasi', path: '/admin/konfigurasi', icon: Settings, roles: MANAGEMENT_ROLES },
  ];

  // Determine menu items based on role
  const navItems = user?.role === 'Anggota' 
    ? MEMBER_MENU_ITEMS 
    : ADMIN_MENU_ITEMS.filter(item => item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#DFEAF4] flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 h-20 border-b border-[#004A9C]/10">
          <Logo className="w-32" />
          <button onClick={toggleSidebar} className="md:hidden text-[#004A9C]">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
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
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#004A9C]/10 flex flex-col gap-2">
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#EB5757] hover:bg-[#EB5757]/10 rounded-xl transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari sistem?"
        type="error"
        onConfirm={handleLogoutConfirm}
        confirmText="Keluar"
        cancelText="Batal"
      />
    </>
  );
}
