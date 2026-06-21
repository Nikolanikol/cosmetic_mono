import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import type { Category } from '@packages/types';

interface CategoriesSectionProps {
  categories: Category[];
}

export function CategoriesSection({ categories }: CategoriesSectionProps) {
  const rootCategories = categories
    .filter((c) => !(c as { parent_id?: number }).parent_id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 6);

  const items = rootCategories.length > 0 ? rootCategories : FALLBACK_CATEGORIES;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-brand-pink-400 font-medium tracking-widest uppercase mb-1">
            Find what you need
          </p>
          <h2 className="text-2xl sm:text-3xl font-heading text-white">Categories</h2>
        </div>
        <Link
          href="/en/catalog"
          className="hidden sm:flex items-center gap-1.5 text-sm text-brand-charcoal-300 hover:text-brand-pink-400 transition-colors"
        >
          All products
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
        {items.map((cat) => {
          const slug = 'slug' in cat ? cat.slug : '';
          const name = 'name' in cat ? cat.name : (cat as { label: string }).label;
          return (
            <Link
              key={slug}
              href={`/en/catalog?category=${slug}`}
              className={cn(
                'group flex flex-col items-center justify-center gap-2',
                'h-24 px-3 rounded-[2px] border border-brand-black-600',
                'bg-brand-black-800 hover:bg-brand-black-700',
                'hover:border-brand-pink-500/40 transition-all duration-200',
                'text-center'
              )}
            >
              <span className="text-2xl">{getCategoryEmoji(slug)}</span>
              <span className="text-xs text-brand-charcoal-300 group-hover:text-white transition-colors leading-tight">
                {name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

const FALLBACK_CATEGORIES = [
  { slug: 'cleanser', label: 'Cleansers' },
  { slug: 'toner', label: 'Toners' },
  { slug: 'serum', label: 'Serums' },
  { slug: 'cream', label: 'Moisturizers' },
  { slug: 'mask-pad', label: 'Masks & Pads' },
  { slug: 'sunscreen', label: 'Sunscreen' },
];

function getCategoryEmoji(slug: string): string {
  const map: Record<string, string> = {
    'face-care': '✨', 'skin-care': '✨',
    cleansing: '🫧', cleanser: '🫧',
    toners: '💦', toner: '💦',
    serums: '💧', serum: '💧',
    moisturizers: '🧴', cream: '🧴',
    masks: '🩹', 'mask-pad': '🩹',
    'eye-care': '👁️',
    spf: '☀️', 'sun-care': '☀️', sunscreen: '☀️',
    'body-care': '🛁',
    makeup: '💄', cushion: '💄',
    'lip-care': '💋', lips: '💋',
    hair: '💆', haircare: '💆',
    blush: '🌸', highlighter: '✨',
    foundation: '🎨', concealer: '🎨',
    primer: '🪄', 'setting-spray': '💨',
  };
  return map[slug] ?? '🌿';
}
