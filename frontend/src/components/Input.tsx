import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-text-main mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 bg-card-bg border rounded-xl text-text-main placeholder-text-muted transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-border-line'} ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Input;



