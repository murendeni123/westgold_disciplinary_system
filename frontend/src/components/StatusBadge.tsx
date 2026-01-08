import React from 'react';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'active' | 'inactive';

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '' }) => {
  const getStatusStyles = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      success: { bg: 'bg-green-100', text: 'text-green-800' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      error: { bg: 'bg-red-100', text: 'text-red-800' },
      info: { bg: 'bg-blue-100', text: 'text-blue-800' },
      pending: { bg: 'bg-gray-100', text: 'text-gray-800' },
      active: { bg: 'bg-green-100', text: 'text-green-800' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800' },
      approved: { bg: 'bg-green-100', text: 'text-green-800' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800' },
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };

    return statusMap[status.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const styles = getStatusStyles(status);
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${styles.bg} ${styles.text} ${className}
      `}
    >
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
