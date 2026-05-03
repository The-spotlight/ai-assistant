'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThumbsUp, ThumbsDown, Lightbulb, MessageCircle, Send } from 'lucide-react';

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

  useEffect(() => {
    const voted = getVotedReactions(shareId);
    setVotedReactions(voted);
  }, [shareId]);

  const loadInteractions = useCallback(async () => {
    try {
      const response = await fetch(`/api/share/${shareId}/interactions`);
      if (response.ok) {
        const data = await response.json();
        setReactions(data.reactions);
        setComments(data.comments);
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

  const handleReaction = async (reactionType: 'useful' | 'notUseful' | 'inspiring') => {
    if (votedReactions.includes(reactionType)) {
      setError('您已经投过票了');
      setTimeout(() => setError(null), 3000);
      return;
    }

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
        
        if (data.visitorId) {
          setVisitorId(shareId, data.visitorId);
        }
        
        addVotedReaction(shareId, reactionType);
        setVotedReactions((prev) => [...prev, reactionType]);
        
        setSuccess('投票成功！');
        setTimeout(() => setSuccess(null), 3000);
      } else if (response.status === 409) {
        setError('您已经投过票了');
        setTimeout(() => setError(null), 3000);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || '投票失败，请稍后重试');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('提交反应失败:', err);
      setError('投票失败，请稍后重试');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError('请输入昵称');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    if (!commentContent.trim()) {
      setError('请输入评论内容');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsSubmittingComment(true);
    setError(null);

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
        setSuccess('评论发表成功！');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || '发表评论失败，请稍后重试');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('提交评论失败:', err);
      setError('发表评论失败，请稍后重试');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const reactionButtons = [
    {
      type: 'useful' as const,
      icon: ThumbsUp,
      label: '有用',
      count: reactions.useful,
      color: 'text-[#10b981]',
      hoverColor: 'hover:text-[#10b981] hover:bg-[#10b981]/10',
    },
    {
      type: 'notUseful' as const,
      icon: ThumbsDown,
      label: '无用',
      count: reactions.notUseful,
      color: 'text-[#ef4444]',
      hoverColor: 'hover:text-[#ef4444] hover:bg-[#ef4444]/10',
    },
    {
      type: 'inspiring' as const,
      icon: Lightbulb,
      label: '有启发',
      count: reactions.inspiring,
      color: 'text-[#f59e0b]',
      hoverColor: 'hover:text-[#f59e0b] hover:bg-[#f59e0b]/10',
    },
  ];

  return (
    <div className="mt-12 border-t border-black/[0.06] pt-8">
      {error && (
        <div className="mb-4 rounded-lg bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 rounded-lg bg-[#f0fdf4] px-4 py-3 text-sm text-[#16a34a]">
          {success}
        </div>
      )}

      <div className="mb-8">
        <h3 className="mb-4 text-sm font-medium text-[#525252]">觉得这个分享怎么样？</h3>
        <div className="flex flex-wrap gap-2">
          {reactionButtons.map((btn) => {
            const Icon = btn.icon;
            const isVoted = votedReactions.includes(btn.type);
            
            return (
              <button
                key={btn.type}
                type="button"
                onClick={() => handleReaction(btn.type)}
                disabled={isVoted || isLoading}
                className={`inline-flex items-center gap-2 rounded-lg border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-medium transition-all ${
                  isVoted
                    ? `${btn.color} bg-current/10`
                    : `text-[#525252] ${btn.hoverColor} hover:border-current/20`
                } ${isVoted || isLoading ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
              >
                <Icon className={`h-4 w-4 ${isVoted ? 'fill-current' : ''}`} />
                <span>{btn.label}</span>
                <span className="ml-1 rounded-full bg-black/[0.05] px-2 py-0.5 text-xs font-medium text-[#737373]">
                  {btn.count}
                </span>
              </button>
            );
          })}
        </div>
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
            >
              发表评论
            </Button>
          )}
        </div>

        {showCommentForm && (
          <form onSubmit={handleSubmitComment} className="mb-6 rounded-lg border border-black/[0.08] bg-white p-4">
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
                className="w-full"
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
              <div className="mt-1 text-right text-[10px] text-[#a3a3a3]">
                {commentContent.length}/1000
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
                className="flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmittingComment ? '发表中...' : '发表评论'}
              </Button>
            </div>
          </form>
        )}

        {comments.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#a3a3a3]">
            暂无评论，来发表第一条评论吧～
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border border-black/[0.06] bg-white/60 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#171717]">
                    {comment.nickname}
                  </span>
                  <span className="text-[10px] text-[#a3a3a3]">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-[#525252] whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            ))}
            {comments.length >= 50 && (
              <div className="text-center text-xs text-[#a3a3a3] py-2">
                最多显示 50 条评论
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
