/**
 * Filters Sidebar Component
 * Product filtering UI
 */

'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { formatPrice } from '@/shared/lib/formatPrice';
import { Button } from '@/shared/ui/Button';
import type { Category, Brand, ProductFilters, SkinType, OriginCountry } from '@packages/types';
import { COUNTRY_FLAGS, COUNTRY_NAMES_RU } from '@packages/types';

interface FiltersSidebarProps {
  filters: ProductFilters;
  categories: Category[];
  brands: Brand[];
  onFilterChange: (filters: ProductFilters) => void;
  onClearFilters: () => void;
}

const SKIN_TYPES: { value: SkinType; label: string }[] = [
  { value: 'dry', label: 'Сухая' },
  { value: 'oily', label: 'Жирная' },
  { value: 'combination', label: 'Комбинированная' },
  { value: 'sensitive', label: 'Чувствительная' },
  { value: 'normal', label: 'Нормальная' },
];

const PRICE_RANGES = [
  { min: 0, max: 1000, label: 'До 1 000 ₽' },
  { min: 1000, max: 3000, label: '1 000 – 3 000 ₽' },
  { min: 3000, max: 5000, label: '3 000 – 5 000 ₽' },
  { min: 5000, max: 10000, label: '5 000 – 10 000 ₽' },
  { min: 10000, max: Infinity, label: 'От 10 000 ₽' },
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

  // Get category tree
  const rootCategories = categories.filter((c) => !c.parent_id);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">Фильтры</h2>
        <button
          onClick={onClearFilters}
          className="text-sm text-brand-pink-500 hover:text-brand-pink-400"
        >
          Сбросить
        </button>
      </div>

      {/* Category Filter */}
      <FilterSection
        title="Категории"
        isExpanded={isExpanded('category')}
        onToggle={() => toggleSection('category')}
      >
        <div className="space-y-1">
          {rootCategories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              allCategories={categories}
              selectedSlug={filters.category}
              onSelect={(slug) =>
                onFilterChange({
                  ...filters,
                  category: filters.category === slug ? undefined : slug,
                })
              }
            />
          ))}
        </div>
      </FilterSection>

      {/* Brand Filter */}
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
                {COUNTRY_FLAGS[brand.origin_country]} {brand.name}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price Filter */}
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

        {/* Custom Price Range */}
        <div className="flex items-center gap-2 mt-4">
          <input
            type="number"
            placeholder="От"
            value={filters.price_min || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                price_min: e.target.value ? parseInt(e.target.value, 10) : undefined,
              })
            }
            className="w-20 px-2 py-1 text-sm bg-brand-black-800 border border-brand-black-600 rounded-[2px] text-white placeholder-brand-charcoal-500 focus:border-brand-pink-500 focus:outline-none"
          />
          <span className="text-brand-charcoal-500">–</span>
          <input
            type="number"
            placeholder="До"
            value={filters.price_max || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                price_max: e.target.value ? parseInt(e.target.value, 10) : undefined,
              })
            }
            className="w-20 px-2 py-1 text-sm bg-brand-black-800 border border-brand-black-600 rounded-[2px] text-white placeholder-brand-charcoal-500 focus:border-brand-pink-500 focus:outline-none"
          />
          <span className="text-brand-charcoal-500">₽</span>
        </div>
      </FilterSection>

      {/* Skin Type Filter */}
      <FilterSection
        title="Тип кожи"
        isExpanded={isExpanded('skin_type')}
        onToggle={() => toggleSection('skin_type')}
      >
        <div className="space-y-2">
          {SKIN_TYPES.map((type) => (
            <label
              key={type.value}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="skin_type"
                checked={filters.skin_type === type.value}
                onChange={() =>
                  onFilterChange({
                    ...filters,
                    skin_type:
                      filters.skin_type === type.value ? undefined : type.value,
                  })
                }
                className="w-4 h-4 border-brand-black-600 bg-brand-black-800 text-brand-pink-500 focus:ring-brand-pink-500"
              />
              <span className="text-sm text-brand-charcoal-300 group-hover:text-white transition-colors">
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Origin Country Filter */}
      <FilterSection
        title="Страна производства"
        isExpanded={isExpanded('origin')}
        onToggle={() => toggleSection('origin')}
      >
        <div className="space-y-2">
          {Array.from(new Set(brands.map((b) => b.origin_country))).map((country) => (
            <label
              key={country}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={filters.origin_country?.includes(country as OriginCountry) || false}
                onChange={(e) => {
                  const current = filters.origin_country || [];
                  const newCountries = e.target.checked
                    ? [...current, country as OriginCountry]
                    : current.filter((c) => c !== country);
                  onFilterChange({ ...filters, origin_country: newCountries });
                }}
                className="w-4 h-4 rounded border-brand-black-600 bg-brand-black-800 text-brand-pink-500 focus:ring-brand-pink-500"
              />
              <span className="text-sm text-brand-charcoal-300 group-hover:text-white transition-colors">
                {COUNTRY_FLAGS[country as OriginCountry]} {COUNTRY_NAMES_RU[country as OriginCountry]}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Sale Only Filter */}
      <div className="pt-4 border-t border-brand-black-600">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.sale_only || false}
            onChange={(e) =>
              onFilterChange({ ...filters, sale_only: e.target.checked })
            }
            className="w-4 h-4 rounded border-brand-black-600 bg-brand-black-800 text-brand-pink-500 focus:ring-brand-pink-500"
          />
          <span className="text-sm text-brand-charcoal-300 group-hover:text-white transition-colors">
            Только со скидкой
          </span>
        </label>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

interface FilterSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({ title, isExpanded, onToggle, children }: FilterSectionProps) {
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

interface CategoryItemProps {
  category: Category;
  allCategories: Category[];
  selectedSlug?: string;
  onSelect: (slug: string) => void;
  level?: number;
}

function CategoryItem({
  category,
  allCategories,
  selectedSlug,
  onSelect,
  level = 0,
}: CategoryItemProps) {
  const children = allCategories.filter((c) => c.parent_id === category.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedSlug === category.slug;
  const isActive = selectedSlug?.startsWith(category.slug);

  return (
    <div>
      <button
        onClick={() => onSelect(category.slug)}
        className={cn(
          'w-full text-left py-1.5 px-2 rounded-[2px] text-sm transition-colors',
          isSelected
            ? 'bg-brand-pink-500/20 text-brand-pink-500'
            : 'text-brand-charcoal-300 hover:text-white hover:bg-brand-black-700',
          level > 0 && 'ml-4'
        )}
        style={{ paddingLeft: `${8 + level * 16}px` }}
      >
        {category.name_ru}
      </button>
      {hasChildren && isActive && (
        <div className="mt-1">
          {children.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              allCategories={allCategories}
              selectedSlug={selectedSlug}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
