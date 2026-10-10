import React, { useState, ReactNode } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { SystemStatus } from '../../services/api';

interface AppLayoutProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  systemStatus: SystemStatus | null;
  isConnected: boolean;
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onSelectTab,
  systemStatus,
  isConnected,
  children
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        systemStatus={systemStatus}
        isConnected={isConnected}
      />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
