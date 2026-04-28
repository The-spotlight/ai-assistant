const STORAGE_KEY = 'ai_assistant_remember_me';

async function generateKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'fallback-secret-key-must-be-32-chars'),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  return keyMaterial;
}

async function encryptData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await generateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = encoder.encode(data);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const cipherHex = Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${ivHex}:${cipherHex}`;
}

async function decryptData(encrypted: string): Promise<string> {
  const decoder = new TextDecoder();
  const key = await generateKey();
  const [ivHex, cipherHex] = encrypted.split(':');
  
  if (!ivHex || !cipherHex) {
    throw new Error('Invalid encrypted data');
  }
  
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(h => parseInt(h, 16)));
  const ciphertext = new Uint8Array(cipherHex.match(/.{1,2}/g)!.map(h => parseInt(h, 16)));
  
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  
  return decoder.decode(plaintext);
}

export async function saveRememberMeToken(refreshToken: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const encrypted = await encryptData(refreshToken);
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.error('Failed to save remember me token:', error);
  }
}

export async function getRememberMeToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return null;
    
    const decrypted = await decryptData(encrypted);
    return decrypted;
  } catch (error) {
    console.error('Failed to get remember me token:', error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearRememberMeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function hasRememberMeToken(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}