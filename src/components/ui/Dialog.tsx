import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(37, 40, 35, 0.4)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: 520,
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        animation: 'fadeIn 0.15s ease-out'
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--surface)'
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: 6, borderRadius: '50%' }}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
