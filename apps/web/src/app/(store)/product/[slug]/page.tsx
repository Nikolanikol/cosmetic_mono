import type { Metadata } from 'next';
import { ProductDetailPage } from '@/views/product-detail/ui/ProductDetailPage';
import { getSupabaseServiceClient } from '@/shared/api/supabaseServer';
import { getProductBySlug } from '@packages/api/products';
import { COUNTRY_NAMES_RU } from '@packages/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

// ── generateMetadata — server-side, gives Google proper meta tags ─────────────

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const supabase = getSupabaseServiceClient();
    const product = await getProductBySlug(supabase, slug);

    if (!product) {
      return { title: 'Товар не найден' };
    }

    const primaryImage =
      product.images.find((img) => img.is_primary) ?? product.images[0] ?? null;

    const title =
      product.meta_title_ru ||
      `${product.name_ru} ${product.brand.name} — купить | K&E Beauty`;

    const description =
      product.meta_description_ru ||
      (product.description_ru
        ? product.description_ru.slice(0, 157) + '...'
        : `Купить ${product.name_ru} от ${product.brand.name}. Доставка по всему миру. Оригинальная продукция K&E Beauty.`);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `/product/${slug}`,
        images: primaryImage
          ? [{ url: primaryImage.url, alt: primaryImage.alt_ru ?? product.name_ru }]
          : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: primaryImage ? [primaryImage.url] : [],
      },
      alternates: {
        canonical: `/product/${slug}`,
      },
    };
  } catch {
    return { title: 'Товар | K&E Beauty' };
  }
}

// ── Page — adds JSON-LD Schema.org, delegates UI to client component ──────────

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  // Server-side fetch for JSON-LD (Next.js deduplicates identical fetches)
  let jsonLd: object | null = null;

  try {
    const supabase = getSupabaseServiceClient();
    const product = await getProductBySlug(supabase, slug);

    if (product) {
      const defaultVariant = product.variants[0] ?? null;
      const inStock = (defaultVariant?.stock ?? 0) > 0;
      const primaryImage =
        product.images.find((img) => img.is_primary) ?? product.images[0] ?? null;

      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name_ru,
        ...(product.name_en ? { alternateName: product.name_en } : {}),
        ...(product.description_ru ? { description: product.description_ru } : {}),
        ...(primaryImage ? { image: [primaryImage.url] } : {}),
        brand: {
          '@type': 'Brand',
          name: product.brand.name,
          ...(product.brand.origin_country
            ? { countryOfOrigin: COUNTRY_NAMES_RU[product.brand.origin_country] }
            : {}),
        },
        category: product.category.name_ru,
        ...(defaultVariant
          ? {
              offers: {
                '@type': 'Offer',
                priceCurrency: 'RUB',
                price: defaultVariant.sale_price_rub ?? defaultVariant.price_rub,
                ...(defaultVariant.sale_price_rub
                  ? { highPrice: defaultVariant.price_rub }
                  : {}),
                availability: inStock
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
                seller: {
                  '@type': 'Organization',
                  name: 'K&E Beauty',
                },
                url: `${process.env.NEXT_PUBLIC_APP_URL}/product/${slug}`,
              },
            }
          : {}),
        ...(product.average_rating && product.average_rating > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: product.average_rating.toFixed(1),
                reviewCount: product.review_count ?? 1,
                bestRating: 5,
                worstRating: 1,
              },
            }
          : {}),
      };
    }
  } catch {
    // JSON-LD is non-critical — continue without it
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailPage slug={slug} />
    </>
  );
}
