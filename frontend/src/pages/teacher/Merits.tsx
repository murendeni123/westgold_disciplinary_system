import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Plus, Eye } from 'lucide-react';
import AwardMerit from './AwardMerit';
import TeacherViewMerits from './ViewMerits';

const Merits: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'award' | 'view'>('award');

  const tabs = [
    { id: 'award' as const, label: 'Award Merit', icon: Plus },
    { id: 'view' as const, label: 'View Merits', icon: Eye },
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
          <h1 className="text-3xl font-bold text-text-main flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-green to-accent-cyan rounded-xl flex items-center justify-center shadow-primary">
              <Award className="text-card-bg" size={24} />
            </div>
            <span>Merits Management</span>
          </h1>
          <p className="text-text-muted mt-1">Award merits and view merit history</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card-bg rounded-2xl p-2 shadow-card border border-border-line"
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
                  ? 'bg-gradient-to-r from-accent-green to-accent-cyan text-card-bg shadow-primary'
                  : 'text-text-muted hover:bg-border-line hover:text-text-main'
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
        {activeTab === 'award' ? <AwardMerit /> : <TeacherViewMerits />}
      </motion.div>
    </div>
  );
};

export default Merits;
