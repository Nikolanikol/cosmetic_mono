/**
 * Ingredients List Component
 * Shows product ingredients with highlighting and tooltips
 */

'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import type { ProductIngredient } from '@packages/types';

interface IngredientsListProps {
  ingredients: ProductIngredient[];
  showHighlightedOnly?: boolean;
  maxDisplay?: number;
  className?: string;
}

export function IngredientsList({
  ingredients,
  showHighlightedOnly = false,
  maxDisplay = 5,
  className,
}: IngredientsListProps) {
  const [showAll, setShowAll] = useState(false);

  const displayIngredients = showHighlightedOnly
    ? ingredients.filter((i) => i.is_highlighted)
    : ingredients;

  const visibleIngredients = showAll
    ? displayIngredients
    : displayIngredients.slice(0, maxDisplay);

  const hasMore = displayIngredients.length > maxDisplay;

  if (displayIngredients.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {showHighlightedOnly && (
        <h4 className="text-sm font-medium text-white">Ключевые ингредиенты</h4>
      )}

      <div className="flex flex-wrap gap-1.5">
        {visibleIngredients.map((ingredient) => (
          <IngredientTag
            key={ingredient.id}
            ingredient={ingredient}
            isHighlighted={ingredient.is_highlighted}
          />
        ))}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-sm text-brand-pink-500 hover:text-brand-pink-400 transition-colors"
        >
          +{displayIngredients.length - maxDisplay} еще
        </button>
      )}

      {showAll && hasMore && (
        <button
          onClick={() => setShowAll(false)}
          className="text-sm text-brand-charcoal-500 hover:text-brand-charcoal-300 transition-colors"
        >
          Свернуть
        </button>
      )}
    </div>
  );
}

interface IngredientTagProps {
  ingredient: ProductIngredient;
  isHighlighted?: boolean;
}

function IngredientTag({ ingredient, isHighlighted }: IngredientTagProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        className={cn(
          'px-2 py-1 text-xs rounded-[2px] transition-colors',
          isHighlighted
            ? 'bg-brand-pink-500/20 text-brand-pink-500 border border-brand-pink-500/30'
            : 'bg-brand-black-700 text-brand-charcoal-300 border border-brand-black-600'
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        {ingredient.name_ru}
      </button>

      {/* Tooltip */}
      {showTooltip && ingredient.purpose_ru && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10">
          <div className="bg-brand-black-800 border border-brand-black-600 rounded-[2px] px-3 py-2 shadow-lg whitespace-nowrap">
            <p className="text-xs text-brand-charcoal-300">{ingredient.purpose_ru}</p>
            {ingredient.inci_name !== ingredient.name_ru && (
              <p className="text-xs text-brand-charcoal-500 mt-1">
                INCI: {ingredient.inci_name}
              </p>
            )}
            {ingredient.safety_rating && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-brand-charcoal-500">Безопасность:</span>
                <SafetyRating rating={ingredient.safety_rating} />
              </div>
            )}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-brand-black-800" />
          </div>
        </div>
      )}
    </div>
  );
}

function SafetyRating({ rating }: { rating: number }) {
  const getColor = (r: number) => {
    if (r <= 3) return 'text-green-500';
    if (r <= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <span className={cn('text-xs font-medium', getColor(rating))}>
      {rating}/10
    </span>
  );
}
