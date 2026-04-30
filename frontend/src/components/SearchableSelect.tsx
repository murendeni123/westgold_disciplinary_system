import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import ReactDOM from 'react-dom';
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
  // Start hidden+fixed so the portal never renders in normal document flow
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({
    position: 'fixed',
    visibility: 'hidden',
    zIndex: 9999,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const DROPDOWN_MAX_HEIGHT = 264;

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < DROPDOWN_MAX_HEIGHT && rect.top > spaceBelow;

    setDropdownStyle({
      position: 'fixed',
      visibility: 'visible',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  };

  // Focus the search input whenever the dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // Keep dropdown anchored while the user scrolls or resizes
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) return;
      setIsOpen(false);
      setSearchTerm('');
      setFocusedIndex(-1);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && listRef.current && focusedIndex >= 0) {
      const items = listRef.current.children;
      if (items[focusedIndex]) {
        (items[focusedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
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
        setFocusedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
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
    if (onClear) onClear();
    else onChange('');
    setSearchTerm('');
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-card-bg border border-accent-green/50 rounded-xl shadow-2xl overflow-hidden"
    >
      <div className="p-3 border-b border-border-line bg-gradient-to-r from-accent-green/10 to-accent-cyan/10">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-green" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setFocusedIndex(-1); }}
            onKeyDown={handleKeyDown}
            placeholder="Type to search..."
            className="w-full pl-10 pr-4 py-2.5 bg-card-bg border border-border-line rounded-lg focus:outline-none focus:border-accent-green font-medium text-text-main placeholder-text-muted transition-all duration-200"
          />
        </div>
      </div>
      <ul
        ref={listRef}
        style={{ maxHeight: '192px' }}
        className="overflow-y-auto scrollbar-thin scrollbar-thumb-accent-green/30 scrollbar-track-border-line"
        onKeyDown={handleKeyDown}
      >
        {filteredOptions.length === 0 ? (
          <li className="px-4 py-4 text-sm text-text-muted text-center">
            <div className="flex flex-col items-center">
              <Search size={32} className="text-text-muted/50 mb-2" />
              <span className="font-medium">No options found</span>
            </div>
          </li>
        ) : (
          filteredOptions.map((option, index) => (
            <li
              key={option.value}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(option.value); }}
              className={`px-4 py-2.5 cursor-pointer transition-all duration-150 font-medium ${
                value === option.value
                  ? 'bg-gradient-to-r from-accent-green to-accent-cyan text-card-bg'
                  : focusedIndex === index
                  ? 'bg-accent-green/20 text-text-main'
                  : 'hover:bg-border-line text-text-main'
              }`}
            >
              {option.label}
            </li>
          ))
        )}
      </ul>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-text-main mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (disabled) return;
          if (!isOpen) {
            updatePosition();
            setIsOpen(true);
          } else {
            setIsOpen(false);
            setSearchTerm('');
            setFocusedIndex(-1);
          }
        }}
        disabled={disabled}
        className={`w-full px-4 py-3 text-left bg-card-bg border border-border-line rounded-xl
          focus:outline-none focus:border-accent-green focus:ring-2 focus:ring-accent-green/20
          disabled:bg-border-line disabled:cursor-not-allowed
          flex items-center justify-between
          transition-all duration-200 font-medium
          hover:border-accent-green/50
          ${isOpen ? 'border-accent-green ring-2 ring-accent-green/20' : ''}`}
      >
        <span className={selectedOption ? 'text-text-main' : 'text-text-muted'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center space-x-2">
          {showClear && value && (
            <X
              size={16}
              className="text-text-muted hover:text-red-500 transition-colors"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            size={20}
            className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent-green' : ''}`}
          />
        </div>
      </button>

      {isOpen && ReactDOM.createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default SearchableSelect;
