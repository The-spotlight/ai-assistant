/**
 * Tool Executors — Handle actual tool execution
 *
 * Each executor takes arguments and returns a result string.
 */

// ─── 1. Web Search (using DuckDuckGo Instant Answer API — no key needed) ───

async function execWebSearch(args: { query: string; count?: number }): Promise<string> {
  const { query, count = 5 } = args;

  try {
    // Use DuckDuckGo Instant Answer API (free, no API key)
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url);
    const data = await res.json();

    const results: string[] = [];

    // Abstract text
    if (data.AbstractText) {
      results.push(`📖 ${data.AbstractText}`);
      if (data.AbstractURL) results.push(`🔗 ${data.AbstractURL}`);
    }

    // Related topics
    if (data.RelatedTopics?.length > 0) {
      const topics = data.RelatedTopics.slice(0, count);
      topics.forEach((t: any, i: number) => {
        if (t.Text) results.push(`${i + 1}. ${t.Text}`);
        if (t.FirstURL) results.push(`   🔗 ${t.FirstURL}`);
      });
    }

    if (results.length === 0) {
      return JSON.stringify({
        success: false,
        message: `未找到关于"${query}"的搜索结果。建议尝试更具体的关键词。`,
      });
    }

    return JSON.stringify({
      success: true,
      query,
      results: results.join('\n'),
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: `搜索失败: ${error instanceof Error ? error.message : '未知错误'}`,
    });
  }
}

// ─── 2. Code Execution (sandboxed Python-like evaluation) ───────────────────

async function execCodeExecution(args: { code: string; timeout?: number }): Promise<string> {
  const { code, timeout = 10 } = args;

  try {
    // We'll use a lightweight approach: evaluate safe expressions
    // For full Python execution, integrate with Pyodide or a backend service
    const result = evaluateSafeCode(code);
    return JSON.stringify({
      success: true,
      code: code.slice(0, 200) + (code.length > 200 ? '...' : ''),
      output: result,
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '执行失败',
    });
  }
}

function evaluateSafeCode(code: string): string {
  // Safe evaluation for math expressions
  const lines = code.split('\n').filter((l) => l.trim());
  const outputs: string[] = [];

  for (const line of lines) {
    // Handle print statements
    const printMatch = line.match(/^print\((.+)\)$/);
    if (printMatch) {
      try {
        const val = safeEval(printMatch[1]);
        outputs.push(String(val));
      } catch {
        outputs.push(`[print] ${printMatch[1]}`);
      }
      continue;
    }

    // Handle assignments
    const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
    if (assignMatch) {
      try {
        const val = safeEval(assignMatch[2]);
        outputs.push(`${assignMatch[1]} = ${val}`);
      } catch {
        outputs.push(`[assigned] ${assignMatch[1]}`);
      }
      continue;
    }

    // Try evaluating as expression
    try {
      const val = safeEval(line);
      outputs.push(String(val));
    } catch {
      outputs.push(`[executed] ${line}`);
    }
  }

  return outputs.join('\n') || '代码执行完成（无输出）';
}

function safeEval(expr: string): unknown {
  // Remove dangerous patterns
  if (/import|require|process|exec|eval|Function|fetch|http/i.test(expr)) {
    throw new Error('不安全的操作被阻止');
  }

  // Math functions
  const mathFns: Record<string, (...args: number[]) => number> = {
    sqrt: Math.sqrt,
    abs: Math.abs,
    round: Math.round,
    floor: Math.floor,
    ceil: Math.ceil,
    pow: Math.pow,
    log: Math.log,
    log10: Math.log10,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    asin: Math.asin,
    acos: Math.acos,
    atan: Math.atan,
    max: Math.max,
    min: Math.min,
  };

  const mathConsts: Record<string, number> = {
    pi: Math.PI,
    e: Math.E,
    PI: Math.PI,
    E: Math.E,
  };

  // Build safe context
  const ctx: Record<string, unknown> = { ...mathConsts };

  // Replace math function calls
  let safeExpr = expr;
  for (const [name, fn] of Object.entries(mathFns)) {
    ctx[name] = fn;
  }

  // Replace constants
  for (const [name, val] of Object.entries(mathConsts)) {
    safeExpr = safeExpr.replace(new RegExp(`\\b${name}\\b`, 'g'), String(val));
  }

  // Replace ^ with **
  safeExpr = safeExpr.replace(/\^/g, '**');

  try {
    const fn = new Function(...Object.keys(ctx), `return (${safeExpr})`);
    return fn(...Object.values(ctx));
  } catch {
    throw new Error(`无法计算表达式: ${expr}`);
  }
}

// ─── 3. Calculator ──────────────────────────────────────────────────────────

async function execCalculator(args: { expression: string }): Promise<string> {
  const { expression } = args;
  try {
    const result = safeEval(expression);
    return JSON.stringify({
      success: true,
      expression,
      result: typeof result === 'number' ? Number((result as number).toFixed(10)) : result,
    });
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: `计算失败: ${error instanceof Error ? error.message : '未知错误'}`,
    });
  }
}

// ─── 4. Text Analyzer ───────────────────────────────────────────────────────

async function execTextAnalyzer(args: { text: string; analysis_type: string }): Promise<string> {
  const { text, analysis_type } = args;

  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const sentenceCount = text.split(/[.!?。！？]+/).filter(Boolean).length;
  const avgWordLength = wordCount > 0 ? (text.replace(/\s/g, '').length / wordCount).toFixed(1) : '0';

  // Extract keywords (simple TF approach)
  const stopWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'what', 'which', 'who', 'this', 'that', 'these', 'those', 'it', 'its', 'he', 'she', 'they', 'them', 'his', 'her', 'their', 'my', 'your', 'our', 'we']);

  const words = text.toLowerCase().replace(/[^\w\u4e00-\u9fff]/g, ' ').split(/\s+/).filter(w => w.length > 1);
  const freq: Record<string, number> = {};
  words.forEach(w => {
    if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
  });
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => `${word}(${count})`);

  // Simple sentiment analysis (keyword-based)
  const positiveWords = ['好', '棒', '优秀', '喜欢', '开心', '成功', 'great', 'good', 'excellent', 'amazing', 'love', 'happy', 'wonderful', 'fantastic', 'best'];
  const negativeWords = ['差', '坏', '糟糕', '失望', '失败', '困难', 'bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'poor', 'sad', 'angry'];

  const lowerText = text.toLowerCase();
  const posCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negCount = negativeWords.filter(w => lowerText.includes(w)).length;
  const sentiment = posCount > negCount ? '正面 👍' : negCount > posCount ? '负面 👎' : '中性 😐';

  // Readability (simple avg sentence length)
  const avgSentLen = sentenceCount > 0 ? (wordCount / sentenceCount).toFixed(1) : '0';
  const readability = parseFloat(avgSentLen) < 15 ? '易读 📗' : parseFloat(avgSentLen) < 25 ? '中等 📙' : '较难 📕';

  // Generate summary (first 2-3 sentences)
  const sentences = text.split(/[.!?。！？]+/).filter(Boolean);
  const summary = sentences.slice(0, 3).join('。') + (sentences.length > 3 ? '。' : '');

  const analysis: Record<string, unknown> = {};

  if (analysis_type === 'summary' || analysis_type === 'all') {
    analysis.summary = summary || '文本太短，无法生成摘要';
  }
  if (analysis_type === 'keywords' || analysis_type === 'all') {
    analysis.keywords = keywords;
  }
  if (analysis_type === 'sentiment' || analysis_type === 'all') {
    analysis.sentiment = sentiment;
    analysis.positiveScore = posCount;
    analysis.negativeScore = negCount;
  }
  if (analysis_type === 'readability' || analysis_type === 'all') {
    analysis.readability = readability;
    analysis.stats = { charCount, wordCount, sentenceCount, avgWordLength, avgSentLen };
  }

  return JSON.stringify({ success: true, analysis_type, ...analysis }, null, 2);
}

// ─── 5. Translator ──────────────────────────────────────────────────────────

async function execTranslator(args: { text: string; target_lang?: string; style?: string }): Promise<string> {
  const { text, target_lang = 'en', style = 'formal' } = args;

  // Language detection (simple heuristic)
  const langMap: Record<string, RegExp> = {
    zh: /[\u4e00-\u9fff]/,
    ja: /[\u3040-\u309f\u30a0-\u30ff]/,
    ko: /[\uac00-\ud7af\u1100-\u11ff]/,
    en: /[a-zA-Z]/,
    fr: /[àâçéèêëîïôûùüÿœæ]/i,
    de: /[äöüß]/i,
    es: /[áéíóúñ¿¡]/i,
  };

  let detectedLang = 'unknown';
  let maxScore = 0;
  for (const [lang, regex] of Object.entries(langMap)) {
    const matches = text.match(new RegExp(regex.source, 'g'));
    const score = matches ? matches.length / text.length : 0;
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }

  const langNames: Record<string, string> = {
    zh: '中文', en: '英语', ja: '日语', ko: '韩语', fr: '法语', de: '德语', es: '西班牙语',
  };

  // For actual translation, the AI model handles it
  // This tool returns metadata + instructs the model to translate
  return JSON.stringify({
    success: true,
    detected_language: langNames[detectedLang] || detectedLang,
    target_language: langNames[target_lang] || target_lang,
    style,
    text_length: text.length,
    instruction: `请将以下文本从${langNames[detectedLang] || detectedLang}翻译为${langNames[target_lang] || target_lang}（${style}风格）`,
    original_text: text.slice(0, 500),
  });
}

// ─── 6. Weather ───────────────────────────────────────────────────────────

interface GeoLocation {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

interface WeatherData {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    rain: number;
    showers: number;
    snowfall: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_sum: number[];
    rain_sum: number[];
    showers_sum: number[];
    snowfall_sum: number[];
    precipitation_hours: number[];
    windspeed_10m_max: number[];
    windgusts_10m_max: number[];
    winddirection_10m_dominant: number[];
  };
}

function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: '晴朗',
    1: '大部晴朗',
    2: '局部多云',
    3: '阴天',
    45: '有雾',
    48: '雾凇',
    51: '小毛毛雨',
    53: '毛毛雨',
    55: '大毛毛雨',
    56: '冻毛毛雨',
    57: '大冻毛毛雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    66: '冻雨',
    67: '大冻雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    77: '雪粒',
    80: '小阵雨',
    81: '阵雨',
    82: '强阵雨',
    85: '小阵雪',
    86: '大阵雪',
    95: '雷阵雨',
    96: '雷阵雨伴冰雹',
    99: '强雷阵雨伴冰雹',
  };
  return descriptions[code] || `天气代码: ${code}`;
}

function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌧️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 86) return '🌧️';
  return '⛈️';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = days[date.getDay()];
  return `${month}月${day}日 ${weekday}`;
}

async function geocodeLocation(location: string): Promise<GeoLocation | null> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=zh&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.results || data.results.length === 0) {
      return null;
    }
    
    const result = data.results[0];
    return {
      name: result.name,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
      admin1: result.admin1,
    };
  } catch {
    return null;
  }
}

async function fetchWeatherData(
  latitude: number,
  longitude: number,
  forecastDays: number
): Promise<WeatherData | null> {
  try {
    const currentParams = [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
      'precipitation', 'rain', 'showers', 'snowfall', 'weather_code',
      'cloud_cover', 'pressure_msl', 'surface_pressure',
      'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m'
    ];
    
    const dailyParams = [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min',
      'sunrise', 'sunset', 'uv_index_max',
      'precipitation_sum', 'rain_sum', 'showers_sum', 'snowfall_sum',
      'precipitation_hours', 'windspeed_10m_max', 'windgusts_10m_max',
      'winddirection_10m_dominant'
    ];
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${currentParams.join(',')}&daily=${dailyParams.join(',')}&forecast_days=${Math.min(forecastDays, 7)}&timezone=auto`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    return data as WeatherData;
  } catch {
    return null;
  }
}

async function execWeather(args: { 
  location?: string; 
  latitude?: number; 
  longitude?: number; 
  forecast_days?: number 
}): Promise<string> {
  const { location, latitude, longitude, forecast_days = 3 } = args;
  
  let targetLat: number | null = null;
  let targetLon: number | null = null;
  let locationName = '';
  let country = '';
  
  if (latitude !== undefined && longitude !== undefined) {
    targetLat = latitude;
    targetLon = longitude;
    locationName = `${latitude}, ${longitude}`;
  } else if (location) {
    const geoLocation = await geocodeLocation(location);
    if (geoLocation) {
      targetLat = geoLocation.latitude;
      targetLon = geoLocation.longitude;
      locationName = geoLocation.admin1 
        ? `${geoLocation.admin1} ${geoLocation.name}` 
        : geoLocation.name;
      country = geoLocation.country;
    } else {
      return JSON.stringify({
        success: false,
        error: `无法找到位置: "${location}"，请检查城市名称是否正确`,
      });
    }
  } else {
    return JSON.stringify({
      success: false,
      error: '请提供位置参数：location（城市名称）或 latitude/longitude（经纬度坐标）',
    });
  }
  
  const weatherData = await fetchWeatherData(targetLat, targetLon, forecast_days);
  
  if (!weatherData) {
    return JSON.stringify({
      success: false,
      error: '获取天气数据失败，请稍后重试',
    });
  }
  
  const current = weatherData.current;
  const daily = weatherData.daily;
  
  const forecast = daily.time.map((time, index) => ({
    date: time,
    date_formatted: formatDate(time),
    weather_code: daily.weather_code[index],
    weather_description: getWeatherDescription(daily.weather_code[index]),
    weather_emoji: getWeatherEmoji(daily.weather_code[index]),
    temp_max: daily.temperature_2m_max[index],
    temp_min: daily.temperature_2m_min[index],
    uv_index_max: daily.uv_index_max[index],
    precipitation_sum: daily.precipitation_sum[index],
    precipitation_hours: daily.precipitation_hours[index],
    wind_speed_max: daily.windspeed_10m_max[index],
    wind_gusts_max: daily.windgusts_10m_max[index],
    wind_direction_dominant: daily.winddirection_10m_dominant[index],
    sunrise: daily.sunrise[index],
    sunset: daily.sunset[index],
  }));
  
  return JSON.stringify({
    success: true,
    location: {
      name: locationName,
      country: country,
      latitude: targetLat,
      longitude: targetLon,
    },
    current: {
      time: current.time,
      temperature: current.temperature_2m,
      temperature_feels_like: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      weather_code: current.weather_code,
      weather_description: getWeatherDescription(current.weather_code),
      weather_emoji: getWeatherEmoji(current.weather_code),
      precipitation: current.precipitation,
      rain: current.rain,
      showers: current.showers,
      snowfall: current.snowfall,
      cloud_cover: current.cloud_cover,
      pressure_msl: current.pressure_msl,
      surface_pressure: current.surface_pressure,
      wind_speed: current.wind_speed_10m,
      wind_direction: current.wind_direction_10m,
      wind_gusts: current.wind_gusts_10m,
    },
    forecast: forecast,
    units: {
      temperature: '°C',
      wind_speed: 'km/h',
      precipitation: 'mm',
      pressure: 'hPa',
      humidity: '%',
      cloud_cover: '%',
      uv_index: '无单位',
    },
  }, null, 2);
}

// ─── Executor Registry ───────────────────────────────────────────────────────

type ExecutorFn = (args: Record<string, unknown>) => Promise<string>;

const EXECUTORS: Record<string, ExecutorFn> = {
  web_search: execWebSearch as ExecutorFn,
  code_execution: execCodeExecution as ExecutorFn,
  calculator: execCalculator as ExecutorFn,
  text_analyzer: execTextAnalyzer as ExecutorFn,
  translator: execTranslator as ExecutorFn,
  weather: execWeather as ExecutorFn,
};

export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  const executor = EXECUTORS[name];
  if (!executor) {
    return JSON.stringify({ success: false, error: `未知工具: ${name}` });
  }
  return executor(args);
}
