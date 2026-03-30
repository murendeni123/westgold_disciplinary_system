import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, X, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemePreviewBanner: React.FC = () => {
  const { isPreviewMode, previewSchoolName, exitPreview, publishPreview } = useTheme();

  if (!isPreviewMode) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-secondary to-secondary text-white shadow-lg"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye size={20} />
              <div>
                <p className="font-semibold">Previewing Draft Theme</p>
                <p className="text-xs text-white/80">
                  {previewSchoolName ? `for ${previewSchoolName}` : 'Theme preview active'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={publishPreview}
                className="flex items-center space-x-2 px-4 py-2 bg-surface/20 hover:bg-surface/30 rounded-lg transition-colors text-sm font-medium"
              >
                <Check size={16} />
                <span>Publish Theme</span>
              </button>
              
              <button
                onClick={exitPreview}
                className="flex items-center space-x-2 px-4 py-2 bg-surface/20 hover:bg-surface/30 rounded-lg transition-colors text-sm font-medium"
              >
                <X size={16} />
                <span>Exit Preview</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThemePreviewBanner;
