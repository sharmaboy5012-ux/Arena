import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { Layout } from './components/Layout';
import { FunturnaLoader } from './components/FunturnaLoader';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CompleteProfilePage } from './pages/CompleteProfilePage';
import { DeviceErrorPage } from './pages/DeviceErrorPage';
import { DashboardPage } from './pages/DashboardPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { MyGamesPage } from './pages/MyGamesPage';
import { WalletPage } from './pages/WalletPage';
import { ReferralPage } from './pages/ReferralPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SupportPage } from './pages/SupportPage';
import { CommunityPage } from './pages/CommunityPage';
import { TermsPage, PrivacyPage } from './pages/StaticPages';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminTournaments } from './pages/admin/AdminTournaments';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminWallet } from './pages/admin/AdminWallet';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminCommunity } from './pages/admin/AdminCommunity';

function App() {
  const { currentPage, isAuthenticated, isLoading, initialize } = useStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return <FunturnaLoader text="Preparing your arena" />;
  }

  const renderPage = () => {
    if (currentPage === 'complete-profile') return <CompleteProfilePage />;
    if (currentPage === 'device-error') return <DeviceErrorPage />;

    if (!isAuthenticated) {
      switch (currentPage) {
        case 'login': return <LoginPage />;
        case 'register': return <RegisterPage />;
        case 'terms': return <TermsPage />;
        case 'privacy': return <PrivacyPage />;
        case 'support-page': return <SupportPage />;
        default: return <HomePage />;
      }
    }

    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'tournaments': return <TournamentsPage />;
      case 'my-games': return <MyGamesPage />;
      case 'wallet': return <WalletPage />;
      case 'referral': return <ReferralPage />;
      case 'profile': return <ProfilePage />;
      case 'notifications': return <NotificationsPage />;
      case 'support': return <SupportPage />;
      case 'community': return <CommunityPage />;
      case 'admin-dashboard': return <AdminDashboard />;
      case 'admin-tournaments': return <AdminTournaments />;
      case 'admin-users': return <AdminUsers />;
      case 'admin-wallet': return <AdminWallet />;
      case 'admin-notifications': return <AdminNotifications />;
      case 'admin-community': return <AdminCommunity />;
      default: return <DashboardPage />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
}

export default App;
