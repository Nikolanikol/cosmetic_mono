import { AdminOrderDetailPage } from '@/views/admin/orders/ui/AdminOrderDetailPage';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderPage({ params }: Props) {
  const { id } = await params;
  return <AdminOrderDetailPage orderId={id} />;
}
