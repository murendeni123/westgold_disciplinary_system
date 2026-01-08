import React from 'react';

interface BackgroundGradientProps {
  children: React.ReactNode;
  className?: string;
}

const BackgroundGradient: React.FC<BackgroundGradientProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className}`}>
      {children}
    </div>
  );
};

export default BackgroundGradient;

