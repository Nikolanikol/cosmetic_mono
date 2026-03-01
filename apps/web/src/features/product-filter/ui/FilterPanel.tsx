'use client';

import { X } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useFilters } from '@/features/product-filter/model/useFilters';

export function FilterPanel() {
  const { filters, resetFilters, activeCount } = useFilters();

  return (
    <div className="p-4 bg-brand-black-700 border border-brand-black-600 rounded-[2px]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-white">Фильтры</span>
        {activeCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-brand-charcoal-300 hover:text-brand-pink-500 transition-colors"
          >
            <X className="w-3 h-3" />
            Сбросить ({activeCount})
          </button>
        )}
      </div>
      <p className="text-brand-charcoal-500 text-sm">Фильтры загружаются...</p>
    </div>
  );
}
