import { SettingsPage } from '@/views/profile/ui/SettingsPage';

export const metadata = {
  title: 'Настройки',
  robots: { index: false, follow: false },
};

export default function SettingsRoute() {
  return <SettingsPage />;
}
