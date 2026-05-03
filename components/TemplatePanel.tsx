'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { getOrCreateDeviceId } from '@/lib/device';
import {
  getWithRetry,
  postJsonWithRetry,
  type FetchResponse,
} from '@/lib/fetch-wrapper';

export type TemplateItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  importedFromMarketTemplateId?: string;
};

export type MarketTemplateItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  isOfficial: boolean;
  isActive: boolean;
  usageCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type MarketCategoryInfo = {
  category: string;
  count: number;
};

type TabType = 'my' | 'market';

const CATEGORIES = ['工作', '学习', '生活', '其他'];
const ALL_CATEGORIES = ['全部', ...CATEGORIES];

function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconTemplate(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function IconPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconEdit(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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

function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconStar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconRefresh(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function IconAlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export interface TemplatePanelProps {
  visible: boolean;
  onClose: () => void;
  templates: TemplateItem[];
  onTemplateClick: (content: string) => void;
  onAddTemplate: (template: { title: string; content: string; category: string }) => Promise<void>;
  onUpdateTemplate: (id: string, template: { title?: string; content?: string; category?: string }) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
  onRefreshTemplates: () => void;
}

type FormModalMode = 'create' | 'edit' | 'save-as';

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  initialValues?: {
    title: string;
    content: string;
    category?: string;
    id?: string;
  } | null;
  mode?: FormModalMode;
  onSubmit: (data: { title: string; content: string; category: string }) => Promise<void>;
}

export function FormModal({ visible, onClose, initialValues, mode, onSubmit }: FormModalProps) {
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('其他');
  const [saving, setSaving] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const effectiveMode: FormModalMode = useMemo(() => {
    if (mode) return mode;
    if (initialValues?.id) return 'edit';
    if (initialValues) return 'save-as';
    return 'create';
  }, [mode, initialValues]);

  const getModalTitle = () => {
    switch (effectiveMode) {
      case 'edit': return '编辑模板';
      case 'save-as': return '另存为模板';
      default: return '新建模板';
    }
  };

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        setFormTitle(initialValues.title);
        setFormContent(initialValues.content);
        setFormCategory(initialValues.category || '其他');
      } else {
        setFormTitle('');
        setFormContent('');
        setFormCategory('其他');
      }
    }
  }, [visible, initialValues]);

  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);

  const handleSubmit = useCallback(async () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    setSaving(true);
    try {
      await onSubmit({
        title: formTitle.trim(),
        content: formContent.trim(),
        category: formCategory,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }, [formTitle, formContent, formCategory, onSubmit, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div
        ref={modalRef}
        className="mx-4 w-full max-w-md flex flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.04)]"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        <style>{`
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>

        <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.06] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <IconEdit className="h-4 w-4 text-[#171717]" />
            <span className="text-sm font-medium text-[#171717]">
              {getModalTitle()}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737373] hover:text-[#404040] transition-colors"
            aria-label="关闭"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-[#525252] mb-1.5">
                标题
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="例如：帮我写个简历"
                className="w-full rounded-lg border border-black/[0.08] bg-[#fafafa] px-3.5 py-2.5 text-sm text-[#171717] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#171717]/20 focus:border-[#171717]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#525252] mb-1.5">
                分类
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formCategory === cat
                        ? 'bg-[#171717] text-white shadow-sm'
                        : 'bg-[#fafafa] text-[#525252] hover:bg-[#f5f5f5] border border-black/[0.06]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#525252] mb-1.5">
                内容
              </label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="输入模板内容，例如：请帮我写一份简历，要求突出工作经验..."
                rows={5}
                className="w-full resize-none rounded-lg border border-black/[0.08] bg-[#fafafa] px-3.5 py-2.5 text-sm text-[#171717] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#171717]/20 focus:border-[#171717]/20 leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-3 flex items-center justify-end gap-2 border-t border-black/[0.06] bg-[#fafafa]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#525252] hover:bg-[#e5e5e5] transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!formTitle.trim() || !formContent.trim() || saving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#171717] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplatePanel({
  visible,
  onClose,
  templates,
  onTemplateClick,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onRefreshTemplates,
}: TemplatePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [activeFilter, setActiveFilter] = useState<string>('全部');
  const [marketActiveFilter, setMarketActiveFilter] = useState<string>('全部');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [copyingTemplateId, setCopyingTemplateId] = useState<string | null>(null);

  const [marketTemplates, setMarketTemplates] = useState<MarketTemplateItem[]>([]);
  const [marketCategories, setMarketCategories] = useState<MarketCategoryInfo[]>([]);
  const [marketLoading, setMarketLoading] = useState<boolean>(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');

  const loadMarketTemplates = useCallback(async (did: string, category?: string) => {
    setMarketLoading(true);
    setMarketError(null);

    try {
      const url = category && category !== '全部'
        ? `/api/market-templates?category=${encodeURIComponent(category)}&includeCategories=true`
        : '/api/market-templates?includeCategories=true';

      const result = await getWithRetry<{
        templates: MarketTemplateItem[];
        categories: MarketCategoryInfo[];
      }>(url, {
        headers: {
          'x-device-id': did,
        },
      });

      if (result.success && result.data) {
        setMarketTemplates(result.data.templates || []);
        setMarketCategories(result.data.categories || []);
      } else {
        setMarketError(result.error || '加载市场模板失败');
      }
    } catch (error) {
      console.error('[TemplatePanel] 加载市场模板失败:', error);
      setMarketError(error instanceof Error ? error.message : '加载市场模板失败');
    } finally {
      setMarketLoading(false);
    }
  }, []);

  const handleUseMarketTemplate = useCallback(
    async (template: MarketTemplateItem) => {
      setCopyingTemplateId(template.id);
      try {
        const result = await postJsonWithRetry<{
          success: boolean;
          userTemplateId: string;
          isFirstUse: boolean;
        }>(`/api/market-templates/${template.id}/use`, {}, {
          headers: {
            'x-device-id': deviceId,
          },
        });

        if (result.success) {
          onRefreshTemplates();
          setActiveTab('my');
          setExpandedTemplateId(null);
        } else {
          console.error('[TemplatePanel] 使用市场模板失败:', result.error);
          alert(result.error || '使用模板失败，请稍后重试');
        }
      } catch (error) {
        console.error('[TemplatePanel] 使用市场模板异常:', error);
        alert('使用模板失败，请稍后重试');
      } finally {
        setCopyingTemplateId(null);
      }
    },
    [deviceId, onRefreshTemplates]
  );

  useEffect(() => {
    const did = getOrCreateDeviceId();
    setDeviceId(did);
  }, []);

  useEffect(() => {
    if (!visible || !deviceId) return;

    if (activeTab === 'market' && marketTemplates.length === 0 && !marketLoading) {
      loadMarketTemplates(deviceId);
    }
  }, [visible, activeTab, deviceId, marketTemplates.length, marketLoading, loadMarketTemplates]);

  useEffect(() => {
    if (!visible || !deviceId || activeTab !== 'market') return;

    loadMarketTemplates(deviceId, marketActiveFilter);
  }, [marketActiveFilter, visible, deviceId, activeTab, loadMarketTemplates]);

  const filteredTemplates = useMemo(() => {
    const sorted = [...templates].sort((a, b) => a.orderIndex - b.orderIndex);
    if (activeFilter === '全部') {
      return sorted;
    }
    return sorted.filter((t) => t.category === activeFilter);
  }, [templates, activeFilter]);

  const getMarketCategoryCount = (category: string): number => {
    const found = marketCategories.find((c) => c.category === category);
    if (found) return found.count;

    if (category === '全部') {
      return marketCategories.reduce((sum, c) => sum + c.count, 0);
    }

    return 0;
  };

  const formatUsageCount = (count: number): string => {
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + 'w';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  const openEditForm = useCallback((template: TemplateItem) => {
    setEditingTemplate(template);
    setShowFormModal(true);
  }, []);

  const openAddForm = useCallback(() => {
    setEditingTemplate(null);
    setShowFormModal(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setShowFormModal(false);
    setEditingTemplate(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: { title: string; content: string; category: string }) => {
      if (editingTemplate) {
        await onUpdateTemplate(editingTemplate.id, data);
      } else {
        await onAddTemplate(data);
      }
    },
    [editingTemplate, onAddTemplate, onUpdateTemplate]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm('确定要删除这个模板吗？')) {
        await onDeleteTemplate(id);
      }
    },
    [onDeleteTemplate]
  );

  const toggleTemplateExpand = useCallback((templateId: string) => {
    setExpandedTemplateId((prev) => (prev === templateId ? null : templateId));
  }, []);

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case '工作':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case '学习':
        return 'bg-green-50 text-green-700 border-green-100';
      case '生活':
        return 'bg-orange-50 text-orange-700 border-orange-100';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  useEffect(() => {
    if (!visible) {
      setShowFormModal(false);
      setEditingTemplate(null);
      setActiveFilter('全部');
      setMarketActiveFilter('全部');
      setExpandedTemplateId(null);
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        ref={panelRef}
        className="mx-4 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        <style>{`
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes slideDown {
            from {
              opacity: 0;
              max-height: 0;
            }
            to {
              opacity: 1;
              max-height: 500px;
            }
          }
          @keyframes slideUp {
            from {
              opacity: 1;
              max-height: 500px;
            }
            to {
              opacity: 0;
              max-height: 0;
            }
          }
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          .template-detail-enter {
            animation: slideDown 0.25s ease-out forwards;
          }
          .template-detail-exit {
            animation: slideUp 0.2s ease-in forwards;
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>

        <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.06] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <IconTemplate className="h-4 w-4 text-[#171717]" />
            <span className="text-sm font-medium text-[#171717]">
              {activeTab === 'my' ? '我的模板' : '模板市场'}
            </span>
            <span className="rounded-full px-2 py-0.5 text-xs bg-[#e5e5e5] text-[#525252]">
              {activeTab === 'my' ? templates.length : marketTemplates.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {activeTab === 'my' && (
              <button
                type="button"
                onClick={openAddForm}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-[#171717] hover:bg-black transition-colors shadow-sm"
              >
                <IconPlus className="h-4 w-4" />
                新建模板
              </button>
            )}
            {activeTab === 'market' && (
              <button
                type="button"
                onClick={() => deviceId && loadMarketTemplates(deviceId, marketActiveFilter)}
                disabled={marketLoading}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[#525252] bg-[#fafafa] hover:bg-[#f5f5f5] border border-black/[0.06] transition-colors disabled:opacity-50"
                aria-label="刷新"
              >
                <IconRefresh className={`h-4 w-4 ${marketLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-[#737373] hover:text-[#404040] transition-colors ml-1"
              aria-label="关闭"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-black/[0.06] bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('my')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === 'my'
                ? 'text-[#171717] border-b-2 border-[#171717] bg-white'
                : 'text-[#737373] hover:text-[#404040] border-b-2 border-transparent bg-[#fafafa]'
            }`}
          >
            我的模板
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('market')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'market'
                ? 'text-[#171717] border-b-2 border-[#171717] bg-white'
                : 'text-[#737373] hover:text-[#404040] border-b-2 border-transparent bg-[#fafafa]'
            }`}
          >
            <IconStar className="h-4 w-4" />
            模板市场
          </button>
        </div>

        {activeTab === 'my' && (
          <>
            <div className="px-4 py-3 border-b border-black/[0.04] bg-white">
              <div className="flex flex-wrap gap-1.5">
                {ALL_CATEGORIES.map((cat) => {
                  const count = cat === '全部'
                    ? templates.length
                    : templates.filter((t) => t.category === cat).length;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveFilter(cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activeFilter === cat
                          ? 'bg-[#171717] text-white shadow-sm'
                          : 'bg-[#fafafa] text-[#525252] hover:bg-[#f5f5f5] border border-black/[0.06]'
                      }`}
                    >
                      {cat}
                      <span className={`text-xs ${
                        activeFilter === cat ? 'text-white/70' : 'text-[#a3a3a3]'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <IconTemplate className="h-14 w-14 text-[#d4d4d4] mb-3" />
                  <p className="text-sm font-medium text-[#737373] mb-1">暂无模板</p>
                  <p className="text-xs text-[#a3a3a3] mb-5 text-center leading-relaxed">
                    {activeFilter === '全部'
                      ? '可以点击下方"创建模板"按钮新建\n或从模板市场一键导入优质模板'
                      : `"${activeFilter}"分类下暂无模板，切换其他分类或新建模板`}
                  </p>
                  {activeFilter === '全部' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={openAddForm}
                        className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-[#171717] hover:bg-black transition-colors shadow-sm"
                      >
                        <IconPlus className="h-4 w-4" />
                        创建模板
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('market')}
                        className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-[#171717] bg-[#fafafa] hover:bg-[#f5f5f5] border border-black/[0.08] transition-colors"
                      >
                        <IconStar className="h-4 w-4" />
                        去市场
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="group flex items-stretch gap-0 overflow-hidden rounded-xl border border-black/[0.06] bg-white transition-all hover:border-black/[0.12] hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onTemplateClick(template.content);
                          onClose();
                        }}
                        className="min-w-0 flex-1 flex flex-col items-start gap-2 rounded-l-xl px-4 py-3 text-left transition-colors hover:bg-[#fafafa]"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-sm font-semibold text-[#171717] truncate">
                            {template.title}
                          </span>
                          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-md border ${getCategoryColor(template.category)}`}>
                            {template.category}
                          </span>
                          {template.importedFromMarketTemplateId && (
                            <span className="shrink-0 text-xs text-[#a3a3a3]">
                              来自市场
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#525252] leading-relaxed line-clamp-2">
                          {template.content}
                        </p>
                      </button>
                      <div className="flex items-center gap-0.5 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => openEditForm(template)}
                          className="flex w-9 h-9 items-center justify-center text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717] rounded-lg transition-colors"
                          title="编辑模板"
                          aria-label="编辑"
                        >
                          <IconEdit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(template.id)}
                          className="flex w-9 h-9 items-center justify-center text-[#737373] hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          title="删除模板"
                          aria-label="删除"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'market' && (
          <>
            <div className="px-4 py-3 border-b border-black/[0.04] bg-white">
              <div className="flex flex-wrap gap-1.5">
                {marketCategories.length > 0
                  ? marketCategories.map((item) => {
                      const count = getMarketCategoryCount(item.category);

                      return (
                        <button
                          key={item.category}
                          type="button"
                          onClick={() => setMarketActiveFilter(item.category)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            marketActiveFilter === item.category
                              ? 'bg-[#171717] text-white shadow-sm'
                              : 'bg-[#fafafa] text-[#525252] hover:bg-[#f5f5f5] border border-black/[0.06]'
                          }`}
                        >
                          {item.category}
                          <span className={`text-xs ${
                            marketActiveFilter === item.category ? 'text-white/70' : 'text-[#a3a3a3]'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })
                  : ['全部', '工作', '学习', '生活'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setMarketActiveFilter(cat)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          marketActiveFilter === cat
                            ? 'bg-[#171717] text-white shadow-sm'
                            : 'bg-[#fafafa] text-[#525252] hover:bg-[#f5f5f5] border border-black/[0.06]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))
                }
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {marketLoading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#171717] rounded-full animate-spin mb-4" />
                  <p className="text-sm text-[#737373]">加载中...</p>
                </div>
              )}

              {marketError && !marketLoading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <IconAlertCircle className="h-14 w-14 text-red-400 mb-3" />
                  <p className="text-sm font-medium text-[#737373] mb-1">加载失败</p>
                  <p className="text-xs text-[#a3a3a3] mb-4 text-center">
                    {marketError}
                  </p>
                  <button
                    type="button"
                    onClick={() => deviceId && loadMarketTemplates(deviceId, marketActiveFilter)}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-[#171717] hover:bg-black transition-colors shadow-sm"
                  >
                    <IconRefresh className="h-4 w-4" />
                    重新加载
                  </button>
                </div>
              )}

              {!marketLoading && !marketError && marketTemplates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <IconStar className="h-14 w-14 text-[#d4d4d4] mb-3" />
                  <p className="text-sm font-medium text-[#737373] mb-1">暂无模板</p>
                  <p className="text-xs text-[#a3a3a3] text-center leading-relaxed">
                    该分类下暂无模板，切换其他分类查看
                  </p>
                </div>
              )}

              {!marketLoading && !marketError && marketTemplates.length > 0 && (
                <div className="flex flex-col gap-3">
                  {marketTemplates.map((template) => {
                    const isExpanded = expandedTemplateId === template.id;
                    const isCopying = copyingTemplateId === template.id;

                    return (
                      <div
                        key={template.id}
                        className={`flex flex-col overflow-hidden rounded-xl border transition-all ${
                          isExpanded
                            ? 'border-[#171717]/[0.2] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1)]'
                            : 'border-black/[0.06] hover:border-black/[0.12] hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]'
                        } bg-white`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleTemplateExpand(template.id)}
                          className="w-full flex flex-col items-start gap-2 px-4 py-3 text-left transition-colors hover:bg-[#fafafa]/50"
                        >
                          <div className="flex items-start justify-between w-full gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-sm font-semibold text-[#171717]">
                                  {template.title}
                                </span>
                                {template.isOfficial && (
                                  <span className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                                    官方
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#525252] leading-relaxed">
                                {template.description}
                              </p>
                            </div>
                            <IconChevronDown
                              className={`h-5 w-5 text-[#737373] shrink-0 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-md border ${getCategoryColor(template.category)}`}>
                              {template.category}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-[#a3a3a3]">
                              <IconUsers className="h-3.5 w-3.5" />
                              {formatUsageCount(template.usageCount)} 人使用
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="template-detail-enter overflow-hidden">
                            <div className="px-4 pb-3">
                              <div className="bg-[#fafafa] rounded-lg p-3 border border-black/[0.04] mb-3">
                                <p className="text-xs font-medium text-[#525252] mb-2">模板内容预览</p>
                                <pre className="text-xs text-[#171717] leading-relaxed whitespace-pre-wrap font-sans max-h-48 overflow-y-auto">
                                  {template.content}
                                </pre>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUseMarketTemplate(template)}
                                  disabled={isCopying}
                                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-[#171717] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                  {isCopying ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      导入中...
                                    </>
                                  ) : (
                                    <>
                                      <IconPlus className="h-4 w-4" />
                                      一键使用
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <FormModal
        visible={showFormModal}
        onClose={closeFormModal}
        initialValues={editingTemplate ? {
          id: editingTemplate.id,
          title: editingTemplate.title,
          content: editingTemplate.content,
          category: editingTemplate.category,
        } : null}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
