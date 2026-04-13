import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Assistant',
  description: 'AI Assistant via OpenRouter (Vercel AI SDK)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" className="antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white font-sans text-[#171717]">
        <style>{`
          body {
            font-family: 'Geist', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            font-feature-settings: "liga" 1, "calt" 1;
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
