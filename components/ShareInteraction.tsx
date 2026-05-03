'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThumbsUp, ThumbsDown, Lightbulb, MessageCircle, Send, Check } from 'lucide-react';

interface ReactionStats {
  useful: number;
  notUseful: number;
  inspiring: number;
}

interface Comment {
  id: string;
  nickname: string;
  content: string;
  createdAt: string;
}

interface ShareInteractionProps {
  shareId: string;
}

interface ReactionButtonConfig {
  type: 'useful' | 'notUseful' | 'inspiring';
  icon: typeof ThumbsUp;
  activeIcon: typeof Check;
  label: string;
  color: string;
  bgColor: string;
  hoverBg: string;
}

function getVisitorId(shareId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`share_visitor_${shareId}`);
}

function setVisitorId(shareId: string, visitorId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`share_visitor_${shareId}`, visitorId);
}

function getVotedReactions(shareId: string): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(`share_voted_${shareId}`);
  return stored ? JSON.parse(stored) : [];
}

function addVotedReaction(shareId: string, reaction: string): void {
  if (typeof window === 'undefined') return;
  const current = getVotedReactions(shareId);
  if (!current.includes(reaction)) {
    localStorage.setItem(`share_voted_${shareId}`, JSON.stringify([...current, reaction]));
  }
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return '刚刚';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function ReactionButton({
  config,
  count,
  isVoted,
  isPending,
  onClick,
}: {
  config: ReactionButtonConfig;
  count: number;
  isVoted: boolean;
  isPending: boolean;
  onClick: () => void;
}) {
  const Icon = config.icon;
  const ActiveIcon = config.activeIcon;
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayCount, setDisplayCount] = useState(count);
  const prevCountRef = useRef(count);

  useEffect(() => {
    if (prevCountRef.current !== count) {
      setIsAnimating(true);
      setDisplayCount(count);
      prevCountRef.current = count;
      const timer = setTimeout(() => setIsAnimating(false), 400);
      return () => clearTimeout(timer);
    }
  }, [count]);

  const handleClick = () => {
    if (isVoted || isPending) return;
    onClick();
  };

  const isDisabled = isVoted || isPending;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`group relative inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-out ${
        isVoted
          ? `${config.color} ${config.bgColor} border-transparent shadow-sm`
          : `border-black/[0.08] bg-white text-[#525252] hover:border-current/20 ${config.hoverBg} ${
              isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`
      }`}
    >
      <span
        className={`relative inline-flex items-center justify-center transition-all duration-300 ${
          isAnimating && isVoted ? 'scale-125' : 'scale-100'
        }`}
      >
        {isVoted ? (
          <ActiveIcon
            className={`h-4 w-4 fill-current transition-all duration-300 ${
              isAnimating ? 'animate-bounce' : ''
            }`}
          />
        ) : (
          <Icon
            className={`h-4 w-4 transition-all duration-300 ${
              !isDisabled ? 'group-hover:scale-110' : ''
            }`}
          />
        )}
      </span>

      <span
        className={`transition-all duration-300 ${
          isVoted ? 'font-semibold' : ''
        }`}
      >
        {config.label}
      </span>

      <span
        className={`relative inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium transition-all duration-300 ${
          isVoted
            ? `${config.color} bg-current/10`
            : 'bg-black/[0.05] text-[#737373]'
        } ${isAnimating ? 'scale-110' : 'scale-100'}`}
      >
        <span
          className={`transition-all duration-300 ${
            isAnimating ? 'animate-pulse' : ''
          }`}
        >
          {displayCount}
        </span>
      </span>

      {isPending && (
        <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm">
          <span className="flex h-4 w-4 items-center justify-center">
            <span className="absolute h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-black/40" />
          </span>
        </span>
      )}

      {isVoted && (
        <span
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm"
          style={{ animation: 'checkMarkPop 0.4s ease-out' }}
        >
          <Check className="h-3 w-3 text-[#10b981]" />
        </span>
      )}
    </button>
  );
}

export default function ShareInteraction({ shareId }: ShareInteractionProps) {
  const [reactions, setReactions] = useState<ReactionStats>({
    useful: 0,
    notUseful: 0,
    inspiring: 0,
  });
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votedReactions, setVotedReactions] = useState<string[]>([]);

  const [nickname, setNickname] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const pendingReactionsRef = useRef<Set<string>>(new Set());
  const previousReactionsRef = useRef<ReactionStats>({
    useful: 0,
    notUseful: 0,
    inspiring: 0,
  });
  const previousVotedRef = useRef<string[]>([]);

  const showToast = useCallback((message: string, type: 'error' | 'success') => {
    if (type === 'error') {
      setError(message);
      setTimeout(() => setError(null), 3000);
    } else {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 3000);
    }
  }, []);

  useEffect(() => {
    const voted = getVotedReactions(shareId);
    setVotedReactions(voted);
    previousVotedRef.current = voted;
  }, [shareId]);

  const loadInteractions = useCallback(async () => {
    try {
      const response = await fetch(`/api/share/${shareId}/interactions`);
      if (response.ok) {
        const data = await response.json();
        setReactions(data.reactions);
        setComments(data.comments);
        previousReactionsRef.current = data.reactions;
      }
    } catch (err) {
      console.error('加载互动数据失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [shareId]);

  useEffect(() => {
    loadInteractions();
  }, [loadInteractions]);

  const handleReaction = useCallback(
    async (reactionType: 'useful' | 'notUseful' | 'inspiring') => {
      if (votedReactions.includes(reactionType)) {
        showToast('您已经投过票了', 'error');
        return;
      }

      if (pendingReactionsRef.current.has(reactionType)) {
        return;
      }

      pendingReactionsRef.current.add(reactionType);

      previousReactionsRef.current = { ...reactions };
      previousVotedRef.current = [...votedReactions];

      setReactions((prev) => ({
        ...prev,
        [reactionType]: prev[reactionType] + 1,
      }));
      setVotedReactions((prev) => [...prev, reactionType]);

      try {
        const visitorId = getVisitorId(shareId);
        const response = await fetch(`/api/share/${shareId}/reactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reaction: reactionType,
            visitorId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setReactions(data.reactions);
          previousReactionsRef.current = data.reactions;

          if (data.visitorId) {
            setVisitorId(shareId, data.visitorId);
          }

          addVotedReaction(shareId, reactionType);
          showToast('投票成功！', 'success');
        } else if (response.status === 409) {
          setReactions(previousReactionsRef.current);
          setVotedReactions(previousVotedRef.current);
          showToast('您已经投过票了', 'error');
        } else {
          const errData = await response.json().catch(() => ({}));
          setReactions(previousReactionsRef.current);
          setVotedReactions(previousVotedRef.current);
          showToast(errData.error || '投票失败，请稍后重试', 'error');
        }
      } catch (err) {
        console.error('提交反应失败:', err);
        setReactions(previousReactionsRef.current);
        setVotedReactions(previousVotedRef.current);
        showToast('投票失败，请稍后重试', 'error');
      } finally {
        pendingReactionsRef.current.delete(reactionType);
      }
    },
    [shareId, reactions, votedReactions, showToast]
  );

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      showToast('请输入昵称', 'error');
      return;
    }

    if (!commentContent.trim()) {
      showToast('请输入评论内容', 'error');
      return;
    }

    if (isSubmittingComment) {
      return;
    }

    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/share/${shareId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: nickname.trim(),
          content: commentContent.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
        setNickname('');
        setCommentContent('');
        setShowCommentForm(false);
        showToast('评论发表成功！', 'success');
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || '发表评论失败，请稍后重试', 'error');
      }
    } catch (err) {
      console.error('提交评论失败:', err);
      showToast('发表评论失败，请稍后重试', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const reactionConfigs: ReactionButtonConfig[] = [
    {
      type: 'useful',
      icon: ThumbsUp,
      activeIcon: Check,
      label: '有用',
      color: 'text-[#10b981]',
      bgColor: 'bg-[#10b981]/10',
      hoverBg: 'hover:bg-[#10b981]/5',
    },
    {
      type: 'notUseful',
      icon: ThumbsDown,
      activeIcon: Check,
      label: '无用',
      color: 'text-[#ef4444]',
      bgColor: 'bg-[#ef4444]/10',
      hoverBg: 'hover:bg-[#ef4444]/5',
    },
    {
      type: 'inspiring',
      icon: Lightbulb,
      activeIcon: Check,
      label: '有启发',
      color: 'text-[#f59e0b]',
      bgColor: 'bg-[#f59e0b]/10',
      hoverBg: 'hover:bg-[#f59e0b]/5',
    },
  ];

  return (
    <div className="mt-12 border-t border-black/[0.06] pt-8">
      <style jsx global>{`
        @keyframes checkMarkPop {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.3) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>

      {error && (
        <div
          className="mb-4 rounded-lg border border-[#dc2626]/20 bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626] transition-all duration-300"
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div
          className="mb-4 rounded-lg border border-[#16a34a]/20 bg-[#f0fdf4] px-4 py-3 text-sm text-[#16a34a] transition-all duration-300"
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 flex-shrink-0" />
            {success}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="mb-4 text-sm font-medium text-[#525252]">
          觉得这个分享怎么样？
        </h3>
        <div className="flex flex-wrap gap-2">
          {reactionConfigs.map((config) => {
            const count = reactions[config.type];
            const isVoted = votedReactions.includes(config.type);
            const isPending = pendingReactionsRef.current.has(config.type);

            return (
              <ReactionButton
                key={config.type}
                config={config}
                count={count}
                isVoted={isVoted}
                isPending={isPending}
                onClick={() => handleReaction(config.type)}
              />
            );
          })}
        </div>

        {votedReactions.length > 0 && (
          <p className="mt-3 text-xs text-[#a3a3a3]">
            感谢您的反馈！您已投票，无法再次投票。
          </p>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-medium text-[#525252]">
            <MessageCircle className="h-4 w-4" />
            评论 ({comments.length})
          </h3>
          {!showCommentForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCommentForm(true)}
              className="transition-all duration-200 hover:shadow-sm"
            >
              发表评论
            </Button>
          )}
        </div>

        {showCommentForm && (
          <form
            onSubmit={handleSubmitComment}
            className="mb-6 rounded-lg border border-black/[0.08] bg-white p-4 transition-all duration-300"
            style={{ animation: 'slideIn 0.3s ease-out' }}
          >
            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-medium text-[#525252]">
                昵称 <span className="text-[#ef4444]">*</span>
              </label>
              <Input
                type="text"
                placeholder="请输入昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={50}
                className="w-full transition-all duration-200"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-[#525252]">
                评论内容 <span className="text-[#ef4444]">*</span>
              </label>
              <textarea
                placeholder="分享你的想法..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                maxLength={1000}
                rows={3}
                className="flex h-20 w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm ring-offset-white transition-all placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#171717]/20 focus:border-[#171717]/20 disabled:cursor-not-allowed disabled:opacity-40 resize-none"
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-[#a3a3a3]">
                  支持换行，最多 1000 字
                </span>
                <span
                  className={`text-[10px] ${
                    commentContent.length > 900
                      ? 'text-[#ef4444]'
                      : 'text-[#a3a3a3]'
                  }`}
                >
                  {commentContent.length}/1000
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCommentForm(false);
                  setNickname('');
                  setCommentContent('');
                }}
              >
                取消
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingComment}
                className="flex items-center gap-1.5 transition-all duration-200"
              >
                {isSubmittingComment ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    发表中...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    发表评论
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {comments.length === 0 ? (
          <div className="py-8 text-center">
            <MessageCircle className="mx-auto mb-3 h-8 w-8 text-[#d4d4d4]" />
            <p className="text-sm text-[#a3a3a3]">
              暂无评论，来发表第一条评论吧～
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment, index) => (
              <div
                key={comment.id}
                className="rounded-lg border border-black/[0.06] bg-white/60 p-4 transition-all duration-300 hover:border-black/[0.08] hover:bg-white/80 hover:shadow-sm"
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#f4f4f5] to-[#e4e4e7] text-[10px] font-semibold text-[#525252]">
                      {comment.nickname.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[#171717]">
                      {comment.nickname}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#a3a3a3]">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-[#525252] whitespace-pre-wrap break-words leading-relaxed">
                  {comment.content}
                </p>
              </div>
            ))}
            {comments.length >= 50 && (
              <div className="text-center text-xs text-[#a3a3a3] py-2">
                最多显示 50 条最新评论
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
