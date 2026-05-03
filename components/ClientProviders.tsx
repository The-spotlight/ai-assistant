'use client';

import { useEffect } from 'react';
import { SettingsProvider } from '@/lib/settings';
import { SpeechProvider } from '@/lib/speech';
import { QuickNotesProvider } from '@/lib/quick-notes';
import { ToastContainer, Slide } from 'react-toastify';
import QuickNotes from '@/components/QuickNotes';
import { wrapConsoleError } from '@/lib/error-log';
import { getOrSetRuntimeStart } from '@/lib/runtime-info';

function ErrorLogInitializer() {
  useEffect(() => {
    wrapConsoleError();
    getOrSetRuntimeStart();
  }, []);

  return null;
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <SpeechProvider>
        <QuickNotesProvider>
          <ErrorLogInitializer />
          {children}
          <QuickNotes />
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
        </QuickNotesProvider>
      </SpeechProvider>
    </SettingsProvider>
  );
}