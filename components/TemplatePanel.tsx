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

function IconDownload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconUpload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

const TEMPLATE_EXPORT_VERSION = 1;

interface TemplatePanelProps {
  visible: boolean;
  onClose: () => void;
  templates: TemplateItem[];
  onTemplateClick: (content: string) => void;
  onAddTemplate: (template: { title: string; content: string; category: string }) => Promise<void>;
  onUpdateTemplate: (id: string, template: { title?: string; content?: string; category?: string }) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
  onBatchImport?: (templates: ExportTemplate[]) => Promise<void>;
  onImportComplete?: () => void;
}

type FormModalMode = 'create' | 'edit' | 'save-as';

type ExportTemplate = {
  title: string;
  content: string;
  category: string;
};

type TemplateExportData = {
  version: number;
  exportedAt: string;
  templates: ExportTemplate[];
};

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

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  templates: TemplateItem[];
  onExport: (selectedIds: string[]) => void;
}

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  existingTemplates: TemplateItem[];
  onImport: (templates: ExportTemplate[]) => Promise<void>;
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

export function ExportModal({ visible, onClose, templates, onExport }: ExportModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      setSelectedIds(new Set());
      setSelectAll(false);
    }
  }, [visible]);

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

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectAll || selectedIds.size === templates.length) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(templates.map((t) => t.id)));
      setSelectAll(true);
    }
  };

  const handleExport = () => {
    if (selectedIds.size === 0) return;
    onExport(Array.from(selectedIds));
    onClose();
  };

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

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div
        ref={modalRef}
        className="mx-4 w-full max-w-md flex flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.04)]"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.06] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <IconDownload className="h-4 w-4 text-[#171717]" />
            <span className="text-sm font-medium text-[#171717]">
              导出模板
            </span>
            <span className="rounded-full px-2 py-0.5 text-xs bg-[#e5e5e5] text-[#525252]">
              {selectedIds.size}
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

        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <IconTemplate className="h-12 w-12 text-[#d4d4d4] mb-3" />
              <p className="text-sm font-medium text-[#737373]">暂无模板可导出</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[#fafafa] transition-colors cursor-pointer border-b border-black/[0.04]">
                <input
                  type="checkbox"
                  checked={templates.length > 0 && selectedIds.size === templates.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-[#171717] focus:ring-[#171717] cursor-pointer"
                />
                <span className="text-sm font-medium text-[#525252]">全选</span>
              </label>
              {templates.map((template) => (
                <label
                  key={template.id}
                  className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-[#fafafa] transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(template.id)}
                    onChange={() => toggleSelect(template.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#171717] focus:ring-[#171717] cursor-pointer"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#171717] truncate">
                        {template.title}
                      </span>
                      <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded border ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#a3a3a3] mt-1 line-clamp-1">
                      {template.content}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
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
            onClick={handleExport}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#171717] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <IconDownload className="h-4 w-4" />
            导出 {selectedIds.size > 0 && `(${selectedIds.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ImportModal({ visible, onClose, existingTemplates, onImport }: ImportModalProps) {
  const [step, setStep] = useState<'select' | 'preview' | 'importing'>('select');
  const [importData, setImportData] = useState<ExportTemplate[]>([]);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible) {
      setStep('select');
      setImportData([]);
      setError('');
    }
  }, [visible]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        let templates: ExportTemplate[] = [];
        
        if (Array.isArray(data)) {
          templates = data;
        } else if (data.version !== undefined) {
          if (data.version > TEMPLATE_EXPORT_VERSION) {
            throw new Error(`模板文件版本过高（v${data.version}），当前版本为 v${TEMPLATE_EXPORT_VERSION}。请更新应用后再尝试导入。`);
          }
          
          if (data.templates && Array.isArray(data.templates)) {
            templates = data.templates;
          } else {
            throw new Error('无效的模板文件格式：缺少 templates 数组');
          }
        } else if (data.templates && Array.isArray(data.templates)) {
          templates = data.templates;
        } else {
          throw new Error('无效的模板文件格式');
        }

        const validTemplates = templates.filter((t) => 
          t.title && typeof t.title === 'string' &&
          t.content && typeof t.content === 'string'
        );

        if (validTemplates.length === 0) {
          throw new Error('文件中没有有效的模板');
        }

        setImportData(validTemplates);
        setStep('preview');
      } catch (err) {
        setError(err instanceof Error ? err.message : '无法解析文件，请确保是有效的 JSON 文件');
      }
    };
    reader.onerror = () => {
      setError('读取文件失败');
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getUniqueTitle = (title: string, index: number): string => {
    const existingTitles = existingTemplates.map((t) => t.title.toLowerCase());
    let candidate = title;
    let counter = 1;

    while (existingTitles.includes(candidate.toLowerCase())) {
      candidate = `${title}(${counter})`;
      counter++;
    }

    return candidate;
  };

  const handleImport = async () => {
    setStep('importing');
    try {
      await onImport(importData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
      setStep('preview');
    }
  };

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

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div
        ref={modalRef}
        className="mx-4 w-full max-w-md flex flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.04)]"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.06] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <IconUpload className="h-4 w-4 text-[#171717]" />
            <span className="text-sm font-medium text-[#171717]">
              导入模板
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737373] hover:text-[#404040] transition-colors"
            aria-label="关闭"
            disabled={step === 'importing'}
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        {step === 'select' && (
          <div className="p-8">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[#fafafa] flex items-center justify-center mb-4 border border-black/[0.06]">
                <IconUpload className="h-8 w-8 text-[#737373]" />
              </div>
              <p className="text-sm font-medium text-[#171717] mb-2">选择要导入的模板文件</p>
              <p className="text-xs text-[#a3a3a3] mb-6 text-center">
                支持从其他设备导出的 JSON 模板文件
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-[#171717] hover:bg-black transition-colors shadow-sm"
              >
                <IconUpload className="h-4 w-4" />
                选择文件
              </button>
            </div>
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && (
          <>
            <div className="px-4 py-3 border-b border-black/[0.04] bg-white">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#525252]">
                  共发现 <span className="font-medium text-[#171717]">{importData.length}</span> 个模板
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep('select');
                    setImportData([]);
                    setError('');
                  }}
                  className="text-xs text-[#525252] hover:text-[#171717] transition-colors"
                >
                  重新选择
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[40vh]">
              <div className="flex flex-col gap-2">
                {importData.map((template, index) => {
                  const originalTitle = template.title;
                  const uniqueTitle = getUniqueTitle(originalTitle, index);
                  const isDuplicate = originalTitle !== uniqueTitle;

                  return (
                    <div
                      key={index}
                      className="flex flex-col gap-1.5 p-3 rounded-xl border border-black/[0.06] bg-white"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${isDuplicate ? 'text-amber-600' : 'text-[#171717]'}`}>
                          {isDuplicate ? uniqueTitle : template.title}
                        </span>
                        <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded border ${getCategoryColor(template.category || '其他')}`}>
                          {template.category || '其他'}
                        </span>
                        {isDuplicate && (
                          <span className="shrink-0 text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200">
                            重命名
                          </span>
                        )}
                      </div>
                      {isDuplicate && (
                        <p className="text-xs text-amber-600">
                          原标题 "{originalTitle}" 已存在，将导入为 "{uniqueTitle}"
                        </p>
                      )}
                      <p className="text-xs text-[#a3a3a3] line-clamp-2">
                        {template.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            {error && (
              <div className="px-4 pb-2">
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}
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
                onClick={handleImport}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#171717] hover:bg-black transition-colors shadow-sm"
              >
                <IconCheck className="h-4 w-4" />
                确认导入
              </button>
            </div>
          </>
        )}

        {step === 'importing' && (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-[#e5e5e5] border-t-[#171717] animate-spin mb-4" />
              <p className="text-sm font-medium text-[#171717]">正在导入模板...</p>
            </div>
          </div>
        )}
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
  onBatchImport,
  onImportComplete,
}: TemplatePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('全部');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

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

  const handleExport = useCallback((selectedIds: string[]) => {
    const selectedTemplates = templates.filter((t) => selectedIds.includes(t.id));
    const templatesData: ExportTemplate[] = selectedTemplates.map((t) => ({
      title: t.title,
      content: t.content,
      category: t.category,
    }));

    const exportData: TemplateExportData = {
      version: TEMPLATE_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      templates: templatesData,
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `templates-${dateStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [templates]);

  const getUniqueTitle = useCallback((title: string, existingTitles: string[]): string => {
    const lowerTitles = existingTitles.map((t) => t.toLowerCase());
    let candidate = title;
    let counter = 1;

    while (lowerTitles.includes(candidate.toLowerCase())) {
      candidate = `${title}(${counter})`;
      counter++;
    }

    return candidate;
  }, []);

  const handleImport = useCallback(async (importTemplates: ExportTemplate[]) => {
    if (onBatchImport) {
      await onBatchImport(importTemplates);
    } else {
      const existingTitles = templates.map((t) => t.title);

      for (const template of importTemplates) {
        const uniqueTitle = getUniqueTitle(template.title, existingTitles);
        await onAddTemplate({
          title: uniqueTitle,
          content: template.content,
          category: template.category || '其他',
        });
        existingTitles.push(uniqueTitle);
      }
    }

    onImportComplete?.();
  }, [templates, onAddTemplate, getUniqueTitle, onBatchImport, onImportComplete]);

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
      setShowExportModal(false);
      setShowImportModal(false);
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
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[#525252] hover:bg-[#f5f5f5] hover:text-[#171717] transition-colors border border-black/[0.06]"
              title="导入模板"
            >
              <IconUpload className="h-4 w-4" />
              导入
            </button>
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              disabled={templates.length === 0}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-[#525252] hover:bg-[#f5f5f5] hover:text-[#171717] transition-colors border border-black/[0.06] disabled:opacity-40 disabled:cursor-not-allowed"
              title="导出模板"
            >
              <IconDownload className="h-4 w-4" />
              导出
            </button>
            <button
              type="button"
              onClick={openAddForm}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-[#171717] hover:bg-black transition-colors shadow-sm ml-1"
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
              <p className="text-xs text-[#a3a3a3] mb-5 text-center leading-relaxed">
                {activeFilter === '全部'
                  ? '可以点击下方"创建模板"按钮新建\n或从对话列表中悬停对话，点击"另存为模板"图标'
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
        initialValues={editingTemplate ? {
          id: editingTemplate.id,
          title: editingTemplate.title,
          content: editingTemplate.content,
          category: editingTemplate.category,
        } : null}
        onSubmit={handleFormSubmit}
      />

      <ExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        templates={templates}
        onExport={handleExport}
      />

      <ImportModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        existingTemplates={templates}
        onImport={handleImport}
      />
    </div>
  );
}
