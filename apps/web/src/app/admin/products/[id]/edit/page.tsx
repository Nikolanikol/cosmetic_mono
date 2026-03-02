import { AdminProductFormPage } from '@/views/admin/products/ui/AdminProductFormPage';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminProductEditPage({ params }: Props) {
  const { id } = await params;
  return <AdminProductFormPage mode="edit" productId={id} />;
}
