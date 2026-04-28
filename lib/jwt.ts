import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: string;
  username: string;
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const { payload } = await jwtVerify<JwtPayload>(token, secret);
  return payload;
}