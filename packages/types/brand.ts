/**
 * Brand-related TypeScript types
 * Used by both Next.js web app and future React Native app
 */

export type OriginCountry = 'KR' | 'FR' | 'DE' | 'IT' | 'US' | 'JP' | 'CN' | 'GB' | 'ES' | 'SE';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  origin_country: OriginCountry;
  logo_url: string | null;
  description: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at?: string;
}

export interface BrandInsert {
  id?: string;
  name: string;
  slug: string;
  origin_country: OriginCountry;
  logo_url?: string | null;
  description?: string | null;
  is_featured?: boolean;
  created_at?: string;
}

export interface BrandUpdate {
  name?: string;
  slug?: string;
  origin_country?: OriginCountry;
  logo_url?: string | null;
  description?: string | null;
  is_featured?: boolean;
  updated_at?: string;
}

export interface BrandWithProductCount extends Brand {
  product_count: number;
}

export const COUNTRY_FLAGS: Record<OriginCountry, string> = {
  KR: '🇰🇷',
  FR: '🇫🇷',
  DE: '🇩🇪',
  IT: '🇮🇹',
  US: '🇺🇸',
  JP: '🇯🇵',
  CN: '🇨🇳',
  GB: '🇬🇧',
  ES: '🇪🇸',
  SE: '🇸🇪',
};

export const COUNTRY_NAMES_RU: Record<OriginCountry, string> = {
  KR: 'Южная Корея',
  FR: 'Франция',
  DE: 'Германия',
  IT: 'Италия',
  US: 'США',
  JP: 'Япония',
  CN: 'Китай',
  GB: 'Великобритания',
  ES: 'Испания',
  SE: 'Швеция',
};
