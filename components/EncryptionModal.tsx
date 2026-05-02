'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Lock, Unlock, Key, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Shield } from 'lucide-react';

type EncryptionModalMode = 'set-password' | 'verify-password' | 'remove-encryption';

interface EncryptionModalProps {
  isOpen: boolean;
  mode: EncryptionModalMode;
  conversationId: string;
  onClose: () => void;
  onSuccess: () => void;
  onSetPassword?: (password: string) => Promise<boolean>;
  onVerifyPassword?: (password: string) => Promise<boolean>;
  onRemoveEncryption?: (password: string) => Promise<boolean>;
  originalTitle?: string | null;
}

export default function EncryptionModal({
  isOpen,
  mode,
  conversationId,
  onClose,
  onSuccess,
  onSetPassword,
  onVerifyPassword,
  onRemoveEncryption,
  originalTitle,
}: EncryptionModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const resetState = useCallback(() => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClose]);

  const handleSetPassword = useCallback(async () => {
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    if (password.length < 4) {
      setError('密码长度至少为 4 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onSetPassword?.(password);
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1000);
      } else {
        setError('加密失败，请重试');
      }
    } catch {
      setError('加密过程中出错，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [password, confirmPassword, onSetPassword, onSuccess, handleClose]);

  const handleVerifyPassword = useCallback(async () => {
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onVerifyPassword?.(password);
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 500);
      } else {
        setError('密码错误，请重试');
      }
    } catch {
      setError('验证过程中出错，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [password, onVerifyPassword, onSuccess, handleClose]);

  const handleRemoveEncryption = useCallback(async () => {
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onRemoveEncryption?.(password);
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1000);
      } else {
        setError('密码错误或解密失败，请重试');
      }
    } catch {
      setError('解密过程中出错，请重试');
    } finally {
      setIsLoading(false);
    }
  }, [password, onRemoveEncryption, onSuccess, handleClose]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading) {
        if (mode === 'set-password') {
          void handleSetPassword();
        } else if (mode === 'verify-password') {
          void handleVerifyPassword();
        } else if (mode === 'remove-encryption') {
          void handleRemoveEncryption();
        }
      }
    },
    [mode, isLoading, handleSetPassword, handleVerifyPassword, handleRemoveEncryption]
  );

  const getModalTitle = () => {
    switch (mode) {
      case 'set-password':
        return '加密对话';
      case 'verify-password':
        return '验证密码';
      case 'remove-encryption':
        return '关闭加密';
    }
  };

  const getIcon = () => {
    switch (mode) {
      case 'set-password':
        return <Lock className="h-12 w-12 text-[#171717]" />;
      case 'verify-password':
        return <Key className="h-12 w-12 text-[#171717]" />;
      case 'remove-encryption':
        return <Unlock className="h-12 w-12 text-[#ef4444]" />;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackgroundClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {success ? (
            <>
              <div className="mb-4 flex justify-center">
                <CheckCircle className="h-12 w-12 text-[#22c55e]" />
              </div>
              <h3 className="mb-2 text-center text-lg font-semibold text-[#171717]">
                {mode === 'set-password'
                  ? '加密成功'
                  : mode === 'verify-password'
                    ? '验证成功'
                    : '已关闭加密'}
              </h3>
              <p className="text-center text-sm text-[#737373]">
                {mode === 'set-password'
                  ? '对话已成功加密'
                  : mode === 'verify-password'
                    ? '正在打开对话...'
                    : '对话已解除加密保护'}
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 flex justify-center">
                {getIcon()}
              </div>
              <h3 className="mb-2 text-center text-lg font-semibold text-[#171717]">
                {getModalTitle()}
              </h3>
              <p className="mb-6 text-center text-sm text-[#737373]">
                {mode === 'set-password' &&
                  '设置密码保护此对话。密码仅保存在本地，换设备后需要重新设置。'}
                {mode === 'verify-password' &&
                  '此对话已加密，请输入密码以查看内容。'}
                {mode === 'remove-encryption' &&
                  '确定要关闭此对话的加密保护吗？关闭后任何人都可以查看此对话。'}
              </p>

              {mode !== 'remove-encryption' || true}
              {true && (
                <>
                  <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-medium text-[#525252]">
                      密码
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={
                          mode === 'set-password' ? '请输入密码（至少 4 位）' : '请输入密码'
                        }
                        className="w-full rounded-lg border border-black/[0.08] bg-[#fafafa] px-3.5 py-2.5 pr-11 text-sm text-[#171717] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#171717]/20 focus:border-[#171717]/20"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3a3a3] hover:text-[#525252] transition-colors"
                        aria-label={showPassword ? '隐藏密码' : '显示密码'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {mode === 'set-password' && (
                    <div className="mb-4">
                      <label className="mb-1.5 block text-xs font-medium text-[#525252]">
                        确认密码
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="请再次输入密码"
                          className="w-full rounded-lg border border-black/[0.08] bg-[#fafafa] px-3.5 py-2.5 pr-11 text-sm text-[#171717] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#171717]/20 focus:border-[#171717]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3a3a3] hover:text-[#525252] transition-colors"
                          aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ef4444]" />
                  <p className="text-sm text-[#ef4444]">{error}</p>
                </div>
              )}

              {mode === 'set-password' && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]" />
                  <p className="text-xs text-[#92400e] leading-relaxed">
                    重要提示：密码仅保存在此设备的本地存储中，不会上传到服务器。
                    如果您清除浏览器数据或更换设备，将无法恢复加密的对话。
                    请务必牢记密码。
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-medium text-[#525252] hover:bg-[#fafafa] transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (mode === 'set-password') {
                      void handleSetPassword();
                    } else if (mode === 'verify-password') {
                      void handleVerifyPassword();
                    } else if (mode === 'remove-encryption') {
                      void handleRemoveEncryption();
                    }
                  }}
                  disabled={isLoading}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    mode === 'remove-encryption'
                      ? 'bg-[#ef4444] hover:bg-[#dc2626]'
                      : 'bg-[#171717] hover:bg-black'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      处理中...
                    </span>
                  ) : mode === 'set-password' ? (
                    '确认加密'
                  ) : mode === 'verify-password' ? (
                    '确认'
                  ) : (
                    '确认关闭'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
