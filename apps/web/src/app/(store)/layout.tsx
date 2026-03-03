import { Header } from '@/widgets/header';
import { Footer } from '@/widgets/footer';
import { ChatAssistant } from '@/widgets/chat-assistant';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatAssistant />
    </div>
  );
}
