'use client';

import { Modal, Select, message } from 'antd';
import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Plus, Edit2, Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import {
  OPENROUTER_MODEL_OPTIONS,
  type ModelOption,
} from '@/lib/openrouter-models';
import {
  type CustomModel,
  loadCustomModels,
  addCustomModel,
  updateCustomModel,
  removeCustomModel,
  decryptApiKey,
} from '@/lib/settings';

interface ModelSettingsProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

interface CustomModelFormData {
  name: string;
  apiKey: string;
  baseUrl: string;
  modelId: string;
  contextWindow: number;
  provider: string;
}

const DEFAULT_FORM_DATA: CustomModelFormData = {
  name: '',
  apiKey: '',
  baseUrl: DEFAULT_OPENROUTER_BASE_URL,
  modelId: '',
  contextWindow: 4096,
  provider: '自定义',
};

interface TestResult {
  status: 'idle' | 'testing' | 'success' | 'error';
  message: string;
}

function formatContextWindow(size: number): string {
  if (size >= 1048576) return `${(size / 1048576).toFixed(0)}M`;
  if (size >= 1024) return `${(size / 1024).toFixed(0)}K`;
  return size.toString();
}

function ModelSelectOption(props: { option: ModelOption }) {
  const { option } = props;
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex-1">
        <div className="font-medium text-sm text-gray-900">{option.label}</div>
        <div className="text-xs text-gray-500">
          {option.provider} · 上下文窗口: {option.contextWindowLabel}
        </div>
      </div>
      <span
        className={`text-xs px-2 py-0.5 rounded-full ml-2 shrink-0 ${
          option.isFree
            ? 'bg-green-100 text-green-700'
            : 'bg-orange-100 text-orange-700'
        }`}
      >
        {option.isFree ? '免费' : '付费'}
      </span>
    </div>
  );
}

function CustomModelCard(props: {
  model: CustomModel;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { model, isSelected, onSelect, onEdit, onDelete } = props;

  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'border-gray-900 bg-gray-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
      }`}
      onClick={onSelect}
    >
      <div
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
          isSelected ? 'border-gray-900 bg-gray-900' : 'border-gray-300'
        }`}
      >
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-gray-900 truncate">
          {model.name}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {model.provider || '自定义'} · 上下文窗口: {formatContextWindow(model.contextWindow)}
        </div>
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
        自定义
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="p-1.5 rounded-md hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors shrink-0"
        title="编辑"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-1.5 rounded-md hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors shrink-0"
        title="删除"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ModelSettings({ open, onClose }: ModelSettingsProps) {
  const { model, updateModel } = useSettings();
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModel, setEditingModel] = useState<CustomModel | null>(null);
  const [formData, setFormData] = useState<CustomModelFormData>(DEFAULT_FORM_DATA);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>({ status: 'idle', message: '' });
  
  const [deleteConfirm, setDeleteConfirm] = useState<CustomModel | null>(null);

  useEffect(() => {
    if (open) {
      setCustomModels(loadCustomModels());
    }
  }, [open]);

  const handleTemperatureChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0 && num <= 2) {
      updateModel('temperature', num);
    }
  };

  const handleMaxTokensChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 128000) {
      updateModel('maxTokens', num);
    }
  };

  const openAddModal = () => {
    setEditingModel(null);
    setFormData(DEFAULT_FORM_DATA);
    setTestResult({ status: 'idle', message: '' });
    setShowApiKey(false);
    setShowAddModal(true);
  };

  const openEditModal = (customModel: CustomModel) => {
    setEditingModel(customModel);
    setFormData({
      name: customModel.name,
      apiKey: decryptApiKey(customModel.encryptedApiKey),
      baseUrl: customModel.baseUrl,
      modelId: customModel.modelId,
      contextWindow: customModel.contextWindow,
      provider: customModel.provider,
    });
    setTestResult({ status: 'idle', message: '' });
    setShowApiKey(false);
    setShowAddModal(true);
  };

  const testConnection = useCallback(async () => {
    if (!formData.baseUrl || !formData.apiKey || !formData.modelId) {
      setTestResult({ status: 'error', message: '请填写 Base URL、API Key 和模型 ID' });
      return;
    }

    setTestResult({ status: 'testing', message: '正在测试连接...' });

    try {
      const baseUrl = formData.baseUrl.endsWith('/')
        ? formData.baseUrl.slice(0, -1)
        : formData.baseUrl;

      let testUrl = `${baseUrl}/models`;
      let response: Response;

      try {
        response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${formData.apiKey}`,
            'Content-Type': 'application/json',
          },
        });
      } catch {
        testUrl = `${baseUrl}/chat/completions`;
        response = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${formData.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: formData.modelId,
            messages: [{ role: 'user', content: 'hi' }],
            max_tokens: 1,
          }),
        });
      }

      if (response.ok) {
        setTestResult({ status: 'success', message: '连接成功！' });
      } else {
        let errorMessage = `HTTP 错误: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } catch {}
        setTestResult({ status: 'error', message: errorMessage });
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : '网络连接失败，请检查 Base URL 是否正确';
      setTestResult({ status: 'error', message: errorMsg });
    }
  }, [formData]);

  const saveCustomModel = () => {
    if (!formData.name.trim()) {
      message.error('请输入模型名称');
      return;
    }
    if (!formData.apiKey.trim()) {
      message.error('请输入 API Key');
      return;
    }
    if (!formData.baseUrl.trim()) {
      message.error('请输入 Base URL');
      return;
    }
    if (!formData.modelId.trim()) {
      message.error('请输入模型 ID');
      return;
    }

    let updatedModels: CustomModel[];
    if (editingModel) {
      updatedModels = updateCustomModel(editingModel.id, {
        name: formData.name,
        apiKey: formData.apiKey,
        baseUrl: formData.baseUrl,
        modelId: formData.modelId,
        contextWindow: formData.contextWindow,
        provider: formData.provider,
      });
      message.success('模型已更新');
    } else {
      updatedModels = addCustomModel({
        name: formData.name,
        apiKey: formData.apiKey,
        baseUrl: formData.baseUrl,
        modelId: formData.modelId,
        contextWindow: formData.contextWindow,
        provider: formData.provider,
      });
      message.success('模型已添加');
    }

    setCustomModels(updatedModels);
    setShowAddModal(false);
    setEditingModel(null);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      const updatedModels = removeCustomModel(deleteConfirm.id);
      setCustomModels(updatedModels);
      
      if (model.defaultModel === deleteConfirm.id) {
        const firstModel = OPENROUTER_MODEL_OPTIONS[0];
        if (firstModel) {
          updateModel('defaultModel', firstModel.id);
        }
      }
      
      message.success('模型已删除');
      setDeleteConfirm(null);
    }
  };

  const getAllModelOptions = () => {
    const systemModels = OPENROUTER_MODEL_OPTIONS.map((m) => ({
      ...m,
      type: 'system' as const,
    }));
    
    const customModelOptions = customModels.map((m) => ({
      id: m.id,
      label: m.name,
      provider: m.provider || '自定义',
      isFree: false,
      contextWindow: m.contextWindow,
      contextWindowLabel: formatContextWindow(m.contextWindow),
      type: 'custom' as const,
      customModel: m,
    }));

    return [...systemModels, ...customModelOptions];
  };

  const isCustomModelSelected = customModels.some((m) => m.id === model.defaultModel);

  return (
    <>
      <Modal
        title="模型设置"
        open={open}
        onCancel={onClose}
        footer={null}
        width={520}
        bodyStyle={{ padding: 24 }}
      >
        <div className="flex flex-col gap-6">
          {customModels.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">自定义模型</span>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加模型
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {customModels.map((customModel) => (
                  <CustomModelCard
                    key={customModel.id}
                    model={customModel}
                    isSelected={model.defaultModel === customModel.id}
                    onSelect={() => updateModel('defaultModel', customModel.id)}
                    onEdit={() => openEditModal(customModel)}
                    onDelete={() => setDeleteConfirm(customModel)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                {customModels.length > 0 ? '系统模型' : '默认模型'}
              </span>
              {customModels.length === 0 && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加自定义模型
                </button>
              )}
            </div>
            <Select
              value={isCustomModelSelected ? undefined : model.defaultModel}
              onChange={(value) => updateModel('defaultModel', value)}
              dropdownStyle={{ maxHeight: 400 }}
              optionLabelProp="children"
              className="w-full"
              placeholder="选择模型"
              allowClear={false}
            >
              {OPENROUTER_MODEL_OPTIONS.map((option) => (
                <Select.Option key={option.id} value={option.id}>
                  <ModelSelectOption option={option} />
                </Select.Option>
              ))}
            </Select>
            <p className="text-xs text-gray-500">
              新对话将使用此模型，已有对话保持原模型
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">温度参数</span>
              <span className="text-sm font-mono text-gray-600">
                {model.temperature.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={model.temperature}
                onChange={(e) => handleTemperatureChange(e.target.value)}
                className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={model.temperature}
                  onChange={(e) => handleTemperatureChange(e.target.value)}
                  className="w-16 h-8 px-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>精确 (0.0)</span>
              <span>平衡 (1.0)</span>
              <span>创意 (2.0)</span>
            </div>
            <p className="text-xs text-gray-500">
              控制输出随机性：越低越精确稳定，越高越有创意多变
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">最大 Token 限制</span>
              <span className="text-sm font-mono text-gray-600">
                {model.maxTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="256"
                max="32768"
                step="256"
                value={model.maxTokens}
                onChange={(e) => handleMaxTokensChange(e.target.value)}
                className="flex-1 h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="128000"
                  step="1"
                  value={model.maxTokens}
                  onChange={(e) => handleMaxTokensChange(e.target.value)}
                  className="w-20 h-8 px-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              限制单次回复的最大 Token 数量，影响可生成的文本长度
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">流式输出</span>
              <button
                type="button"
                onClick={() => updateModel('streaming', !model.streaming)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  model.streaming ? 'bg-gray-900' : 'bg-gray-300'
                }`}
                aria-checked={model.streaming}
                role="switch"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    model.streaming ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {model.streaming
                ? '逐字显示回复内容，提供更好的实时体验'
                : '等待完整回复后一次性显示，适合低速网络'}
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        title={editingModel ? '编辑自定义模型' : '添加自定义模型'}
        open={showAddModal}
        onCancel={() => setShowAddModal(false)}
        footer={null}
        width={480}
        bodyStyle={{ padding: 24 }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-700 font-medium">
              模型名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="例如：我的 GPT-4"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-700 font-medium">
              API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder="输入您的 API Key"
                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              API Key 将被加密存储在本地，不会明文保存
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-700 font-medium">
              Base URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.baseUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="例如：https://openrouter.ai/api/v1"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 font-mono"
            />
            <p className="text-xs text-gray-500">
              默认使用 OpenRouter 地址，可修改为其他兼容 OpenAI 格式的中转地址
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-700 font-medium">
              模型 ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.modelId}
              onChange={(e) => setFormData((prev) => ({ ...prev, modelId: e.target.value }))}
              placeholder="例如：gpt-4o 或 openai/gpt-4o"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 font-mono"
            />
            <p className="text-xs text-gray-500">
              请确保模型 ID 与 API 服务商提供的一致
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-700 font-medium">
                上下文窗口
              </label>
              <input
                type="number"
                min="1"
                max="2097152"
                value={formData.contextWindow}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    setFormData((prev) => ({ ...prev, contextWindow: val }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-700 font-medium">
                提供商
              </label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData((prev) => ({ ...prev, provider: e.target.value }))}
                placeholder="例如：OpenAI"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={testConnection}
              disabled={testResult.status === 'testing'}
              className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {testResult.status === 'testing' && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-gray-700" />
              )}
              测试连接
            </button>
            
            {testResult.status !== 'idle' && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  testResult.status === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : testResult.status === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-gray-50 text-gray-700 border border-gray-200'
                }`}
              >
                {testResult.status === 'success' && <Check className="w-4 h-4 shrink-0" />}
                {testResult.status === 'error' && <X className="w-4 h-4 shrink-0" />}
                <span className="break-all">{testResult.message}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={saveCustomModel}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors"
            >
              {editingModel ? '保存修改' : '添加模型'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        title="确认删除"
        open={!!deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        footer={null}
        width={400}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">确认删除此模型？</h3>
              <p className="text-xs text-gray-500 mt-0.5">此操作不可恢复</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            确定要删除模型「<span className="font-medium">{deleteConfirm?.name}</span>」吗？
            {deleteConfirm?.id === model.defaultModel && (
              <span className="text-red-600 block mt-1">
                注意：此模型当前为默认模型，删除后将自动切换到第一个系统模型。
              </span>
            )}
          </p>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              删除
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
