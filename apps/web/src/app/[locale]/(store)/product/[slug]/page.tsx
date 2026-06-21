import { cache } from 'react';
import type { Metadata } from 'next';
import { ProductDetailPage } from '@/views/product-detail/ui/ProductDetailPage';
import { getSupabaseServiceClient } from '@/shared/api/supabaseServer';
import { getProductBySlug } from '@packages/api/products';

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const getCachedProduct = cache((slug: string) => {
  const supabase = getSupabaseServiceClient();
  return getProductBySlug(supabase, slug);
});

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const product = await getCachedProduct(slug);

    if (!product) {
      return { title: 'Product not found' };
    }

    const primaryImage =
      product.images.find((img) => img.is_primary) ?? product.images[0] ?? null;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://axis-beauty.com';
    const title = `${product.name} ${product.brand.name} — Buy | K&E Beauty`;
    const productUrl = `${baseUrl}/${locale}/product/${slug}`;

    const plainDescription = product.description
      ? product.description.replace(/<[^>]*>/g, '').slice(0, 157) + '...'
      : `Buy ${product.name} by ${product.brand.name}. Worldwide delivery. Authentic K&E Beauty products.`;

    return {
      title,
      description: plainDescription,
      openGraph: {
        title,
        description: plainDescription,
        type: 'website',
        url: productUrl,
        images: primaryImage
          ? [{ url: primaryImage.url, alt: primaryImage.alt ?? product.name }]
          : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: plainDescription,
        images: primaryImage ? [primaryImage.url] : [],
      },
      alternates: {
        canonical: productUrl,
        languages: { [locale]: productUrl },
      },
    };
  } catch {
    return { title: 'Товар | K&E Beauty' };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://axis-beauty.com';

  let product = null;
  try {
    product = await getCachedProduct(slug);
  } catch {
    // non-critical — client will refetch
  }

  const jsonLd: object[] = [];

  if (product) {
    const defaultVariant = product.variants[0] ?? null;
    const primaryImage =
      product.images.find((img) => img.is_primary) ?? product.images[0] ?? null;

    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      ...(product.description
        ? { description: product.description.replace(/<[^>]*>/g, '').slice(0, 300) }
        : {}),
      ...(primaryImage ? { image: [primaryImage.url] } : {}),
      brand: {
        '@type': 'Brand',
        name: product.brand.name,
      },
      category: product.category.name,
      ...(defaultVariant
        ? {
            offers: {
              '@type': 'Offer',
              priceCurrency: 'USD',
              price: defaultVariant.price,
              availability: defaultVariant.in_stock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
              seller: {
                '@type': 'Organization',
                name: 'K&E Beauty',
              },
              url: `${baseUrl}/${locale}/product/${slug}`,
            },
          }
        : {}),
    });

    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${baseUrl}/${locale}`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Catalog',
          item: `${baseUrl}/${locale}/catalog`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: product.category.name,
          item: `${baseUrl}/${locale}/catalog?category=${product.category.slug}`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: product.name,
        },
      ],
    });
  }

  return (
    <>
      {jsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}
      <ProductDetailPage slug={slug} product={product} locale={locale} />
    </>
  );
}
