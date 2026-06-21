import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'K&E Beauty — Korean & European Skincare',
    template: '%s | K&E Beauty',
  },
  description:
    'Authentic Korean and European cosmetics with worldwide delivery. Premium skincare, sunscreens, serums, toners from top K-beauty brands.',
  keywords: ['korean skincare', 'k-beauty', 'buy korean cosmetics', 'skincare', 'cosmetics online'],
  authors: [{ name: 'K&E Beauty' }],
  creator: 'K&E Beauty',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: 'K&E Beauty',
    title: 'K&E Beauty — Korean & European Skincare',
    description:
      'Authentic Korean and European cosmetics with worldwide delivery.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'K&E Beauty — Korean & European Skincare',
    description: 'Authentic Korean and European cosmetics with worldwide delivery.',
  },
  alternates: {
    canonical: APP_URL,
    languages: {
      en: `${APP_URL}/en`,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-brand-black-900 text-white min-h-screen flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
