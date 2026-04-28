const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface JwtPayload {
  userId: string;
  username: string;
  exp?: number;
}

export async function verifyJwtEdge(token: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT token');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const data = `${headerB64}.${payloadB64}`;
  const dataBytes = new TextEncoder().encode(data);

  const signature = base64urlDecode(signatureB64);
  
  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['verify']
  );

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signature as unknown as BufferSource,
    dataBytes as unknown as BufferSource
  );

  if (!isValid) {
    throw new Error('Invalid JWT signature');
  }

  const payload = JSON.parse(base64urlDecodeToString(payloadB64)) as JwtPayload;

  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error('JWT token expired');
  }

  return payload;
}

function base64urlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64urlDecodeToString(str: string): string {
  return new TextDecoder().decode(base64urlDecode(str));
}