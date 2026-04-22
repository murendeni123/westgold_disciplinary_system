import React, { ReactNode } from 'react';
import Button from './Button';
import Input from './Input';
import { Plus, Search, Download } from 'lucide-react';

interface AdminTableLayoutProps {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  onExport?: () => void;
  children: ReactNode;
  createLabel?: string;
}

const AdminTableLayout: React.FC<AdminTableLayoutProps> = ({
  title,
  searchValue,
  onSearchChange,
  onCreateClick,
  onExport,
  children,
  createLabel = 'Create New',
}) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{title}</h1>
        <div className="flex items-center flex-wrap gap-2 sm:gap-3 flex-shrink-0">
          {onExport && (
            <Button variant="secondary" onClick={onExport}>
              <Download size={18} className="mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
          <Button onClick={onCreateClick}>
            <Plus size={18} className="mr-1.5 sm:mr-2" />
            {createLabel}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default AdminTableLayout;

