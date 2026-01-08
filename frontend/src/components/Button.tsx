import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', children, className = '', style, ...props }) => {
  const baseClasses = 'btn';
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--primary-color, #3b82f6)',
          color: 'white',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--secondary-color, #8b5cf6)',
          color: 'white',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--danger-color, #ef4444)',
          color: 'white',
        };
      default:
        return {};
    }
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      style={{
        ...getVariantStyles(),
        borderRadius: 'var(--button-border-radius, 8px)',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;



