import type { Metadata } from 'next';
import { ProductDetailPage } from '@/views/product-detail/ui/ProductDetailPage';
import { getSupabaseServiceClient } from '@/shared/api/supabaseServer';
import { getProductBySlug } from '@packages/api/products';

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const supabase = getSupabaseServiceClient();
    const product = await getProductBySlug(supabase, slug);

    if (!product) {
      return { title: 'Product not found' };
    }

    const primaryImage =
      product.images.find((img) => img.is_primary) ?? product.images[0] ?? null;

    const title = `${product.name} ${product.brand.name} — Buy | K&E Beauty`;

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
        url: `/${locale}/product/${slug}`,
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
        canonical: `/${locale}/product/${slug}`,
        languages: { [locale]: `/${locale}/product/${slug}` },
      },
    };
  } catch {
    return { title: 'Товар | K&E Beauty' };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;

  let jsonLd: object | null = null;

  try {
    const supabase = getSupabaseServiceClient();
    const product = await getProductBySlug(supabase, slug);

    if (product) {
      const defaultVariant = product.variants[0] ?? null;
      const primaryImage =
        product.images.find((img) => img.is_primary) ?? product.images[0] ?? null;

      jsonLd = {
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
                url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/product/${slug}`,
              },
            }
          : {}),
      };
    }
  } catch {
    // JSON-LD is non-critical
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
