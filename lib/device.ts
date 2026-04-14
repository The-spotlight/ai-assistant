/** 单浏览器维度：设备 ID 存 localStorage */

export const DEVICE_STORAGE_KEY = 'ai-assistant-device-id';
export const CONVERSATION_STORAGE_KEY = 'ai-assistant-current-conversation-id';

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return '';
  }
}
