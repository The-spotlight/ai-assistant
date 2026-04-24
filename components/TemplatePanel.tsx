'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

type TemplateItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
};

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

interface TemplatePanelProps {
  visible: boolean;
  onClose: () => void;
  templates: TemplateItem[];
  onTemplateClick: (content: string) => void;
  onAddTemplate: (template: { title: string; content: string; category: string }) => Promise<void>;
  onUpdateTemplate: (id: string, template: { title?: string; content?: string; category?: string }) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
}

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  editingTemplate: TemplateItem | null;
  onSubmit: (data: { title: string; content: string; category: string }) => Promise<void>;
}

function FormModal({ visible, onClose, editingTemplate, onSubmit }: FormModalProps) {
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('其他');
  const [saving, setSaving] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      if (editingTemplate) {
        setFormTitle(editingTemplate.title);
        setFormContent(editingTemplate.content);
        setFormCategory(editingTemplate.category);
      } else {
        setFormTitle('');
        setFormContent('');
        setFormCategory('其他');
      }
    }
  }, [visible, editingTemplate]);

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
              {editingTemplate ? '编辑模板' : '新建模板'}
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
}: TemplatePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('全部');

  const filteredTemplates = useMemo(() => {
    const sorted = [...templates].sort((a, b) => a.orderIndex - b.orderIndex);
    if (activeFilter === '全部') {
      return sorted;
    }
    return sorted.filter((t) => t.category === activeFilter);
  }, [templates, activeFilter]);

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

  const getCategoryColor = (category: string) => {
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
        `}</style>

        <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.06] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <IconTemplate className="h-4 w-4 text-[#171717]" />
            <span className="text-sm font-medium text-[#171717]">我的模板</span>
            <span className="rounded-full px-2 py-0.5 text-xs bg-[#e5e5e5] text-[#525252]">
              {templates.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={openAddForm}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-[#171717] hover:bg-black transition-colors shadow-sm"
            >
              <IconPlus className="h-4 w-4" />
              新建模板
            </button>
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
              <p className="text-xs text-[#a3a3a3] mb-5">
                {activeFilter === '全部'
                  ? '点击上方"新建模板"按钮创建你的第一个模板'
                  : `"${activeFilter}"分类下暂无模板，切换其他分类或新建模板`}
              </p>
              {activeFilter === '全部' && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-[#171717] hover:bg-black transition-colors shadow-sm"
                >
                  <IconPlus className="h-4 w-4" />
                  创建模板
                </button>
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
      </div>

      <FormModal
        visible={showFormModal}
        onClose={closeFormModal}
        editingTemplate={editingTemplate}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
