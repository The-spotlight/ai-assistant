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
      <body className="font-sans" style={{ backgroundColor: 'var(--theme-bg-secondary, #f6f6f7)', color: 'var(--theme-text-primary, #171717)' }}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
