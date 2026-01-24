import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from './ui/utils';

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 px-4 text-sm',
      md: 'h-10 px-6',
      lg: 'h-12 px-8',
    };

    const variantClasses = {
      primary: 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#5558E3] hover:to-[#7C4DE7] text-white',
      secondary: 'bg-secondary hover:bg-bg-hover text-foreground',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GradientButton.displayName = 'GradientButton';
