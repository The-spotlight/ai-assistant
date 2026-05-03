'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogCloseButton } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { getOrCreateDeviceId } from '@/lib/device';
import { MessageSquare, CheckCircle, Loader2 } from 'lucide-react';

const FEEDBACK_TYPES = [
  { value: 'bug', label: 'Bug 反馈' },
  { value: 'feature', label: '功能建议' },
  { value: 'experience', label: '体验问题' },
  { value: 'other', label: '其他' },
];

interface FeedbackFormModalProps {
  open: boolean;
  onClose: () => void;
}

export default function FeedbackFormModal({ open, onClose }: FeedbackFormModalProps) {
  const [feedbackType, setFeedbackType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [contactInfo, setContactInfo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = useCallback(async () => {
    if (!feedbackType || !description.trim()) {
      setError('请填写反馈类型和问题描述');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const deviceId = getOrCreateDeviceId();
      
      const response = await fetch('/api/user-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId,
        },
        credentials: 'include',
        body: JSON.stringify({
          feedbackType,
          description: description.trim(),
          contactInfo: contactInfo.trim() || undefined,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          handleResetAndClose();
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || '提交失败，请稍后重试');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [feedbackType, description, contactInfo]);

  const handleResetAndClose = useCallback(() => {
    setFeedbackType('');
    setDescription('');
    setContactInfo('');
    setIsSuccess(false);
    setError('');
    onClose();
  }, [onClose]);

  const isFormValid = feedbackType && description.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        handleResetAndClose();
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#171717]" />
            {isSuccess ? '感谢反馈' : '反馈与建议'}
          </DialogTitle>
          <DialogDescription>
            {isSuccess 
              ? '感谢您的反馈，我们会认真处理！' 
              : '您的反馈对我们很重要，请详细描述您遇到的问题或建议。'}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-sm text-[#525252]">页面即将自动关闭...</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1.5">
                  反馈类型 <span className="text-red-500">*</span>
                </label>
                <Select value={feedbackType} onValueChange={setFeedbackType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="请选择反馈类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEEDBACK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1.5">
                  问题描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请详细描述您遇到的问题或建议..."
                  className="w-full px-3 py-2 text-sm border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#171717]/20 resize-none bg-white"
                  rows={5}
                  maxLength={1000}
                />
                <p className="text-xs text-[#a3a3a3] mt-1 text-right">
                  {description.length}/1000
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1.5">
                  联系方式 <span className="text-[#a3a3a3]">（选填）</span>
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="邮箱或手机号，方便我们联系您"
                  className="w-full px-3 py-2 text-sm border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#171717]/20 bg-white"
                  maxLength={100}
                />
              </div>

              {error && (
                <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetAndClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  '提交反馈'
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        <DialogCloseButton />
      </DialogContent>
    </Dialog>
  );
}
