'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import type { Category, Brand, ProductFilters } from '@packages/types';

interface FiltersSidebarProps {
  filters: ProductFilters;
  categories: Category[];
  brands: Brand[];
  onFilterChange: (filters: ProductFilters) => void;
  onClearFilters: () => void;
}

const PRICE_RANGES = [
  { min: 0, max: 10, label: 'До $10' },
  { min: 10, max: 25, label: '$10 – $25' },
  { min: 25, max: 50, label: '$25 – $50' },
  { min: 50, max: Infinity, label: 'От $50' },
];

export function FiltersSidebar({
  filters,
  categories,
  brands,
  onFilterChange,
  onClearFilters,
}: FiltersSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'category',
    'brand',
    'price',
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const isExpanded = (section: string) => expandedSections.includes(section);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">Фильтры</h2>
        <button
          onClick={onClearFilters}
          className="text-sm text-brand-pink-500 hover:text-brand-pink-400"
        >
          Сбросить
        </button>
      </div>

      {/* Categories */}
      <FilterSection
        title="Категории"
        isExpanded={isExpanded('category')}
        onToggle={() => toggleSection('category')}
      >
        <div className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() =>
                onFilterChange({
                  ...filters,
                  category: filters.category === category.slug ? undefined : category.slug,
                })
              }
              className={cn(
                'w-full text-left py-1.5 px-2 rounded-[2px] text-sm transition-colors',
                filters.category === category.slug
                  ? 'bg-brand-pink-500/20 text-brand-pink-500'
                  : 'text-brand-charcoal-300 hover:text-white hover:bg-brand-black-700'
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Brands */}
      <FilterSection
        title="Бренды"
        isExpanded={isExpanded('brand')}
        onToggle={() => toggleSection('brand')}
      >
        <div className="space-y-2 max-h-64 overflow-auto">
          {brands.map((brand) => (
            <label
              key={brand.id}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.brand?.includes(brand.slug) || false}
                onChange={(e) => {
                  const currentBrands = filters.brand || [];
                  const newBrands = e.target.checked
                    ? [...currentBrands, brand.slug]
                    : currentBrands.filter((b) => b !== brand.slug);
                  onFilterChange({ ...filters, brand: newBrands });
                }}
                className="w-4 h-4 rounded border-brand-black-600 bg-brand-black-800 text-brand-pink-500 focus:ring-brand-pink-500"
              />
              <span className="text-sm text-brand-charcoal-300 group-hover:text-white transition-colors">
                {brand.name}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection
        title="Цена"
        isExpanded={isExpanded('price')}
        onToggle={() => toggleSection('price')}
      >
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => (
            <label
              key={`${range.min}-${range.max}`}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="price"
                checked={
                  filters.price_min === range.min &&
                  filters.price_max === (range.max === Infinity ? undefined : range.max)
                }
                onChange={() =>
                  onFilterChange({
                    ...filters,
                    price_min: range.min,
                    price_max: range.max === Infinity ? undefined : range.max,
                  })
                }
                className="w-4 h-4 border-brand-black-600 bg-brand-black-800 text-brand-pink-500 focus:ring-brand-pink-500"
              />
              <span className="text-sm text-brand-charcoal-300 group-hover:text-white transition-colors">
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

function FilterSection({
  title,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-brand-black-600 pb-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-2 text-left"
      >
        <span className="text-sm font-medium text-white">{title}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-brand-charcoal-500 transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>
      {isExpanded && <div className="mt-2">{children}</div>}
    </div>
  );
}
