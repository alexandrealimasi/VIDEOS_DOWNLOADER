import React from 'react';
import { getStatusBgColor, getStatusLabel } from '../../utils/format';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusBgColor(status)} ${className}`}
    >
      {getStatusLabel(status)}
    </span>
  );
};
