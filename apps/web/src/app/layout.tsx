import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'K&E Beauty — Корейская и европейская косметика',
    template: '%s | K&E Beauty',
  },
  description:
    'Оригинальная корейская и европейская косметика с доставкой по всему миру. Уходовая косметика, санскрины, сыворотки, тонеры лучших брендов.',
  keywords: ['корейская косметика', 'k-beauty', 'купить корейскую косметику', 'уход за кожей', 'косметика онлайн'],
  authors: [{ name: 'K&E Beauty' }],
  creator: 'K&E Beauty',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: APP_URL,
    siteName: 'K&E Beauty',
    title: 'K&E Beauty — Корейская и европейская косметика',
    description:
      'Оригинальная корейская и европейская косметика с доставкой по всему миру.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'K&E Beauty — Корейская и европейская косметика',
    description: 'Оригинальная корейская и европейская косметика с доставкой по всему миру.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-brand-black-900 text-white min-h-screen flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
