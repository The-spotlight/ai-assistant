'use client';

import { createContext, useContext } from 'react';
import { useMessageTranslator } from './MessageTranslator';

type TranslatorType = ReturnType<typeof useMessageTranslator>;

const MessageTranslateContext = createContext<TranslatorType | null>(null);

export function useMessageTranslateContext() {
  const context = useContext(MessageTranslateContext);
  if (!context) {
    throw new Error('useMessageTranslateContext must be used within MessageTranslateProvider');
  }
  return context;
}

type MessageTranslateProviderProps = {
  content: string;
  children: React.ReactNode;
  className?: string;
};

export default function MessageTranslateProvider({
  content,
  children,
  className,
}: MessageTranslateProviderProps) {
  const translator = useMessageTranslator(content);
  return (
    <MessageTranslateContext.Provider value={translator}>
      <div className={className}>
        {children}
      </div>
    </MessageTranslateContext.Provider>
  );
}
