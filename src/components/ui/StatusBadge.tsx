import React from 'react';

export type StatusType = 
  | 'present' | 'absent' | 'registered' | 'details' 
  | 'faculty' | 'authorized' | 'wrong_section' 
  | 'free_hour' | 'unknown' | 'online' | 'offline';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const norm = status.toLowerCase().trim();
  let badgeClass = 'badge-secondary';
  let displayText = label || status;

  if (['present', 'authorized', 'registered', 'online'].includes(norm)) {
    badgeClass = 'badge-success';
  } else if (['absent', 'wrong_section', 'offline', 'unknown_student'].includes(norm)) {
    badgeClass = 'badge-danger';
  } else if (['free_hour', 'details only', 'details'].includes(norm)) {
    badgeClass = 'badge-warning';
  } else if (['faculty', 'active'].includes(norm)) {
    badgeClass = 'badge-accent';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: 'currentColor',
        display: 'inline-block'
      }} />
      {displayText}
    </span>
  );
};
