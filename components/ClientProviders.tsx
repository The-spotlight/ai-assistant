'use client';

import { SettingsProvider } from '@/lib/settings';
import { SpeechProvider } from '@/lib/speech';
import { QuickNotesProvider } from '@/lib/quick-notes';
import { ToastContainer, Slide } from 'react-toastify';
import QuickNotes from '@/components/QuickNotes';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <SpeechProvider>
        <QuickNotesProvider>
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