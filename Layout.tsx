import React from 'react';
import { useStore } from '../store/useStore';
import {
  Home, Trophy, Wallet, Users, Bell, User, LogOut, Shield,
  Gamepad2, Menu, X, ChevronRight, MessageSquare
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated, logout, setCurrentPage, currentPage, notifications } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const isAdmin = currentUser?.role === 'admin';

  const userNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'my-games', label: 'My Games', icon: Gamepad2 },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'referral', label: 'Referral', icon: Users },
    { id: 'community', label: 'Community', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'support', label: 'Support', icon: ChevronRight },
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: Shield },
    { id: 'admin-tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'admin-users', label: 'Users', icon: Users },
    { id: 'admin-wallet', label: 'Wallet', icon: Wallet },
    { id: 'admin-community', label: 'Community', icon: MessageSquare },
    { id: 'admin-notifications', label: 'Announcements', icon: Bell },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-800/95 backdrop-blur-md border-b border-neon/20">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1
              className="font-orbitron text-xl font-bold neon-text cursor-pointer"
              onClick={() => setCurrentPage(isAdmin ? 'admin-dashboard' : 'dashboard')}
            >
              FUNTURNA
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {!isAdmin && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-dark-700 rounded-full px-2.5 py-1">
                  <span className="text-sm">⛃</span>
                  <span className="text-blue-400 font-bold text-xs">{currentUser?.diamonds || 0}</span>
                </div>
                <div className="flex items-center gap-1 bg-dark-700 rounded-full px-2.5 py-1">
                  <span className="text-sm">🪙</span>
                  <span className="text-neon font-bold text-xs">{currentUser?.coins || 0}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setCurrentPage('notifications')}
              className="relative p-2 text-gray-400 hover:text-neon transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-14 left-0 bottom-0 z-40 w-64 bg-dark-800 border-r border-dark-600
        transform transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* User Info */}
        <div className="p-4 border-b border-dark-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon to-green-600 flex items-center justify-center text-dark-900 font-bold text-lg">
              {currentUser?.nickname?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{currentUser?.nickname || 'User'}</p>
              <p className="text-gray-400 text-xs">{isAdmin ? '🛡️ Admin' : `UID: ${currentUser?.ffUid}`}</p>
            </div>
          </div>
        </div>

        <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id);
                setMobileMenuOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                ${currentPage === item.id
                  ? 'bg-neon/10 text-neon border border-neon/30'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700'
                }
              `}
            >
              <item.icon size={18} />
              {item.label}
              {item.id === 'notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="mt-14 lg:ml-64 flex-1 min-h-[calc(100vh-56px)]">
        <div className="p-4 max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-dark-800/95 backdrop-blur-md border-t border-dark-600 lg:hidden">
        <div className="flex justify-around py-2">
          {(isAdmin ? adminNavItems.slice(0, 5) : userNavItems.slice(0, 5)).map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 ${
                currentPage === item.id ? 'text-neon' : 'text-gray-500'
              }`}
            >
              <item.icon size={18} />
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
