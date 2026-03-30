import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glass?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = true, glass = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-2xl border border-background-border p-6 transition-all';
    const hoverStyles = hover ? 'hover:border-primary hover:shadow-card hover:-translate-y-1 cursor-pointer' : '';
    const glassStyles = glass ? 'bg-background-surface/50 backdrop-blur-xl' : 'bg-background-surface';

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(baseStyles, glassStyles, hoverStyles, className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
