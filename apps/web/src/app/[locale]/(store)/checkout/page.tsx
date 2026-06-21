import type { Metadata } from 'next';
import { CheckoutPage } from '@/views/checkout/ui/CheckoutPage';

export const metadata: Metadata = {
  title: 'Оформление заказа',
  robots: { index: false, follow: false },
};

export default function Checkout() {
  return <CheckoutPage />;
}
