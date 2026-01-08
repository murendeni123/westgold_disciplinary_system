import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ModernPageHeaderProps {
  title: string;
  icon?: LucideIcon;
  subtitle?: string;
  action?: React.ReactNode;
}

const ModernPageHeader: React.FC<ModernPageHeaderProps> = ({
  title,
  icon: Icon,
  subtitle,
  action,
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {Icon && (
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

export default ModernPageHeader;

