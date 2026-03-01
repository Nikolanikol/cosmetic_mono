import Link from 'next/link';
import { cn } from '@/shared/lib/cn';

interface BrandBadgeProps {
  name: string;
  slug: string;
  flag?: string;
  className?: string;
}

export function BrandBadge({ name, slug, flag, className }: BrandBadgeProps) {
  return (
    <Link
      href={`/catalog?brand=${slug}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1',
        'text-xs text-brand-charcoal-300',
        'border border-brand-black-600 rounded-[2px]',
        'hover:border-brand-pink-500 hover:text-brand-pink-500',
        'transition-colors duration-200',
        className
      )}
    >
      {flag && <span>{flag}</span>}
      {name}
    </Link>
  );
}
