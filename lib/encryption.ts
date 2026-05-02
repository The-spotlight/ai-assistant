'use client';

const ENCRYPTION_KEY = 'ai-assistant-encryption-key';
const ENCRYPTED_CONVERSATIONS_KEY = 'ai-assistant-encrypted-conversations';
const DECRYPTED_CONVERSATIONS_KEY = 'ai-assistant-decrypted-conversations';

export interface EncryptedConversation {
  id: string;
  passwordHash: string;
  salt: string;
  originalTitle: string | null;
  encryptedAt: string;
}

export interface DecryptedSession {
  conversationId: string;
  expiresAt: number;
}

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(data: string, password: string): Promise<string> {
  const salt = generateSalt();
  const key = await deriveKey(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  const base64 = btoa(String.fromCharCode(...combined));
  return `${salt}:${base64}`;
}

export async function decryptData(encrypted: string, password: string): Promise<string> {
  const [salt, base64] = encrypted.split(':');
  const key = await deriveKey(password, salt);
  const combined = new Uint8Array(
    atob(base64)
      .split('')
      .map((c) => c.charCodeAt(0))
  );

  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

export function loadEncryptedConversations(): EncryptedConversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(ENCRYPTED_CONVERSATIONS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as EncryptedConversation[];
  } catch {
    return [];
  }
}

export function saveEncryptedConversations(conversations: EncryptedConversation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ENCRYPTED_CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('保存加密对话列表失败:', error);
  }
}

export function isConversationEncrypted(conversationId: string): boolean {
  const encrypted = loadEncryptedConversations();
  return encrypted.some((c) => c.id === conversationId);
}

export function getEncryptedConversation(
  conversationId: string
): EncryptedConversation | undefined {
  const encrypted = loadEncryptedConversations();
  return encrypted.find((c) => c.id === conversationId);
}

export async function encryptConversation(
  conversationId: string,
  password: string,
  originalTitle: string | null
): Promise<boolean> {
  try {
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    const encrypted: EncryptedConversation = {
      id: conversationId,
      passwordHash,
      salt,
      originalTitle,
      encryptedAt: new Date().toISOString(),
    };

    const conversations = loadEncryptedConversations();
    const existingIndex = conversations.findIndex((c) => c.id === conversationId);

    if (existingIndex >= 0) {
      conversations[existingIndex] = encrypted;
    } else {
      conversations.push(encrypted);
    }

    saveEncryptedConversations(conversations);
    return true;
  } catch (error) {
    console.error('加密对话失败:', error);
    return false;
  }
}

export async function verifyPassword(
  conversationId: string,
  password: string
): Promise<boolean> {
  const encrypted = getEncryptedConversation(conversationId);
  if (!encrypted) return false;

  try {
    const hash = await hashPassword(password, encrypted.salt);
    return hash === encrypted.passwordHash;
  } catch {
    return false;
  }
}

export async function decryptConversation(
  conversationId: string,
  password: string
): Promise<boolean> {
  const isValid = await verifyPassword(conversationId, password);
  if (isValid) {
    setDecryptedSession(conversationId);
    return true;
  }
  return false;
}

export async function removeEncryption(
  conversationId: string,
  password: string
): Promise<boolean> {
  const isValid = await verifyPassword(conversationId, password);
  if (isValid) {
    const conversations = loadEncryptedConversations();
    const filtered = conversations.filter((c) => c.id !== conversationId);
    saveEncryptedConversations(filtered);
    clearDecryptedSession(conversationId);
    return true;
  }
  return false;
}

export function setDecryptedSession(conversationId: string, durationMinutes: number = 30): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = loadDecryptedSessions();
    const now = Date.now();
    const expiresAt = now + durationMinutes * 60 * 1000;

    const existingIndex = sessions.findIndex((s) => s.conversationId === conversationId);
    if (existingIndex >= 0) {
      sessions[existingIndex].expiresAt = expiresAt;
    } else {
      sessions.push({ conversationId, expiresAt });
    }

    localStorage.setItem(DECRYPTED_CONVERSATIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('设置解密会话失败:', error);
  }
}

export function loadDecryptedSessions(): DecryptedSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(DECRYPTED_CONVERSATIONS_KEY);
    if (!stored) return [];
    const sessions = JSON.parse(stored) as DecryptedSession[];
    const now = Date.now();
    return sessions.filter((s) => s.expiresAt > now);
  } catch {
    return [];
  }
}

export function isConversationDecrypted(conversationId: string): boolean {
  const sessions = loadDecryptedSessions();
  return sessions.some((s) => s.conversationId === conversationId);
}

export function clearDecryptedSession(conversationId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = loadDecryptedSessions();
    const filtered = sessions.filter((s) => s.conversationId !== conversationId);
    localStorage.setItem(DECRYPTED_CONVERSATIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('清除解密会话失败:', error);
  }
}
