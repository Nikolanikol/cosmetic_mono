import { cn } from '@/shared/lib/cn';

interface ProductGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function ProductGrid({ children, columns = 4, className }: ProductGridProps) {
  const cols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', cols[columns], className)}>
      {children}
    </div>
  );
}
