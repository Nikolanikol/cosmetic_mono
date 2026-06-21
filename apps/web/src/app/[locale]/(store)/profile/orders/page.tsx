import { OrdersPage } from '@/views/profile/ui/OrdersPage';

export const metadata = {
  title: 'Мои заказы',
  robots: { index: false, follow: false },
};

export default function OrdersRoute() {
  return <OrdersPage />;
}
