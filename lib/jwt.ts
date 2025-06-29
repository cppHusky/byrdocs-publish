import { SignJWT, jwtVerify } from 'jose';
import { getRequestContext } from '@cloudflare/next-on-pages';

export interface JWTPayload {
  id: string;
  sub: string; // Database User main key (id)
  github_id: string; // GitHub user ID
  username: string;
  iat: number;
}

export async function generateJWT(databaseUserId: number, githubUserId: string, username: string): Promise<string> {
  const env = getRequestContext().env;
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  
  const jwt = await new SignJWT({
    id: `GitHub-${githubUserId}`,
    sub: databaseUserId.toString(), // Database User main key (id)
    github_id: githubUserId, // GitHub user ID
    username: username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .sign(secret);
  
  return jwt;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const env = getRequestContext().env;
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    
    const { payload } = await jwtVerify(token, secret);
    
    // Validate that the payload has the expected properties
    if (payload && 
        typeof payload.id === 'string' &&
        typeof payload.sub === 'string' &&
        typeof payload.github_id === 'string' &&
        typeof payload.username === 'string' &&
        typeof payload.iat === 'number') {
      return payload as unknown as JWTPayload;
    }
    
    throw new Error('Invalid JWT payload structure');
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}