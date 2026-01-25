import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import Table from '../../components/Table';
import Button from '../../components/Button';
import ParentProfileModal from '../../components/ParentProfileModal';
import { motion } from 'framer-motion';
import { Eye, Mail, Users, Search } from 'lucide-react';

const Parents: React.FC = () => {
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter parents based on search query
  const filteredParents = parents.filter((parent) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      parent.name?.toLowerCase().includes(searchLower) ||
      parent.email?.toLowerCase().includes(searchLower)
    );
  });

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

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search parents by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
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
        <>
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Parents</p>
                  <p className="text-4xl font-bold mt-2">{parents.length}</p>
                </div>
                <Users size={48} className="text-purple-200 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Children</p>
                  <p className="text-4xl font-bold mt-2">
                    {parents.reduce((sum, p) => sum + (p.children?.length || 0), 0)}
                  </p>
                </div>
                <Users size={48} className="text-blue-200 opacity-50" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Avg Children</p>
                  <p className="text-4xl font-bold mt-2">
                    {parents.length > 0 
                      ? (parents.reduce((sum, p) => sum + (p.children?.length || 0), 0) / parents.length).toFixed(1)
                      : 0}
                  </p>
                </div>
                <Users size={48} className="text-amber-200 opacity-50" />
              </div>
            </div>
          </motion.div>

          {/* Parents Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/20 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
                  <Users className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">All Parents</h2>
              </div>
            </div>

            {filteredParents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                <p>{searchQuery ? 'No parents match your search' : 'No parents found'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredParents.map((parent, index) => (
                  <motion.div
                    key={parent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleRowClick(parent)}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer bg-white"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{parent.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {parent.email}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-t border-gray-100">
                        <span className="text-sm text-gray-600">Children</span>
                        <span className="text-lg font-bold text-purple-600">
                          {parent.children?.length || 0}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-t border-gray-100">
                        <span className="text-sm text-gray-600">Joined</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {new Date(parent.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedParent(parent);
                          setIsModalOpen(true);
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <Eye size={16} className="inline mr-1" />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `mailto:${parent.email}`;
                        }}
                        className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Mail size={16} className="inline mr-1" />
                        Email
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
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

