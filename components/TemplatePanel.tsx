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

type TemplatesByCategory = Map<
  string,
  {
    category: string;
    templates: TemplateItem[];
  }
>;

const CATEGORIES = ['工作', '学习', '生活', '其他'];

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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconChevronUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="m6 15 6-6 6 6" />
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
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<boolean>(false);

  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('其他');

  const templatesByCategory = useMemo(() => {
    const grouped: TemplatesByCategory = new Map();

    CATEGORIES.forEach((cat) => {
      const categoryTemplates = templates.filter((t) => t.category === cat);
      if (categoryTemplates.length > 0) {
        grouped.set(cat, {
          category: cat,
          templates: categoryTemplates.sort((a, b) => a.orderIndex - b.orderIndex),
        });
      }
    });

    return grouped;
  }, [templates]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const openEditForm = useCallback((template: TemplateItem) => {
    setEditingTemplate(template);
    setFormTitle(template.title);
    setFormContent(template.content);
    setFormCategory(template.category);
    setShowForm(true);
  }, []);

  const openAddForm = useCallback(() => {
    setEditingTemplate(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('其他');
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('其他');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    setSaving(true);
    try {
      if (editingTemplate) {
        await onUpdateTemplate(editingTemplate.id, {
          title: formTitle.trim(),
          content: formContent.trim(),
          category: formCategory,
        });
      } else {
        await onAddTemplate({
          title: formTitle.trim(),
          content: formContent.trim(),
          category: formCategory,
        });
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  }, [formTitle, formContent, formCategory, editingTemplate, onAddTemplate, onUpdateTemplate, closeForm]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm('确定要删除这个模板吗？')) {
        await onDeleteTemplate(id);
      }
    },
    [onDeleteTemplate]
  );

  useEffect(() => {
    if (!visible) {
      setShowForm(false);
      setEditingTemplate(null);
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

  const getCategoryCount = () => templates.length;

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
              {getCategoryCount()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={openAddForm}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#171717] bg-[#f5f5f5] hover:bg-[#e5e5e5] transition-colors"
            >
              <IconPlus className="h-3.5 w-3.5" />
              新建
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-[#737373] hover:text-[#404040] transition-colors"
              aria-label="关闭"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showForm ? (
          <div className="p-4 border-b border-black/[0.06] bg-white">
            <h3 className="text-sm font-medium text-[#171717] mb-3">
              {editingTemplate ? '编辑模板' : '新建模板'}
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1">
                  标题
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="例如：帮我写个简历"
                  className="w-full rounded-lg border border-black/[0.08] bg-[#fafafa] px-3 py-2 text-sm text-[#171717] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#171717]/20 focus:border-[#171717]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1">
                  分类
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        formCategory === cat
                          ? 'bg-[#171717] text-white'
                          : 'bg-[#f5f5f5] text-[#525252] hover:bg-[#e5e5e5]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#525252] mb-1">
                  内容
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="输入模板内容，例如：请帮我写一份简历，要求突出工作经验..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-black/[0.08] bg-[#fafafa] px-3 py-2 text-sm text-[#171717] placeholder:text-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#171717]/20 focus:border-[#171717]/20"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[#525252] hover:bg-[#f5f5f5] transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!formTitle.trim() || !formContent.trim() || saving}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#171717] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto p-3">
          {templatesByCategory.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <IconTemplate className="h-12 w-12 text-[#d4d4d4] mb-3" />
              <p className="text-sm font-medium text-[#737373] mb-1">暂无模板</p>
              <p className="text-xs text-[#a3a3a3] mb-4">点击上方"新建"按钮创建你的第一个模板</p>
              <button
                type="button"
                onClick={openAddForm}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white bg-[#171717] hover:bg-black transition-colors"
              >
                <IconPlus className="h-4 w-4" />
                创建模板
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {Array.from(templatesByCategory.entries()).map(([category, categoryData]) => {
                const isExpanded = expandedCategories.has(category) || expandedCategories.size === 0;

                return (
                  <div key={category} className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isExpanded
                          ? 'bg-[#f5f5f5] text-[#171717]'
                          : 'bg-[#fafafa] text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isExpanded ? (
                          <IconChevronUp className="h-4 w-4 shrink-0" />
                        ) : (
                          <IconChevronDown className="h-4 w-4 shrink-0" />
                        )}
                        <span>{category}</span>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] ${
                          isExpanded
                            ? 'bg-[#e5e5e5] text-[#525252]'
                            : 'bg-[#e5e5e5] text-[#737373]'
                        }`}>
                          {categoryData.templates.length}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="flex flex-col gap-0.5 ml-2">
                        {categoryData.templates.map((template) => (
                          <div
                            key={template.id}
                            className="group flex items-stretch gap-0 overflow-hidden rounded-lg border border-[#e5e5e5] bg-white transition-colors hover:border-[#d4d4d4]"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onTemplateClick(template.content);
                                onClose();
                              }}
                              className="min-w-0 flex-1 flex flex-col items-start gap-1 rounded-l-lg px-3 py-2.5 text-left transition-colors hover:bg-[#fafafa]"
                            >
                              <div className="flex items-center gap-2 w-full">
                                <span className="text-sm font-medium text-[#171717] truncate">
                                  {template.title}
                                </span>
                              </div>
                              <p className="text-xs text-[#737373] leading-relaxed line-clamp-2">
                                {template.content}
                              </p>
                            </button>
                            <div className="flex items-center gap-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => openEditForm(template)}
                                className="flex w-8 h-8 items-center justify-center text-[#737373] hover:bg-[#f5f5f5] hover:text-[#171717] rounded-lg transition-colors"
                                title="编辑模板"
                                aria-label="编辑"
                              >
                                <IconEdit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(template.id)}
                                className="flex w-8 h-8 items-center justify-center text-[#737373] hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                title="删除模板"
                                aria-label="删除"
                              >
                                <IconTrash className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
