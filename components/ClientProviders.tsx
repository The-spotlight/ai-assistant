'use client';

import { useEffect } from 'react';
import { SettingsProvider } from '@/lib/settings';
import { SpeechProvider } from '@/lib/speech';
import { ToastContainer, Slide } from 'react-toastify';
import { loadAndSchedulePendingMessages } from '@/lib/scheduled-messages';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    loadAndSchedulePendingMessages();
  }, []);

  return (
    <SettingsProvider>
      <SpeechProvider>
        {children}
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
      </SpeechProvider>
    </SettingsProvider>
  );
}