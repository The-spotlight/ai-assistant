import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: string;
  username: string;
  [key: string]: unknown;
}

export async function signJwt(payload: JwtPayload): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const { payload } = await jose.jwtVerify(token, secret, {
    algorithms: ['HS256'],
  });
  return payload as JwtPayload;
}

export async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/auth_token=([^;]+)/);
  if (!match) return null;

  try {
    const payload = await verifyJwt(match[1]);
    return payload.userId;
  } catch {
    return null;
  }
}