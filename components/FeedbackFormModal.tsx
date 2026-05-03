'use client';

import { useState, useCallback } from 'react';
import { Modal, Select, Button, message } from 'antd';
import { getOrCreateDeviceId } from '@/lib/device';
import { Loader2 } from 'lucide-react';

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

  const handleReset = useCallback(() => {
    setFeedbackType('');
    setDescription('');
    setContactInfo('');
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!feedbackType || !description.trim()) {
      message.warning('请填写反馈类型和问题描述');
      return;
    }

    setIsSubmitting(true);

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
        message.success('感谢您的反馈，我们会认真处理！');
        handleClose();
      } else {
        const data = await response.json();
        message.error(data.error || '提交失败，请稍后重试');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      message.error('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [feedbackType, description, contactInfo, handleClose]);

  const isFormValid = feedbackType && description.trim().length > 0;

  return (
    <Modal
      title="反馈与建议"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={500}
      styles={{
        body: { padding: '24px' },
      }}
    >
      <p className="text-sm text-gray-500 mb-6">
        您的反馈对我们很重要，请详细描述您遇到的问题或建议。
      </p>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-700 font-medium">
            反馈类型 <span className="text-red-500">*</span>
          </label>
          <Select
            value={feedbackType || undefined}
            onChange={setFeedbackType}
            placeholder="请选择反馈类型"
            className="w-full"
            size="large"
          >
            {FEEDBACK_TYPES.map((type) => (
              <Select.Option key={type.value} value={type.value}>
                {type.label}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-700 font-medium">
            问题描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请详细描述您遇到的问题或建议..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-none bg-white"
            rows={5}
            maxLength={1000}
          />
          <p className="text-xs text-gray-400 text-right">
            {description.length}/1000
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-700 font-medium">
            联系方式 <span className="text-gray-400">（选填）</span>
          </label>
          <input
            type="text"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            placeholder="邮箱或手机号，方便我们联系您"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 bg-white"
            maxLength={100}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button
          size="large"
          onClick={handleClose}
          disabled={isSubmitting}
          className="flex-1 h-11"
        >
          取消
        </Button>
        <Button
          type="primary"
          size="large"
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="flex-1 h-11"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              提交中...
            </span>
          ) : (
            '提交反馈'
          )}
        </Button>
      </div>
    </Modal>
  );
}
