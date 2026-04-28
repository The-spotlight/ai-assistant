'use client';

import { SettingsProvider } from '@/lib/settings';
import { MessageProvider } from '@/components/ui/Message';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <MessageProvider>{children}</MessageProvider>
    </SettingsProvider>
  );
}
