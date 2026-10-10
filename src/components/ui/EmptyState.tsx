import React, { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <Inbox size={36} strokeWidth={1.5} />,
  action
}) => {
  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--surface)',
      border: '1px border var(--border)',
      borderRadius: 'var(--radius-md)'
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        backgroundColor: 'var(--surface-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
        marginBottom: 16
      }}>
        {icon}
      </div>
      <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
        {title}
      </h4>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 360, margin: '0 auto 20px' }}>
        {description}
      </p>
      {action}
    </div>
  );
};
