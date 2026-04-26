'use client';

import { SettingsProvider } from '@/lib/settings';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsProvider>{children}</SettingsProvider>;
}
