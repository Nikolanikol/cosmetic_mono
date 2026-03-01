'use client';

import { useState, useCallback } from 'react';

export interface Filters {
  category?: string;
  brand?: string[];
  price_min?: number;
  price_max?: number;
  skin_type?: string;
  rating?: number;
  sale_only?: boolean;
  search?: string;
}

export function useFilters(initialFilters: Filters = {}) {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const updateFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  const activeCount = Object.values(filters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== '';
  }).length;

  return { filters, updateFilter, resetFilters, activeCount };
}
