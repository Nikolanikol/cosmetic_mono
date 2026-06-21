import { WishlistPage } from '@/views/profile/ui/WishlistPage';

export const metadata = {
  title: 'Избранное',
  robots: { index: false, follow: false },
};

export default function WishlistRoute() {
  return <WishlistPage />;
}
