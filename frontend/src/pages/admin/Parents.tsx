import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import ParentProfileModal from '../../components/ParentProfileModal';
import { motion } from 'framer-motion';
import { Eye, Mail, Users } from 'lucide-react';

const Parents: React.FC = () => {
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    try {
      const response = await api.getParents();
      setParents(response.data);
    } catch (error) {
      console.error('Error fetching parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (parent: any) => {
    setSelectedParent(parent);
    setIsModalOpen(true);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { 
      key: 'children_count', 
      label: 'Children',
      render: (value: number) => value || 0,
    },
    { 
      key: 'created_at', 
      label: 'Joined',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Parents
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Manage all parents in the system</p>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full"
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
                <Users className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">All Parents ({parents.length})</h2>
            </div>
          </div>
          <Table
          columns={[
            ...columns,
            {
              key: 'actions',
              label: 'Actions',
              render: (_value: any, row: any) => (
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedParent(row);
                      setIsModalOpen(true);
                    }}
                  >
                    <Eye size={16} className="mr-1" />
                    View Profile
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `mailto:${row.email}`;
                    }}
                  >
                    <Mail size={16} />
                  </Button>
                </div>
              ),
            },
          ]}
          data={parents.map((parent) => ({
            ...parent,
            children_count: parent.children?.length || 0,
          }))}
          onRowClick={handleRowClick}
        />
        </motion.div>
      )}

      <ParentProfileModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedParent(null);
        }}
        parent={selectedParent}
      />
    </div>
  );
};

export default Parents;

