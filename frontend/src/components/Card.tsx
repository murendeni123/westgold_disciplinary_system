import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  variant?: 'default' | 'dark' | 'glass';
}

const Card: React.FC<CardProps> = ({ children, className = '', title, onClick, variant = 'default' }) => {
  const variantClasses = {
    default: 'bg-card-bg border-border-line text-text-main',
    dark: 'bg-card-bg border-border-line text-text-main',
    glass: 'bg-card-bg/80 backdrop-blur-xl border-border-line text-text-main',
  };

  return (
    <div 
      className={`rounded-2xl border p-6 shadow-card transition-all duration-200 ${variantClasses[variant]} ${onClick ? 'cursor-pointer hover:shadow-card-hover hover:border-accent-green/30' : ''} ${className}`}
      onClick={onClick}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-text-main">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;



