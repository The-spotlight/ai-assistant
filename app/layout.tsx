import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Assistant',
  description: 'AI Assistant via OpenRouter (Vercel AI SDK)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className="antialiased">
      <body className="min-h-screen bg-white font-sans text-[#171717]">{children}</body>
    </html>
  );
}
