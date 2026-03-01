/**
 * Button Component
 * Primary, secondary, outline, and ghost variants
 */

import { forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/shared/lib/cn';

interface ButtonBaseProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

interface ButtonAsButtonProps extends ButtonBaseProps {
  href?: undefined;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
}

interface ButtonAsLinkProps extends ButtonBaseProps {
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  type?: undefined;
}

type ButtonProps = (ButtonAsButtonProps | ButtonAsLinkProps) &
  Omit<React.HTMLProps<HTMLButtonElement | HTMLAnchorElement>, 'size' | 'type'>;

const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      className,
      disabled,
      href,
      onClick,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center',
      'font-medium transition-all duration-200',
      'rounded-[2px]',
      'focus:outline-none focus:ring-2 focus:ring-brand-pink-500 focus:ring-offset-2 focus:ring-offset-brand-black-900',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      fullWidth && 'w-full'
    );

    const variantStyles = {
      primary: cn(
        'bg-brand-pink-500 text-white',
        'hover:bg-brand-pink-400',
        'active:bg-brand-pink-600'
      ),
      secondary: cn(
        'bg-brand-black-700 text-white',
        'hover:bg-brand-black-600',
        'active:bg-brand-black-800'
      ),
      outline: cn(
        'bg-transparent border border-brand-pink-500 text-brand-pink-500',
        'hover:bg-brand-pink-500/10',
        'active:bg-brand-pink-500/20'
      ),
      ghost: cn(
        'bg-transparent text-brand-charcoal-300',
        'hover:bg-brand-black-700 hover:text-white',
        'active:bg-brand-black-600'
      ),
      destructive: cn(
        'bg-transparent border border-brand-charcoal-500 text-brand-charcoal-300',
        'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500',
        'active:bg-red-500/20'
      ),
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const classes = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    const content = (
      <>
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          className={classes}
          onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
          ref={ref as React.Ref<HTMLAnchorElement>}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        type={type}
        className={classes}
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
        disabled={disabled || isLoading}
        ref={ref as React.Ref<HTMLButtonElement>}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
