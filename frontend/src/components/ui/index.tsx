/**
 * Premium UI Component Library
 * 
 * A collection of modern, professional UI components with:
 * - Smooth animations via Framer Motion
 * - Gradient effects and glassmorphism
 * - Consistent design language across all portals
 * - Accessible and responsive
 */

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { LucideIcon, Loader2 } from 'lucide-react';

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline' | 'glass';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40',
  secondary: 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg shadow-slate-500/25',
  success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40',
  danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40',
  warning: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 hover:text-gray-900',
  outline: 'bg-transparent border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50',
  glass: 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white shadow-lg',
};

const buttonSizes: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
  xl: 'px-6 py-3 text-lg gap-2.5',
};

const buttonRounded: Record<string, string> = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
};

const iconSizes: Record<ButtonSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  rounded = 'lg',
  disabled,
  className = '',
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02, y: disabled || loading ? 0 : -1 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center font-medium
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
        ${buttonVariants[variant]}
        ${buttonSizes[size]}
        ${buttonRounded[rounded]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <Loader2 className="animate-spin" size={iconSizes[size]} />
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon size={iconSizes[size]} />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={iconSizes[size]} />
      )}
    </motion.button>
  );
};

// ============================================================================
// CARD COMPONENT
// ============================================================================

type CardVariant = 'default' | 'elevated' | 'glass' | 'gradient' | 'bordered' | 'flat';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  onClick?: () => void;
}

const cardVariants: Record<CardVariant, string> = {
  default: 'bg-white border border-gray-200 shadow-sm',
  elevated: 'bg-white shadow-xl shadow-gray-200/50 border border-gray-100',
  glass: 'bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl',
  gradient: 'bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-lg',
  bordered: 'bg-white border-2 border-gray-200',
  flat: 'bg-gray-50 border border-gray-100',
};

const cardPadding: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  padding = 'lg',
  hover = false,
  onClick,
}) => {
  const hoverClasses = hover ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : '';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      onClick={onClick}
      className={`
        rounded-2xl transition-all duration-300
        ${cardVariants[variant]}
        ${cardPadding[padding]}
        ${hoverClasses}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate';
  variant?: 'default' | 'gradient' | 'minimal';
}

const statColors = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
    gradient: 'from-blue-500 to-blue-600',
    text: 'text-blue-600',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white',
    gradient: 'from-emerald-500 to-emerald-600',
    text: 'text-emerald-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-gradient-to-br from-red-500 to-red-600 text-white',
    gradient: 'from-red-500 to-red-600',
    text: 'text-red-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white',
    gradient: 'from-amber-500 to-orange-500',
    text: 'text-amber-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white',
    gradient: 'from-purple-500 to-purple-600',
    text: 'text-purple-600',
  },
  slate: {
    bg: 'bg-slate-50',
    icon: 'bg-gradient-to-br from-slate-500 to-slate-600 text-white',
    gradient: 'from-slate-500 to-slate-600',
    text: 'text-slate-600',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  variant = 'default',
}) => {
  const colors = statColors[color];

  if (variant === 'gradient') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4, scale: 1.02 }}
        className={`
          relative overflow-hidden rounded-2xl p-6
          bg-gradient-to-br ${colors.gradient} text-white
          shadow-lg shadow-${color}-500/25
        `}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-white/80">{title}</p>
            {Icon && (
              <div className="p-2 bg-white/20 rounded-xl">
                <Icon size={20} />
              </div>
            )}
          </div>
          <p className="text-3xl font-bold mb-1">{value}</p>
          {subtitle && <p className="text-sm text-white/70">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-3">
              <span className={`text-sm font-medium ${trend.positive ? 'text-green-200' : 'text-red-200'}`}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              {trend.label && <span className="text-xs text-white/60">{trend.label}</span>}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4"
      >
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-3">
              <span className={`text-sm font-semibold ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              {trend.label && <span className="text-xs text-gray-400">{trend.label}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colors.icon} shadow-lg`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================================
// BADGE COMPONENT
// ============================================================================

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  icon?: LucideIcon;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

const badgeDots: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  purple: 'bg-purple-500',
};

const badgeSizes: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  icon: Icon,
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border
        ${badgeVariants[variant]}
        ${badgeSizes[size]}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${badgeDots[variant]}`} />}
      {Icon && <Icon size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} />}
      {children}
    </span>
  );
};

// ============================================================================
// INPUT COMPONENT
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-xl border bg-white
            text-gray-900 placeholder-gray-400
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 hover:border-gray-300'}
            ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        {Icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-gray-500">{hint}</p>}
    </div>
  );
});

Input.displayName = 'Input';

// ============================================================================
// ACTION CARD COMPONENT
// ============================================================================

interface ActionCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate';
  onClick?: () => void;
  badge?: string;
  disabled?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon: Icon,
  color = 'blue',
  onClick,
  badge,
  disabled = false,
}) => {
  const colors = statColors[color];

  return (
    <motion.div
      whileHover={disabled ? {} : { y: -4, scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
      className={`
        relative overflow-hidden rounded-2xl p-6 bg-white border border-gray-100
        shadow-sm hover:shadow-xl transition-all duration-300
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={`p-3 rounded-xl ${colors.icon} shadow-lg flex-shrink-0`}>
            <Icon size={24} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
            {badge && (
              <Badge variant="info" size="sm">{badge}</Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
          )}
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`} />
    </motion.div>
  );
};

// ============================================================================
// PAGE HEADER COMPONENT
// ============================================================================

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate';
  actions?: React.ReactNode;
  breadcrumb?: Array<{ label: string; href?: string }>;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  color = 'blue',
  actions,
  breadcrumb,
}) => {
  const colors = statColors[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          {breadcrumb.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span>/</span>}
              {item.href ? (
                <a href={item.href} className="hover:text-gray-700 transition-colors">
                  {item.label}
                </a>
              ) : (
                <span className="text-gray-900 font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className={`p-3 rounded-2xl ${colors.icon} shadow-lg`}>
              <Icon size={28} />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </motion.div>
  );
};

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {Icon && (
        <div className="p-4 bg-gray-100 rounded-2xl mb-4">
          <Icon size={40} className="text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-500 max-w-sm mb-6">{description}</p>}
      {action}
    </motion.div>
  );
};

// ============================================================================
// LOADING SPINNER COMPONENT
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-blue-600',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`animate-spin ${sizes[size]} ${color}`} />
    </div>
  );
};

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
}

const avatarSizes: Record<string, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

const statusColors: Record<string, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-gray-400',
  away: 'bg-amber-500',
  busy: 'bg-red-500',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
}) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          className={`${avatarSizes[size]} rounded-full object-cover ring-2 ring-white`}
        />
      ) : (
        <div
          className={`
            ${avatarSizes[size]} rounded-full
            bg-gradient-to-br from-blue-500 to-purple-600
            flex items-center justify-center text-white font-semibold
            ring-2 ring-white
          `}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0 block rounded-full ring-2 ring-white
            ${statusColors[status]}
            ${size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'}
          `}
        />
      )}
    </div>
  );
};

// ============================================================================
// DIVIDER COMPONENT
// ============================================================================

interface DividerProps {
  label?: string;
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({ label, className = '' }) => {
  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
    );
  }

  return <div className={`h-px bg-gray-200 ${className}`} />;
};

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
}) => {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

// Re-export from other files
export { Table, TablePagination } from './Table';
export { Modal, ConfirmDialog, Drawer } from './Modal';
export { Tabs, TabPanel } from './Tabs';
export { Select, Dropdown } from './Select';

export default {
  Button,
  Card,
  StatCard,
  Badge,
  Input,
  ActionCard,
  PageHeader,
  EmptyState,
  LoadingSpinner,
  Avatar,
  Divider,
  Skeleton,
};
