import React from 'react';
import { 
  LayoutDashboard, 
  Video, 
  Users, 
  GraduationCap, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Wifi,
  WifiOff
} from 'lucide-react';
import { SystemStatus } from '../../services/api';

export type NavTab = 
  | 'dashboard' 
  | 'live-attendance' 
  | 'students' 
  | 'classes' 
  | 'records' 
  | 'analytics' 
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  systemStatus: SystemStatus | null;
  isConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  systemStatus,
  isConnected
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'live-attendance', label: 'Live Attendance', icon: <Video size={18} /> },
    { id: 'students', label: 'Students', icon: <Users size={18} /> },
    { id: 'classes', label: 'Classes', icon: <GraduationCap size={18} /> },
    { id: 'records', label: 'Attendance Records', icon: <ClipboardList size={18} /> },
    { id: 'analytics', label: 'Analytics & Reports', icon: <BarChart3 size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div style={{
        height: 64,
        padding: collapsed ? '0 16px' : '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: 'var(--accent)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldCheck size={18} />
          </div>
          {!collapsed && (
            <span style={{
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap'
            }}>
              ClassSync AI
            </span>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '10px 0' : '9px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                fontWeight: isActive ? 600 : 400,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                width: '100%',
                fontSize: 13
              }}
              title={collapsed ? item.label : undefined}
            >
              <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div style={{
        padding: collapsed ? '16px 8px' : '16px 16px',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--surface-secondary)',
        fontSize: 11
      }}>
        {!collapsed ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, color: isConnected ? 'var(--success)' : 'var(--danger)' }}>
                {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
                {isConnected ? 'Backend Connected' : 'Offline'}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>v1.0.0</span>
            </div>
            {systemStatus && (
              <div style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
                {systemStatus.model_status.loaded ? 'InsightFace Active' : 'Model Loading'}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', color: isConnected ? 'var(--success)' : 'var(--danger)' }}>
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          </div>
        )}
      </div>
    </aside>
  );
};
