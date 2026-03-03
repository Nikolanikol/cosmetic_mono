import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "K-Beauty & European Cosmetics | Premium Skincare Store",
  description:
    "Premium Korean and European cosmetics in Russia. Authentic K-beauty products and luxury European skincare brands.",
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
