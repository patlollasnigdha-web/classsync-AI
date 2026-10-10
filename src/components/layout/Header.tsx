import React, { ReactNode } from 'react';
import { Calendar } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="header">
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {title}
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
          {subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--surface-secondary)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)'
        }}>
          <Calendar size={14} />
          <span>{todayFormatted}</span>
        </div>

        {actions}
      </div>
    </header>
  );
};
