import type { Metadata } from 'next';
import { ProfilePage } from '@/views/profile/ui/ProfilePage';

export const metadata: Metadata = {
  title: 'Профиль',
  robots: { index: false, follow: false },
};

export default function Profile() {
  return <ProfilePage />;
}
