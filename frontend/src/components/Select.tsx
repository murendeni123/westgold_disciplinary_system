import React from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: Option[];
  error?: string;
  children?: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, options, error, className = '', children, ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-text-main mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-2.5 bg-card-bg border rounded-xl text-text-main transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green appearance-none cursor-pointer ${error ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-border-line'} ${className}`}
        {...props}
      >
        {children || (
          <>
            <option value="" className="bg-card-bg text-text-muted">Select...</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value} className="bg-card-bg text-text-main">
                {option.label}
              </option>
            ))}
          </>
        )}
      </select>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Select;



