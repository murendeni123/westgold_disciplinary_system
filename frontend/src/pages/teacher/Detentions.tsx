import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Eye } from 'lucide-react';
import MyDetentions from './MyDetentions';
import TeacherViewDetentions from './ViewDetentions';

const Detentions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my' | 'view'>('my');

  const tabs = [
    { id: 'my' as const, label: 'My Detentions', icon: Calendar },
    { id: 'view' as const, label: 'View All', icon: Eye },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="text-white" size={24} />
            </div>
            <span>Detentions Management</span>
          </h1>
          <p className="text-gray-500 mt-1">Manage and view detention records</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-2 shadow-lg border border-gray-100"
      >
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {activeTab === 'my' ? <MyDetentions /> : <TeacherViewDetentions />}
      </motion.div>
    </div>
  );
};

export default Detentions;
