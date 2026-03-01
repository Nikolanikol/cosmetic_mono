/**
 * Skeleton Component
 * Loading placeholder with shimmer animation
 */

import { cn } from '@/shared/lib/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circle' | 'text';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'default',
  width,
  height,
}: SkeletonProps) {
  const baseStyles = cn(
    'animate-pulse bg-brand-black-700',
    'relative overflow-hidden',
    variant === 'circle' && 'rounded-full',
    variant === 'text' && 'rounded',
    variant === 'default' && 'rounded-[2px]'
  );

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      className={cn(baseStyles, className)}
      style={style}
      aria-hidden="true"
    >
      {/* Shimmer effect */}
      <div
        className={cn(
          'absolute inset-0',
          'bg-gradient-to-r from-transparent via-brand-black-600 to-transparent',
          '-translate-x-full',
          'animate-[shimmer_2s_infinite]'
        )}
        style={{
          animation: 'shimmer 2s infinite',
        }}
      />
    </div>
  );
}

/**
 * Skeleton Text - Multiple lines
 */
interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lineClassName?: string;
}

export function SkeletonText({
  lines = 3,
  className,
  lineClassName,
}: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn('h-4', i === lines - 1 && 'w-3/4', lineClassName)}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton Card
 */
interface SkeletonCardProps {
  className?: string;
  hasImage?: boolean;
  lines?: number;
}

export function SkeletonCard({
  className,
  hasImage = true,
  lines = 3,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'bg-brand-black-700 border border-brand-black-600 rounded-[2px] p-4',
        className
      )}
    >
      {hasImage && (
        <Skeleton className="w-full aspect-video mb-4 rounded-[2px]" />
      )}
      <SkeletonText lines={lines} />
    </div>
  );
}
