'use client';

import { useState } from 'react';

interface ToolCallProps {
  toolName: string;
  args: Record<string, unknown>;
  result?: string;
}

const TOOL_EMOJIS: Record<string, string> = {
  web_search: '🔍',
  code_execution: '💻',
  calculator: '🧮',
  text_analyzer: '📝',
  translator: '🌐',
  weather: '🌤️',
};

const TOOL_LABELS: Record<string, string> = {
  web_search: '网络搜索',
  code_execution: '代码执行',
  calculator: '数学计算',
  text_analyzer: '文本分析',
  translator: '智能翻译',
  weather: '天气查询',
};

interface WeatherResult {
  success: boolean;
  location?: {
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  current?: {
    time: string;
    temperature: number;
    temperature_feels_like: number;
    humidity: number;
    weather_code: number;
    weather_description: string;
    weather_emoji: string;
    precipitation: number;
    rain: number;
    showers: number;
    snowfall: number;
    cloud_cover: number;
    pressure_msl: number;
    surface_pressure: number;
    wind_speed: number;
    wind_direction: number;
    wind_gusts: number;
  };
  forecast?: Array<{
    date: string;
    date_formatted: string;
    weather_code: number;
    weather_description: string;
    weather_emoji: string;
    temp_max: number;
    temp_min: number;
    uv_index_max: number;
    precipitation_sum: number;
    precipitation_hours: number;
    wind_speed_max: number;
    wind_gusts_max: number;
    wind_direction_dominant: number;
    sunrise: string;
    sunset: string;
  }>;
  units?: Record<string, string>;
  error?: string;
}

function isWeatherResult(data: unknown): data is WeatherResult {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    ('current' in data || 'error' in data)
  );
}

function formatTime(timeStr: string): string {
  const match = timeStr.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : timeStr;
}

function getWindDirection(degrees: number): string {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const normalizedDegrees = ((degrees % 360) + 360) % 360;
  const index = Math.floor((normalizedDegrees + 22.5) / 45) % 8;
  return directions[index];
}

function renderWeatherResult(result: WeatherResult) {
  if (!result.success) {
    return (
      <div className="rounded-md border border-[rgba(0,0,0,0.08)] bg-[#fafafa] p-3 text-xs text-[#666]">
        <p className="text-red-600">{result.error || '查询失败'}</p>
      </div>
    );
  }

  const { location, current, forecast } = result;

  return (
    <div className="space-y-3">
      {location && (
        <div className="flex items-center gap-2 text-xs text-[#666]">
          <span className="text-[#808080]">位置</span>
          <span className="font-medium text-[#171717]">{location.name}</span>
          {location.country && <span className="text-[#808080]">({location.country})</span>}
        </div>
      )}

      {current && (
        <div className="rounded-md border border-[rgba(0,0,0,0.08)] bg-[#fafafa] p-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl">{current.weather_emoji}</div>
            <div>
              <div className="text-2xl font-bold text-[#171717]">
                {current.temperature}°C
              </div>
              <div className="text-xs text-[#666]">
                {current.weather_description}
                {current.temperature_feels_like !== current.temperature && (
                  <span className="ml-2">体感 {current.temperature_feels_like}°C</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-[#666]">
              <span className="text-[#808080]">湿度</span>
              <span className="text-[#171717]">{current.humidity}%</span>
            </div>
            <div className="flex items-center gap-1 text-[#666]">
              <span className="text-[#808080]">风速</span>
              <span className="text-[#171717]">
                {current.wind_speed} km/h ({getWindDirection(current.wind_direction)})
              </span>
            </div>
            <div className="flex items-center gap-1 text-[#666]">
              <span className="text-[#808080]">云量</span>
              <span className="text-[#171717]">{current.cloud_cover}%</span>
            </div>
            <div className="flex items-center gap-1 text-[#666]">
              <span className="text-[#808080]">气压</span>
              <span className="text-[#171717]">{current.pressure_msl} hPa</span>
            </div>
            {current.precipitation > 0 && (
              <div className="flex items-center gap-1 text-[#666]">
                <span className="text-[#808080]">降水</span>
                <span className="text-[#171717]">{current.precipitation} mm</span>
              </div>
            )}
          </div>
        </div>
      )}

      {forecast && forecast.length > 0 && (
        <div>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#808080]">
            天气预报
          </div>
          <div className="space-y-2">
            {forecast.map((day, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-md border border-[rgba(0,0,0,0.08)] bg-[#fafafa] p-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{day.weather_emoji}</span>
                  <div>
                    <div className="font-medium text-[#171717]">{day.date_formatted}</div>
                    <div className="text-[#808080]">{day.weather_description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-[#171717]">
                    <span className="text-red-500">↑{day.temp_max}°C</span>
                    {' / '}
                    <span className="text-blue-500">↓{day.temp_min}°C</span>
                  </div>
                  {day.uv_index_max > 0 && (
                    <div className="text-[#808080]">紫外线: {day.uv_index_max}</div>
                  )}
                  {day.precipitation_sum > 0 && (
                    <div className="text-[#808080]">降水: {day.precipitation_sum} mm</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ToolCallCard({ toolName, args, result }: ToolCallProps) {
  const [expanded, setExpanded] = useState(false);
  const emoji = TOOL_EMOJIS[toolName] || '🔧';
  const label = TOOL_LABELS[toolName] || toolName;

  let parsedResult: unknown = null;
  try {
    parsedResult = result ? JSON.parse(result) : null;
  } catch {
    parsedResult = result;
  }

  const isWeatherTool = toolName === 'weather' && isWeatherResult(parsedResult);

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-[rgba(0,0,0,0.08)] bg-[#fafafa] shadow-[rgba(0,0,0,0.03)_0px_1.2px_0px]">
      <div className="border-l-[3px] border-neutral-300 pl-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-2 py-2.5 pr-3 text-left text-sm text-[#666666] transition-colors hover:bg-[#f0f0f0]"
        >
          <span className="text-base">{emoji}</span>
          <span className="font-medium text-[#171717]">{label}</span>
          <span className="min-w-0 flex-1 truncate text-xs text-[#808080]">{formatArgs(args)}</span>
          {isWeatherTool && (
            <span className="shrink-0 text-xs font-medium text-[#171717]">
              {(parsedResult as WeatherResult).current?.weather_emoji} {(parsedResult as WeatherResult).current?.temperature}°C
            </span>
          )}
          <span
            className={`shrink-0 ml-1 text-[#808080] transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            ▼
          </span>
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-[rgba(0,0,0,0.08)] bg-white p-3">
          <div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#808080]">
              参数
            </div>
            <pre className="overflow-x-auto rounded-md border border-[rgba(0,0,0,0.08)] bg-[#fafafa] p-3 text-xs text-[#171717]">
              {JSON.stringify(args, null, 2)}
            </pre>
          </div>

          {result && (
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#808080]">
                结果
              </div>
              {isWeatherTool ? (
                renderWeatherResult(parsedResult as WeatherResult)
              ) : (
                <div className="overflow-x-auto rounded-md border border-[rgba(0,0,0,0.08)] bg-[#fafafa] p-3 text-xs">
                  {typeof parsedResult === 'object' && parsedResult !== null ? (
                    <pre className="text-[#171717]">{JSON.stringify(parsedResult, null, 2)}</pre>
                  ) : (
                    <p className="whitespace-pre-wrap text-[#171717]">{result}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return '无参数';
  const [key, val] = entries[0];
  const displayVal =
    typeof val === 'string' && val.length > 40 ? val.slice(0, 40) + '...' : String(val);
  return `${key}: ${displayVal}`;
}
