import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ label = 'Loading...', size = 20 }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, color: 'var(--text-secondary)' }}>
      <Loader2 size={size} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
