'use client';

import { Check, CheckCheck, Loader2 } from 'lucide-react';

export type MessageStatus = 'sending' | 'sent' | 'read';

interface MessageStatusProps {
  status: MessageStatus;
  readAt?: Date | null;
}

export default function MessageStatus({ status, readAt }: MessageStatusProps) {
  if (status === 'sending') {
    return (
      <div className="flex items-center gap-1 text-[#a3a3a3]" title="发送中">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </div>
    );
  }

  if (status === 'sent' || status === 'read') {
    return (
      <div className="flex items-center gap-1 text-[#a3a3a3]" title={status === 'read' && readAt ? `已读 ${readAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : '已发送'}>
        {status === 'read' ? (
          <>
            <CheckCheck className="h-3.5 w-3.5 text-[#10b981]" />
            {readAt && (
              <span className="text-[10px]">
                {readAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </>
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
      </div>
    );
  }

  return null;
}
