'use client';

import { Modal, Select } from 'antd';
import { useSettings } from '@/lib/settings';
import { OPENROUTER_MODEL_OPTIONS, type ModelOption } from '@/lib/openrouter-models';

interface ModelSettingsProps {
  open: boolean;
  onClose: () => void;
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

export default function ModelSettings({ open, onClose }: ModelSettingsProps) {
  const { model, updateModel } = useSettings();

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

  return (
    <Modal
      title="模型设置"
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
      bodyStyle={{ padding: 24 }}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-gray-900">默认模型</span>
          <Select
            value={model.defaultModel}
            onChange={(value) => updateModel('defaultModel', value)}
            dropdownStyle={{ maxHeight: 400 }}
            optionLabelProp="children"
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
  );
}