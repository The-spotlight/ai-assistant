'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { login, type AuthError } from '@/lib/auth';
import { Toast, ToastContainer } from '@/components/ui/Toast';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const result = await login(username, password);
    
    if (result.success) {
      addToast('登录成功', 'success');
      router.push('/');
    } else {
      const authError = result.error as AuthError;
      
      if (authError?.code === 'NETWORK_ERROR') {
        addToast('网络连接异常，请检查网络设置后重试', 'error');
      } else if (authError?.code === 'UNAUTHORIZED') {
        addToast('账号或密码错误，请重新输入', 'error');
      } else if (authError?.code === 'VALIDATION_ERROR') {
        addToast(authError.message || '输入格式有误，请检查', 'warning');
      } else {
        addToast(authError?.message || '登录失败，请稍后重试', 'error');
      }
      
      setError(authError?.message || '登录失败');
      setPassword('');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f6f7] p-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.06] p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#171717] text-white mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[#171717]">AI Assistant</h1>
            <p className="text-sm text-[#737373] mt-1">请登录以继续</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#171717] mb-2">账号</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入账号"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#171717] mb-2">密码</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-[#a3a3a3]">
              默认账号：admin | 默认密码：123456
            </p>
            <p className="text-xs text-[#a3a3a3] mt-1">
              首次登录前请先通过注册接口创建用户
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}