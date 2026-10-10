import React, { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: string;
  badge?: ReactNode;
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  loading = false,
}) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        {icon && (
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--surface-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)'
          }}>
            {icon}
          </div>
        )}
      </div>

      <div>
        {loading ? (
          <div style={{ height: 32, width: 90, backgroundColor: 'var(--surface-secondary)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {value}
            </span>
            {badge}
          </div>
        )}
      </div>

      {subtitle && (
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
};
