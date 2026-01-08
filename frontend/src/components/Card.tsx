import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, onClick }) => {
  return (
    <div 
      className={`card ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={{
        borderRadius: 'var(--card-border-radius, 12px)',
        backgroundColor: 'white',
        color: 'var(--text-primary-color, #111827)',
      }}
    >
      {title && (
        <h3 
          className="text-lg font-semibold mb-4"
          style={{ color: 'var(--text-primary-color, #111827)' }}
        >
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;



