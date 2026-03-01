import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-black-900 flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-brand-black-600 px-6 py-4">
        <Link href="/" className="text-xl font-bold text-gradient-pink">
          K&amp;E Beauty
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>
    </div>
  );
}
