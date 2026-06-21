import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-14MJNKJ2LJ';
const YM_ID = process.env.NEXT_PUBLIC_YM_ID || '110036309';
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || 'xafn4xp5m7';

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
  verification: {
    yandex: 'f911b93e30ecfedf',
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
      <head>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}')`}
        </Script>
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}','ym');ym(${YM_ID},'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",accurateTrackBounce:true,trackLinks:true})`}
        </Script>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${CLARITY_ID}")`}
        </Script>
      </head>
      <body className="bg-brand-black-900 text-white min-h-screen flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
