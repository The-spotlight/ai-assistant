'use client';

import { Check } from 'lucide-react';
import { useSettings } from '@/lib/settings';
import { OPENROUTER_MODEL_OPTIONS } from '@/lib/openrouter-models';
import { Button } from '@/components/ui/Button';

export default function ModelSettings({ onClose }: { onClose: () => void }) {
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
    <div className="w-80 max-h-[80vh] overflow-y-auto p-4">
      <h3 className="text-sm font-medium text-[#171717] mb-4">模型设置</h3>
      
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-[#171717]">默认模型</span>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {OPENROUTER_MODEL_OPTIONS.map((option) => {
              const isSelected = model.defaultModel === option.id;
              return (
                <Button
                  key={option.id}
                  variant={isSelected ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => updateModel('defaultModel', option.id)}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate">{option.label}</span>
                </Button>
              );
            })}
          </div>
          <p className="text-[11px] text-[#a3a3a3]">
            新对话将使用此模型，已有对话保持原模型
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#171717]">温度参数</span>
            <span className="text-sm font-mono text-[#525252]">{model.temperature.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={model.temperature}
              onChange={(e) => handleTemperatureChange(e.target.value)}
              className="flex-1 h-2 bg-[#e5e5e5] rounded-full appearance-none cursor-pointer accent-[#171717]"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={model.temperature}
                onChange={(e) => handleTemperatureChange(e.target.value)}
                className="w-16 h-8 px-2 text-sm text-center border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#171717]/20"
              />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-[#a3a3a3]">
            <span>精确 (0.0)</span>
            <span>平衡 (1.0)</span>
            <span>创意 (2.0)</span>
          </div>
          <p className="text-[11px] text-[#a3a3a3]">
            控制输出随机性：越低越精确稳定，越高越有创意多变
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#171717]">最大 Token 限制</span>
            <span className="text-sm font-mono text-[#525252]">{model.maxTokens.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="256"
              max="32768"
              step="256"
              value={model.maxTokens}
              onChange={(e) => handleMaxTokensChange(e.target.value)}
              className="flex-1 h-2 bg-[#e5e5e5] rounded-full appearance-none cursor-pointer accent-[#171717]"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="128000"
                step="1"
                value={model.maxTokens}
                onChange={(e) => handleMaxTokensChange(e.target.value)}
                className="w-20 h-8 px-2 text-sm text-center border border-black/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#171717]/20"
              />
            </div>
          </div>
          <p className="text-[11px] text-[#a3a3a3]">
            限制单次回复的最大 Token 数量，影响可生成的文本长度
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#171717]">流式输出</span>
            <button
              type="button"
              onClick={() => updateModel('streaming', !model.streaming)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                model.streaming ? 'bg-[#171717]' : 'bg-[#d4d4d4]'
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
          <p className="text-[11px] text-[#a3a3a3]">
            {model.streaming
              ? '逐字显示回复内容，提供更好的实时体验'
              : '等待完整回复后一次性显示，适合低速网络'}
          </p>
        </div>
      </div>
    </div>
  );
}