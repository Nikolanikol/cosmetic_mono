import { cn } from '@/shared/lib/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'pink' | 'outline' | 'muted';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-[2px]',
        {
          'bg-brand-black-600 text-brand-charcoal-300': variant === 'default',
          'bg-brand-pink-500 text-white': variant === 'pink',
          'border border-brand-pink-500 text-brand-pink-500': variant === 'outline',
          'bg-brand-black-700 text-brand-charcoal-500': variant === 'muted',
        },
        {
          'px-1.5 py-0.5 text-xs': size === 'sm',
          'px-2 py-1 text-sm': size === 'md',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
