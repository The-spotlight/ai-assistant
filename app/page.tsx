'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ToolCallCard from '@/components/ToolCallCard';
import SkillPanel from '@/components/SkillPanel';
import {
  DEFAULT_OPENROUTER_MODEL_ID,
  OPENROUTER_MODEL_OPTIONS,
  ALLOWED_OPENROUTER_MODEL_IDS,
  OPENROUTER_MODEL_STORAGE_KEY,
} from '@/lib/openrouter-models';

const SUGGESTIONS = [
  '搜索今日新闻',
  'Python 计算质数',
  '计算圆周率小数点后 10 位',
  '分析一段话的情感倾向',
  '翻译成英文',
] as const;

export default function Home() {
  const [modelId, setModelId] = useState(DEFAULT_OPENROUTER_MODEL_ID);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(OPENROUTER_MODEL_STORAGE_KEY);
      if (saved && ALLOWED_OPENROUTER_MODEL_IDS.has(saved)) {
        setModelId(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(OPENROUTER_MODEL_STORAGE_KEY, modelId);
    } catch {
      /* ignore */
    }
  }, [modelId]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat',
    body: { model: modelId },
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSkills, setShowSkills] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSkillInsert = (text: string) => {
    append({ role: 'user', content: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '/' && input === '') {
      e.preventDefault();
      setShowSkills(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* 顶栏：Vercel 风格极简导航 */}
      <header className="sticky top-0 z-20 border-b border-[rgba(0,0,0,0.08)] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#171717] text-[11px] font-medium text-white">
              AI
            </div>
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight text-[#171717]" style={{ letterSpacing: '-0.32px' }}>
                智能助手
              </h1>
              <p className="text-[11px] text-[#666666]">大模型对话 · 多技能协同</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <label htmlFor="openrouter-model" className="sr-only">
              选择模型
            </label>
            <select
              id="openrouter-model"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={isLoading}
              className="max-w-[min(52vw,220px)] cursor-pointer rounded-md border border-[rgba(0,0,0,0.12)] bg-white py-1.5 pl-2.5 pr-8 text-xs text-[#171717] shadow-sm focus:border-[#0072f5] focus:outline-none focus:ring-1 focus:ring-[#0072f5] disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-[260px] sm:text-sm"
            >
              {OPENROUTER_MODEL_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="hidden rounded-full border border-[rgba(0,0,0,0.08)] bg-[#fafafa] px-3 py-1 text-xs text-[#4d4d4d] lg:inline">
              5 项能力
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-6 pt-6 sm:px-6">
        <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-white" style={{ 
          boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, rgba(0,0,0,0.04) 0px 8px 8px -8px, #fafafa 0px 0px 0px 1px'
        }}>
          {/* 对话区 */}
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-8">
            {messages.length === 0 && (
              <div className="mx-auto max-w-xl pt-8 text-center sm:pt-14">
                <p className="text-2xl font-semibold tracking-tight text-[#171717] sm:text-3xl" style={{ letterSpacing: '-1.28px' }}>
                  你好，我是你的智能助手
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[#4d4d4d]">
                  支持联网搜索、计算、代码与文本分析。输入{' '}
                  <kbd className="rounded border border-[rgba(0,0,0,0.08)] bg-[#fafafa] px-1.5 py-0.5 font-mono text-xs text-[#171717]">
                    /
                  </kbd>{' '}
                  快速唤起技能面板
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-2.5">
                  {SUGGESTIONS.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => handleSkillInsert(text)}
                      className="rounded-full border border-[rgba(0,0,0,0.08)] bg-white px-4 py-2 text-sm text-[#4d4d4d] transition-colors hover:border-[#0072f5]/40 hover:bg-[#ebf5ff] hover:text-[#171717]"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[min(100%,36rem)] ${
                    m.role === 'user'
                      ? 'rounded-lg rounded-br-md bg-[#171717] px-4 py-3 text-[15px] leading-relaxed text-white'
                      : 'rounded-lg rounded-bl-md bg-white px-4 py-3 text-[15px] leading-relaxed text-[#171717]'
                  }`}
                  style={m.role === 'assistant' ? {
                    boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px'
                  } : undefined}
                >
                  {m.role === 'assistant' &&
                    (m as { toolInvocations?: unknown[] }).toolInvocations?.map((inv: any, i: number) => (
                      <ToolCallCard
                        key={i}
                        toolName={inv.toolName}
                        args={inv.args || {}}
                        result={inv.result}
                      />
                    ))}

                  {m.content &&
                    (m.role === 'user' ? (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    ) : (
                      <MarkdownRenderer content={m.content} />
                    ))}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 text-sm text-[#666666]" style={{
                  boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 2px, #fafafa 0px 0px 0px 1px'
                }}>
                  <span className="flex gap-1">
                    <span
                      className="h-2 w-2 rounded-full bg-[#171717]/70 animate-pulse"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-[#171717]/50 animate-pulse"
                      style={{ animationDelay: '160ms' }}
                    />
                    <span
                      className="h-2 w-2 rounded-full bg-[#171717]/30 animate-pulse"
                      style={{ animationDelay: '320ms' }}
                    />
                  </span>
                  正在生成…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 底栏输入：Vercel 风格 */}
          <div className="border-t border-[rgba(0,0,0,0.08)] bg-white p-4 sm:p-5">
            <div className="relative">
              <SkillPanel
                visible={showSkills}
                onClose={() => setShowSkills(false)}
                onInsertPrompt={handleSkillInsert}
              />

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3 rounded-lg bg-white p-2 sm:flex-row sm:items-center sm:gap-2 sm:p-2"
                style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px' }}
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="有问题，尽管问…"
                  disabled={isLoading}
                  className="min-h-[44px] flex-1 border-0 bg-transparent px-3 text-[15px] text-[#171717] placeholder:text-[#808080] focus:outline-none focus:ring-0 disabled:opacity-60"
                />
                <div className="flex items-center justify-end gap-1 sm:shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowSkills(!showSkills)}
                    className="rounded px-3 py-2 text-sm text-[#4d4d4d] transition-colors hover:bg-[#fafafa] hover:text-[#171717]"
                    title="技能"
                  >
                    技能
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="min-h-[40px] min-w-[88px] rounded-md bg-[#171717] px-5 text-sm font-medium text-white transition-colors hover:bg-[#000000] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    发送
                  </button>
                </div>
              </form>
              <p className="mt-2 text-center text-[11px] text-[#808080]">
                内容由 AI 生成，请核对重要信息
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}