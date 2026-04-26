import type { Metadata } from 'next';
import './globals.css';
import ClientProviders from '@/components/ClientProviders';

export const metadata: Metadata = {
  title: 'AI Assistant',
  description: 'AI Assistant via OpenRouter (Vercel AI SDK)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className="antialiased">
      <body className="bg-[#f6f6f7] font-sans text-[#171717]">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
