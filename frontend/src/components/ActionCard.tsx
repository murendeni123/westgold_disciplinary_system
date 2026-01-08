import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon: Icon,
  onClick,
  variant = 'primary',
  className = '',
}) => {
  const variantStyles = {
    primary: 'bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 text-blue-600',
    secondary: 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300 text-gray-600',
    success: 'bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300 text-green-600',
    warning: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 hover:border-yellow-300 text-yellow-600',
    danger: 'bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300 text-red-600',
  };

  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-lg border-2 transition-colors text-left
        ${variantStyles[variant]}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className}
      `}
      disabled={!onClick}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${variantStyles[variant].split(' ')[0]}`}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{title}</p>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      </div>
    </button>
  );
};

export default ActionCard;
