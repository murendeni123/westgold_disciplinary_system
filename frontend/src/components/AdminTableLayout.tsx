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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <div className="flex items-center space-x-3">
          {onExport && (
            <Button variant="secondary" onClick={onExport}>
              <Download size={20} className="mr-2" />
              Export
            </Button>
          )}
          <Button onClick={onCreateClick}>
            <Plus size={20} className="mr-2" />
            {createLabel}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default AdminTableLayout;

