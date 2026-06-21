export interface Brand {
  id: number;
  name: string;
  slug: string;
  origin_country: string;
  logo_url: string | null;
  description: string | null;
  is_featured: boolean;
  created_at: string;
}

export interface BrandWithProductCount extends Brand {
  product_count: number;
}
