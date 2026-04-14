'use client';

import type { Message } from 'ai';
import { useCallback, useEffect, useState } from 'react';
import ChatSession from '@/components/ChatSession';
import { DEFAULT_OPENROUTER_MODEL_ID, FIXED_OPENROUTER_MODEL_LABEL } from '@/lib/openrouter-models';
import { CONVERSATION_STORAGE_KEY, getOrCreateDeviceId } from '@/lib/device';

type ConversationRow = {
  id: string;
  title: string | null;
  modelId: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChatPayload = {
  conversationId: string;
  messages: Message[];
};

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return '刚刚';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function IconPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconTrash(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function IconChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function Home() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [chatPayload, setChatPayload] = useState<ChatPayload | null>(null);
  const [convList, setConvList] = useState<ConversationRow[]>([]);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const loadConversations = useCallback(async (did: string) => {
    const r = await fetch('/api/conversations', { headers: { 'x-device-id': did } });
    if (!r.ok) return;
    const data = (await r.json()) as { conversations?: ConversationRow[] };
    setConvList(data.conversations ?? []);
  }, []);

  useEffect(() => {
    const did = getOrCreateDeviceId();
    if (!did) {
      setBootstrapError('无法读取本地设备标识');
      return;
    }
    setDeviceId(did);

    let cancelled = false;
    (async () => {
      try {
        let cid = localStorage.getItem(CONVERSATION_STORAGE_KEY);
        if (cid) {
          const check = await fetch(`/api/conversations/${cid}/messages`, {
            headers: { 'x-device-id': did },
          });
          if (check.ok) {
            const data = (await check.json()) as { messages?: Message[] };
            if (cancelled) return;
            setChatPayload({
              conversationId: cid,
              messages: data.messages ?? [],
            });
            await loadConversations(did);
            return;
          }
        }

        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-device-id': did },
          body: JSON.stringify({ deviceId: did }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? '创建会话失败');
        }
        const { id } = (await res.json()) as { id: string };
        if (cancelled) return;
        localStorage.setItem(CONVERSATION_STORAGE_KEY, id);
        setChatPayload({ conversationId: id, messages: [] });
        await loadConversations(did);
      } catch (e) {
        if (!cancelled) {
          setBootstrapError(e instanceof Error ? e.message : '初始化失败');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadConversations]);

  async function selectConversation(id: string) {
    if (!deviceId) return;
    setChatPayload(null);
    try {
      const r = await fetch(`/api/conversations/${id}/messages`, {
        headers: { 'x-device-id': deviceId },
      });
      if (!r.ok) return;
      const data = (await r.json()) as { messages?: Message[] };
      localStorage.setItem(CONVERSATION_STORAGE_KEY, id);
      setChatPayload({
        conversationId: id,
        messages: data.messages ?? [],
      });
    } catch {
      /* ignore */
    }
  }

  async function newChat() {
    if (!deviceId) return;
    setChatPayload(null);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
        body: JSON.stringify({ deviceId }),
      });
      if (!res.ok) return;
      const { id } = (await res.json()) as { id: string };
      localStorage.setItem(CONVERSATION_STORAGE_KEY, id);
      setChatPayload({ conversationId: id, messages: [] });
      await loadConversations(deviceId);
    } catch {
      /* ignore */
    }
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!deviceId) return;
    const r = await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers: { 'x-device-id': deviceId },
    });
    if (!r.ok) return;

    const listRes = await fetch('/api/conversations', {
      headers: { 'x-device-id': deviceId },
    });
    const data = (await listRes.json()) as { conversations?: ConversationRow[] };
    const list = data.conversations ?? [];
    setConvList(list);

    if (chatPayload?.conversationId !== id) return;

    if (list.length > 0) {
      await selectConversation(list[0].id);
    } else {
      setChatPayload(null);
      const cre = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
        body: JSON.stringify({ deviceId }),
      });
      if (!cre.ok) return;
      const { id: newId } = (await cre.json()) as { id: string };
      localStorage.setItem(CONVERSATION_STORAGE_KEY, newId);
      setChatPayload({ conversationId: newId, messages: [] });
      await loadConversations(deviceId);
    }
  }

  const loadingMain = deviceId && !chatPayload && !bootstrapError;

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden">
      <header className="z-30 shrink-0 border-b border-[rgba(0,0,0,0.08)] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#171717] text-[11px] font-medium text-white">
              AI
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-[#171717] sm:text-base" style={{ letterSpacing: '-0.32px' }}>
                智能助手
              </h1>
              <p className="hidden text-[11px] text-[#666666] sm:block">对话已同步到此浏览器</p>
            </div>
          </div>
          <p className="shrink-0 text-right text-[11px] text-[#666666] sm:text-xs" title="当前固定模型">
            {FIXED_OPENROUTER_MODEL_LABEL}
          </p>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col gap-0 overflow-hidden px-3 pb-4 pt-4 sm:flex-row sm:px-5 sm:pb-6 sm:pt-5">
        <aside className="mb-4 hidden min-h-0 w-[260px] shrink-0 flex-col self-stretch sm:mb-0 sm:mr-5 sm:flex">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <button
              type="button"
              onClick={() => newChat()}
              disabled={!deviceId || !!loadingMain}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#171717] px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-black disabled:opacity-40"
            >
              <IconPlus className="h-4 w-4" />
              新对话
            </button>
            <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-[#a3a3a3]">
              历史会话
            </p>
            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-0.5">
              {convList.length === 0 && !loadingMain && (
                <p className="px-2 py-6 text-center text-[13px] leading-relaxed text-[#a3a3a3]">暂无会话记录</p>
              )}
              {convList.map((c) => {
                const active = chatPayload?.conversationId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`group relative flex items-stretch gap-0 overflow-hidden rounded-xl border transition-colors ${
                      active
                        ? 'border-black/[0.08] bg-[#f4f4f5]'
                        : 'border-transparent hover:bg-[#fafafa]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => selectConversation(c.id)}
                      className="min-w-0 flex-1 px-3 py-2.5 text-left"
                      title={c.title ?? '新对话'}
                    >
                      <span className="line-clamp-2 text-[13px] font-medium leading-snug text-[#171717]">
                        {c.title?.trim() || '新对话'}
                      </span>
                      <span className="mt-1 block text-[11px] text-[#a3a3a3]">
                        {formatRelativeTime(c.updatedAt)}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label="删除会话"
                      onClick={(e) => deleteConversation(c.id, e)}
                      className="flex w-9 shrink-0 items-center justify-center text-[#a3a3a3] opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* 移动端：会话 + 新对话 */}
          {deviceId && convList.length > 0 && (
            <div className="mb-3 flex shrink-0 gap-2 sm:hidden">
              <label htmlFor="mobile-conv" className="sr-only">
                切换会话
              </label>
              <div className="relative min-w-0 flex-1">
                <select
                  id="mobile-conv"
                  value={chatPayload?.conversationId ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) void selectConversation(v);
                  }}
                  disabled={!!loadingMain}
                  className="w-full appearance-none rounded-xl border border-black/[0.08] bg-white py-2.5 pl-3 pr-10 text-[13px] font-medium text-[#171717] shadow-sm"
                >
                  {convList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title?.trim() || '新对话'}
                    </option>
                  ))}
                </select>
                <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737373]" />
              </div>
              <button
                type="button"
                onClick={() => newChat()}
                disabled={!deviceId || !!loadingMain}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#171717] shadow-sm transition hover:bg-[#fafafa] disabled:opacity-40"
                aria-label="新对话"
              >
                <IconPlus className="h-4 w-4" />
              </button>
            </div>
          )}

          {bootstrapError && (
            <div
              className="mb-4 flex shrink-0 items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                !
              </span>
              <span>{bootstrapError}</span>
            </div>
          )}

          {loadingMain && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-black/[0.06] bg-white px-6 py-16 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#171717]/70 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#171717]/50" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#171717]/30 [animation-delay:0.2s]" />
              </div>
              <p className="text-sm font-medium text-[#737373]">正在加载会话</p>
              <div className="h-2 w-40 max-w-full animate-pulse rounded-full bg-[#ebebeb]" />
            </div>
          )}

          {deviceId && chatPayload && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ChatSession
                key={chatPayload.conversationId}
                deviceId={deviceId}
                conversationId={chatPayload.conversationId}
                modelId={DEFAULT_OPENROUTER_MODEL_ID}
                initialMessages={chatPayload.messages}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
