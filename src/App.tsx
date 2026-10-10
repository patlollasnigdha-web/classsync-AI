import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { NavTab } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { LiveAttendancePage } from './pages/LiveAttendancePage';
import { StudentsPage } from './pages/StudentsPage';
import { ClassesPage } from './pages/ClassesPage';
import { AttendanceRecordsPage } from './pages/AttendanceRecordsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api, SystemStatus } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const checkStatus = async () => {
    try {
      const status = await api.getStatus();
      setSystemStatus(status);
      setIsConnected(true);
    } catch {
      setIsConnected(false);
      setSystemStatus(null);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setActiveTab} isConnected={isConnected} />;
      case 'live-attendance':
        return <LiveAttendancePage />;
      case 'students':
        return <StudentsPage />;
      case 'classes':
        return <ClassesPage />;
      case 'records':
        return <AttendanceRecordsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage systemStatus={systemStatus} isConnected={isConnected} onRefreshStatus={checkStatus} />;
      default:
        return <DashboardPage onNavigate={setActiveTab} isConnected={isConnected} />;
    }
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      systemStatus={systemStatus}
      isConnected={isConnected}
    >
      {renderActivePage()}
    </AppLayout>
  );
};
export default App;
