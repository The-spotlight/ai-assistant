import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface JwtPayload {
  userId: string;
  username: string;
  exp?: number;
}

export async function verifyJwtEdge(token: string): Promise<JwtPayload> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const { payload } = await jose.jwtVerify(token, secret, {
    algorithms: ['HS256'],
  });
  return payload as unknown as JwtPayload;
}