import { MetadataRoute } from 'next';
import { getSupabaseServiceClient } from '@/shared/api/supabaseServer';
import { getProducts, getCategories } from '@packages/api/products';
import { getBrands } from '@packages/api/brands';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const supabase = getSupabaseServiceClient();

  // Fetch all data in parallel
  const [productsResult, categories, brands] = await Promise.allSettled([
    getProducts(supabase, { limit: 5000 }),
    getCategories(supabase),
    getBrands(supabase),
  ]);

  const products =
    productsResult.status === 'fulfilled' ? productsResult.value.products : [];
  const cats =
    categories.status === 'fulfilled' ? categories.value : [];
  const brandList =
    brands.status === 'fulfilled' ? brands.value : [];

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/quiz`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Product pages
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: product.created_at ? new Date(product.created_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Category filter pages
  const categoryPages: MetadataRoute.Sitemap = cats.map((cat) => ({
    url: `${baseUrl}/catalog?category=${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Brand filter pages
  const brandPages: MetadataRoute.Sitemap = brandList.map((brand) => ({
    url: `${baseUrl}/catalog?brand=${brand.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...brandPages];
}
