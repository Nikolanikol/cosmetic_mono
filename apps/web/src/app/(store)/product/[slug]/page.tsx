import { ProductDetailPage } from '@/views/product-detail/ui/ProductDetailPage';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  return <ProductDetailPage slug={slug} />;
}
