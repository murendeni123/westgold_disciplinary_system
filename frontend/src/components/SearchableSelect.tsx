import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string | number | '';
  onChange: (value: string | number) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showClear?: boolean;
  onClear?: () => void;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Search and select...',
  required = false,
  disabled = false,
  showClear = false,
  onClear,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && listRef.current && focusedIndex >= 0) {
      const items = listRef.current.children;
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          handleSelect(filteredOptions[focusedIndex].value);
        } else if (filteredOptions.length === 1) {
          handleSelect(filteredOptions[0].value);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      onChange('');
    }
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-3 text-left bg-gray-50 border-2 border-gray-200 rounded-xl
            focus:outline-none focus:border-blue-500 focus:bg-white
            disabled:bg-gray-100 disabled:cursor-not-allowed
            flex items-center justify-between
            transition-all duration-200 font-medium
            hover:border-blue-300 hover:shadow-md
            ${isOpen ? 'border-blue-500 bg-white shadow-md' : ''}
          `}
        >
          <span className={selectedOption ? 'text-gray-700' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className="flex items-center space-x-2">
            {showClear && value && (
              <X
                size={16}
                className="text-gray-400 hover:text-red-500 transition-colors"
                onClick={handleClear}
              />
            )}
            <ChevronDown
              size={20}
              className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-500 rounded-xl shadow-2xl max-h-64 overflow-hidden">
            <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setFocusedIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type to search..."
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-gray-700 transition-all duration-200"
                />
              </div>
            </div>
            <ul
              ref={listRef}
              className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100"
              onKeyDown={handleKeyDown}
            >
              {filteredOptions.length === 0 ? (
                <li className="px-4 py-4 text-sm text-gray-500 text-center">
                  <div className="flex flex-col items-center">
                    <Search size={32} className="text-gray-300 mb-2" />
                    <span className="font-medium">No options found</span>
                  </div>
                </li>
              ) : (
                filteredOptions.map((option, index) => (
                  <li
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      px-4 py-2.5 cursor-pointer transition-all duration-150 font-medium
                      ${value === option.value 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                        : 'hover:bg-blue-50 text-gray-700'
                      }
                      ${focusedIndex === index && value !== option.value ? 'bg-blue-100' : ''}
                    `}
                  >
                    {option.label}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;
