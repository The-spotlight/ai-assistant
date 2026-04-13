'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ToolCallCard from '@/components/ToolCallCard';
import SkillPanel from '@/components/SkillPanel';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat',
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSkills, setShowSkills] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSkillInsert = (text: string) => {
    // Programmatically send the message
    append({ role: 'user', content: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '/' && input === '') {
      e.preventDefault();
      setShowSkills(true);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <span className="text-2xl">🤖</span>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AI 助手
        </h1>
        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">5 Skills</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-1">
        {messages.length === 0 && (
          <div className="text-center mt-20 space-y-4">
            <p className="text-gray-400 text-lg">发送消息开始对话</p>
            <p className="text-gray-300 text-sm">输入 <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">/</kbd> 查看可用技能</p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {[
                { emoji: '🔍', text: '搜索今日新闻' },
                { emoji: '💻', text: 'Python 计算质数' },
                { emoji: '🧮', text: '计算 pi 的100位' },
                { emoji: '📝', text: '分析一段话的情感' },
                { emoji: '🌐', text: '翻译成英文' },
              ].map((s) => (
                <button
                  key={s.text}
                  onClick={() => handleSkillInsert(s.text)}
                  className="flex items-center gap-1 text-sm text-gray-500 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 px-3 py-1.5 rounded-full transition-colors"
                >
                  <span>{s.emoji}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-50 text-gray-800 border border-gray-100'
              }`}
            >
              {/* Render tool calls */}
              {m.role === 'assistant' && (m as any).toolInvocations?.map((inv: any, i: number) => (
                <ToolCallCard
                  key={i}
                  toolName={inv.toolName}
                  args={inv.args || {}}
                  result={inv.result}
                />
              ))}

              {/* Render message content */}
              {m.content && m.role === 'user' ? (
                <span className="whitespace-pre-wrap">{m.content}</span>
              ) : m.content ? (
                <MarkdownRenderer content={m.content} />
              ) : null}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2 text-sm text-gray-400 flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              思考中...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="relative">
        <SkillPanel
          visible={showSkills}
          onClose={() => setShowSkills(false)}
          onInsertPrompt={handleSkillInsert}
        />

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (输入 / 查看技能)"
            disabled={isLoading}
            className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:bg-gray-50"
          />
          <button
            type="button"
            onClick={() => setShowSkills(!showSkills)}
            className="text-gray-400 hover:text-blue-500 px-2 transition-colors"
            title="查看可用技能"
          >
            🛠️
          </button>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-medium disabled:opacity-40 hover:bg-blue-600 transition-colors"
          >
            发送
          </button>
        </form>
      </div>
    </div>
  );
}
