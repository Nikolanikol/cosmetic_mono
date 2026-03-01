/**
 * Product Badge Component
 * Shows product badges like "Хит", "Скидка", "K-beauty", "Новинка"
 */

import { cn } from "@/shared/lib/cn";

type BadgeType = "hit" | "sale" | "new" | "kbeauty";

interface ProductBadgeProps {
  type: BadgeType;
  children: React.ReactNode;
  className?: string;
}

const badgeStyles: Record<BadgeType, string> = {
  hit: "bg-brand-pink-500 text-white",
  sale: "bg-brand-rose-500 text-white",
  new: "bg-transparent border border-brand-pink-500 text-brand-pink-500",
  kbeauty: "bg-gradient-to-r from-brand-pink-500 to-brand-pink-400 text-white",
};

export function ProductBadge({
  type,
  children,
  className,
}: ProductBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium",
        "rounded-[2px]",
        badgeStyles[type],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Product Badges Container
 * Shows multiple badges for a product
 */
interface ProductBadgesProps {
  isHit?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  isKBeauty?: boolean;
  className?: string;
}

export function ProductBadges({
  isHit,
  isNew,
  isOnSale,
  isKBeauty,
  className,
}: ProductBadgesProps) {
  const badges: { type: BadgeType; show: boolean; content: React.ReactNode }[] =
    [
      { type: "sale", show: !!isOnSale, content: "Скидка" },
      { type: "new", show: !!isNew, content: "Новинка" },
      { type: "hit", show: !!isHit, content: "Хит" },
      { type: "kbeauty", show: !!isKBeauty, content: "K-Beauty" },
    ];

  const visibleBadges = badges.filter((b) => b.show);

  if (visibleBadges.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visibleBadges.map((badge, index) => (
        <ProductBadge key={index} type={badge.type}>
          {badge.content}
        </ProductBadge>
      ))}
    </div>
  );
}
