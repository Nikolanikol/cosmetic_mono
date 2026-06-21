import { OrderDetailPage } from '@/views/profile/ui/OrderDetailPage';

export const metadata = {
  title: 'Заказ',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailRoute({ params }: Props) {
  const { id } = await params;
  return <OrderDetailPage orderId={id} />;
}
