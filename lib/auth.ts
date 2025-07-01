import { redirect } from 'next/navigation';
import { getServerCookie } from './server-cookie';
import { verifyJWT, JWTPayload } from './jwt';

export interface UserInfo {
  id: string; // reserved for other auth providers, not used in this project
  sub: string; // Database User main key (id)
  github_id: string; // GitHub user ID
  username: string;
}

export async function getTokenFromCookie(): Promise<string | null> {
  return await getServerCookie('token');
}

export async function getUserInfo(): Promise<UserInfo | null> {
  const token = await getTokenFromCookie();
  
  if (!token) {
    return null;
  }

  const payload = await verifyJWT(token);
  
  if (!payload) {
    return null;
  }
  
  return {
    id: payload.id,
    sub: payload.sub,
    github_id: payload.github_id,
    username: payload.username,
  };
}

export async function requireAuth(currentPath?: string): Promise<UserInfo> {
  const userInfo = await getUserInfo();
  
  if (!userInfo) {
    const redirectTo = currentPath ? `?to=${encodeURIComponent(currentPath)}` : '';
    redirect(`/login${redirectTo}`);
  }
  
  return userInfo;
}

export async function isAuthenticated(): Promise<boolean> {
  const userInfo = await getUserInfo();
  return userInfo !== null;
}