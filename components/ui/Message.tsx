'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle, Info, XCircle } from 'lucide-react';

export type MessageType = 'success' | 'error' | 'info' | 'warning';

export interface MessageItem {
  id: string;
  type: MessageType;
  message: string;
}

interface MessageContextType {
  messages: MessageItem[];
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  remove: (id: string) => void;
}

const MessageContext = React.createContext<MessageContextType | null>(null);

const icons = {
  success: Check,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]',
  error: 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]',
  info: 'bg-[#f0f9ff] border-[#bae6fd] text-[#0284c7]',
  warning: 'bg-[#fef3c7] border-[#fde68a] text-[#d97706]',
};

const iconStyles = {
  success: 'text-[#22c55e]',
  error: 'text-[#dc2626]',
  info: 'text-[#3b82f6]',
  warning: 'text-[#d97706]',
};

function MessageToast({ item, onClose }: { item: MessageItem; onClose: (id: string) => void }) {
  const Icon = icons[item.type];

  React.useEffect(() => {
    const timer = setTimeout(() => onClose(item.id), 3000);
    return () => clearTimeout(timer);
  }, [item.id, onClose]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 border rounded-lg px-4 py-3 shadow-lg transition-all',
        styles[item.type]
      )}
      style={{
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <Icon className={cn('h-5 w-5 shrink-0', iconStyles[item.type])} />
      <span className="text-sm font-medium">{item.message}</span>
      <button
        type="button"
        onClick={() => onClose(item.id)}
        className="ml-auto p-1 rounded hover:bg-black/[0.05] transition-colors"
        aria-label="关闭"
      >
        <X className="h-4 w-4 opacity-60" />
      </button>
    </div>
  );
}

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<MessageItem[]>([]);

  const addMessage = (type: MessageType, message: string) => {
    const id = `message_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setMessages((prev) => [...prev, { id, type, message }]);
  };

  const removeMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const success = (message: string) => addMessage('success', message);
  const error = (message: string) => addMessage('error', message);
  const info = (message: string) => addMessage('info', message);
  const warning = (message: string) => addMessage('warning', message);
  const remove = (id: string) => removeMessage(id);

  return (
    <MessageContext.Provider value={{ messages, success, error, info, warning, remove }}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2">
        {messages.map((item) => (
          <MessageToast key={item.id} item={item} onClose={remove} />
        ))}
      </div>
    </MessageContext.Provider>
  );
}

export function useMessage() {
  const context = React.useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
}