import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto left-0 sm:left-64">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className={`inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all my-8 align-middle ${sizeClasses[size]} w-full max-h-[90vh] flex flex-col relative z-10`}>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          <div className="px-4 pb-4 sm:px-6 sm:pb-6 overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;



