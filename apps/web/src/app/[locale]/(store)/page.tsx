import type { Metadata } from 'next';
import { getSupabaseServiceClient } from '@/shared/api/supabaseServer';
import { getCategories, getFeaturedProducts } from '@packages/api/products';
import { HeroSection } from '@/views/home/ui/HeroSection';
import { CategoriesSection } from '@/views/home/ui/CategoriesSection';
import { FeaturedProductsSection } from '@/views/home/ui/FeaturedProductsSection';
import { QuizCTASection } from '@/views/home/ui/QuizCTASection';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://axis-beauty.com';

export const metadata: Metadata = {
  title: 'K&E Beauty — Korean & European Skincare',
  description:
    'Authentic Korean and European cosmetics with worldwide delivery. Premium skincare, sunscreens, serums, toners from top K-beauty brands like COSRX, SKIN1004, Torriden, TIRTIR.',
  openGraph: {
    title: 'K&E Beauty — Korean & European Skincare',
    description: 'Authentic Korean and European cosmetics with worldwide delivery.',
    url: `${APP_URL}/en`,
  },
  alternates: {
    canonical: `${APP_URL}/en`,
  },
};

export default async function Home() {
  const supabase = getSupabaseServiceClient();

  const [categoriesResult, productsResult] = await Promise.allSettled([
    getCategories(supabase),
    getFeaturedProducts(supabase, 8),
  ]);

  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
  const featuredProducts = productsResult.status === 'fulfilled' ? productsResult.value : [];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'K&E Beauty',
      url: APP_URL,
      description: 'Authentic Korean and European cosmetics with worldwide delivery.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'K&E Beauty',
      url: APP_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${APP_URL}/en/catalog?search={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];

  return (
    <div className="min-h-screen bg-brand-black-900">
      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}
      <HeroSection />
      <CategoriesSection categories={categories} />
      <FeaturedProductsSection products={featuredProducts} />
      <QuizCTASection />
    </div>
  );
}
