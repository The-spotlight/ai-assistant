'use client';

import { SettingsProvider } from '@/lib/settings';
import { ToastContainer, Slide } from 'react-toastify';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
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
    </SettingsProvider>
  );
}