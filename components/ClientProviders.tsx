'use client';

import { SettingsProvider } from '@/lib/settings';
import { CommandPaletteProvider } from '@/lib/command-palette';
import { ToastContainer, Slide } from 'react-toastify';
import CommandPalette from '@/components/CommandPalette';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <CommandPaletteProvider>
        {children}
        <CommandPalette />
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable={false}
          pauseOnHover
          transition={Slide}
          icon={false}
        />
      </CommandPaletteProvider>
    </SettingsProvider>
  );
}