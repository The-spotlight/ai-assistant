'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

export const SPEECH_RATE_OPTIONS = {
  0.5: { name: '0.5 倍', value: 0.5 },
  0.75: { name: '0.75 倍', value: 0.75 },
  1.0: { name: '1.0 倍', value: 1.0 },
  1.25: { name: '1.25 倍', value: 1.25 },
  1.5: { name: '1.5 倍', value: 1.5 },
} as const;

export type SpeechRateKey = keyof typeof SPEECH_RATE_OPTIONS;

export interface SpeechVoice {
  name: string;
  lang: string;
  voiceURI: string;
  default?: boolean;
}

export interface SpeechSettings {
  voiceURI: string | null;
  rate: SpeechRateKey;
}

const SPEECH_SETTINGS_STORAGE_KEY = 'ai-assistant-speech-settings';

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  voiceURI: null,
  rate: 1.0,
};

export function loadSpeechSettings(): SpeechSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SPEECH_SETTINGS;
  }

  try {
    const stored = localStorage.getItem(SPEECH_SETTINGS_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SPEECH_SETTINGS;
    }

    const parsed = JSON.parse(stored) as Partial<SpeechSettings>;
    
    const rate = (parsed.rate !== undefined && parsed.rate in SPEECH_RATE_OPTIONS)
      ? parsed.rate as SpeechRateKey
      : DEFAULT_SPEECH_SETTINGS.rate;

    return {
      voiceURI: typeof parsed.voiceURI === 'string' ? parsed.voiceURI : DEFAULT_SPEECH_SETTINGS.voiceURI,
      rate,
    };
  } catch {
    return DEFAULT_SPEECH_SETTINGS;
  }
}

export function saveSpeechSettings(settings: SpeechSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SPEECH_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    console.warn('Failed to save speech settings');
  }
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

export function getVoiceByURI(voiceURI: string): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  return voices.find(v => v.voiceURI === voiceURI) || null;
}

export function getRecommendedVoices(): SpeechVoice[] {
  const voices = getAvailableVoices();
  if (voices.length === 0) return [];

  const result: SpeechVoice[] = [];
  const addedVoiceURIs = new Set<string>();

  const addVoice = (voice: SpeechSynthesisVoice, displayName: string) => {
    if (!addedVoiceURIs.has(voice.voiceURI)) {
      addedVoiceURIs.add(voice.voiceURI);
      result.push({
        name: displayName,
        lang: voice.lang,
        voiceURI: voice.voiceURI,
        default: voice.default,
      });
    }
  };

  const zhCNVoices = voices.filter(v => v.lang.startsWith('zh-CN'));
  const zhHKVoices = voices.filter(v => v.lang.startsWith('zh-HK') || v.lang.startsWith('zh-TW'));
  const enUSVoices = voices.filter(v => v.lang.startsWith('en-US'));
  const enGBVoices = voices.filter(v => v.lang.startsWith('en-GB'));

  const defaultVoice = voices.find(v => v.default);

  if (zhCNVoices.length > 0) {
    const maleVoice = zhCNVoices.find(v => 
      v.name.toLowerCase().includes('male') || 
      v.name.includes('男') ||
      v.name.includes('Xiaoxiao') === false && (
        v.name.includes('Yunxi') || 
        v.name.includes('Yunyang') ||
        v.name.includes('Xiaoyi') === false && v.name.includes('Xiao') === false
      )
    );

    const femaleVoice = zhCNVoices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.includes('女') ||
      v.name.includes('Xiaoxiao') ||
      v.name.includes('Xiaoyi')
    ) || zhCNVoices.find(v => !maleVoice || v.voiceURI !== maleVoice.voiceURI);

    if (maleVoice) {
      addVoice(maleVoice, '中文男声');
    }
    if (femaleVoice) {
      addVoice(femaleVoice, '中文女声');
    }

    if (!maleVoice && !femaleVoice && zhCNVoices[0]) {
      addVoice(zhCNVoices[0], '中文');
    }
  }

  if (zhHKVoices.length > 0) {
    addVoice(zhHKVoices[0], '粤语');
  }

  const englishVoices = [...enUSVoices, ...enGBVoices];
  if (englishVoices.length > 0) {
    const femaleEnglish = englishVoices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.includes('Samantha') ||
      v.name.includes('Victoria') ||
      v.name.includes('Tessa')
    ) || englishVoices[0];
    addVoice(femaleEnglish, '英文女声');
  }

  if (result.length === 0 && defaultVoice) {
    addVoice(defaultVoice, '默认语音');
  }

  if (result.length === 0 && voices.length > 0) {
    addVoice(voices[0], voices[0].name);
  }

  return result;
}

interface SpeechContextType {
  isPlaying: boolean;
  isPaused: boolean;
  currentMessageId: string | null;
  currentCharIndex: number;
  speechSettings: SpeechSettings;
  availableVoices: SpeechVoice[];
  updateSpeechSettings: <K extends keyof SpeechSettings>(key: K, value: SpeechSettings[K]) => void;
  speak: (messageId: string, text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

const SpeechContext = createContext<SpeechContextType | null>(null);

export function SpeechProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [speechSettings, setSpeechSettings] = useState<SpeechSettings>(() => {
    if (typeof window !== 'undefined') {
      return loadSpeechSettings();
    }
    return DEFAULT_SPEECH_SETTINGS;
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechVoice[]>([]);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const charIndexRef = useRef(0);
  const textRef = useRef('');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = getRecommendedVoices();
      setAvailableVoices(voices);
      
      if (voices.length > 0 && !speechSettings.voiceURI) {
        const defaultVoice = voices.find(v => v.default) || voices[0];
        if (defaultVoice) {
          updateSpeechSettings('voiceURI', defaultVoice.voiceURI);
        }
      }
    };

    loadVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const updateSpeechSettings = useCallback(<K extends keyof SpeechSettings>(
    key: K,
    value: SpeechSettings[K]
  ) => {
    setSpeechSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      saveSpeechSettings(newSettings);
      return newSettings;
    });
  }, []);

  const speak = useCallback((messageId: string, text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    if (utteranceRef.current) {
      utteranceRef.current.onboundary = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }

    setCurrentMessageId(messageId);
    setCurrentCharIndex(0);
    setIsPlaying(true);
    setIsPaused(false);
    charIndexRef.current = 0;
    textRef.current = text;

    const plainText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^[#*>\-]+\s*/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!plainText) {
      setIsPlaying(false);
      setCurrentMessageId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(plainText);
    
    if (speechSettings.voiceURI) {
      const voice = getVoiceByURI(speechSettings.voiceURI);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.rate = speechSettings.rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        charIndexRef.current = charIndex;
        setCurrentCharIndex(charIndex);
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentMessageId(null);
      setCurrentCharIndex(0);
      charIndexRef.current = 0;
      utteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentMessageId(null);
      setCurrentCharIndex(0);
      charIndexRef.current = 0;
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [speechSettings]);

  const pause = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPlaying, isPaused]);

  const resume = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (isPlaying && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPlaying, isPaused]);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentMessageId(null);
    setCurrentCharIndex(0);
    charIndexRef.current = 0;
    utteranceRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <SpeechContext.Provider
      value={{
        isPlaying,
        isPaused,
        currentMessageId,
        currentCharIndex,
        speechSettings,
        availableVoices,
        updateSpeechSettings,
        speak,
        pause,
        resume,
        stop,
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeech() {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error('useSpeech must be used within a SpeechProvider');
  }
  return context;
}
