'use server';

import { redirect } from 'next/navigation';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getPrismaClient } from '@/lib/db';
import { generateJWT } from '@/lib/jwt';
import { setServerCookie, getServerCookie, deleteServerCookie } from '@/lib/server-cookie';

interface GitHubUser {
  id: number;
  login: string;
}

async function exchangeCodeForToken(code: string): Promise<{ access_token: string }> {
  const env = getRequestContext().env;
  const origin = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://publish.byrdocs.org';
  
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: `${origin}/callback/github`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code for token: ${response.statusText}`);
  }

  return response.json();
}

async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get GitHub user: ${response.statusText}`);
  }

  return response.json();
}

export async function handleGitHubCallback(code: string) {
  'use server';
  
  try {
    // Exchange code for access token
    const { access_token } = await exchangeCodeForToken(code);
    
    // Get GitHub user info
    const githubUser = await getGitHubUser(access_token);
    
    // Save or update user in database
    const prisma = getPrismaClient();
    const user = await prisma.user.upsert({
      where: {
        githubUserId: githubUser.id.toString(),
      },
      update: {
        username: githubUser.login,
        accessToken: access_token,
      },
      create: {
        githubUserId: githubUser.id.toString(),
        username: githubUser.login,
        accessToken: access_token,
      },
    });
    
    // Generate JWT
    const jwt = await generateJWT(user.id, githubUser.id.toString(), githubUser.login);
    
    // Set cookie
    await setServerCookie('token', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    // Check if there's a redirect URL stored
    const redirectUrl = await getServerCookie('redirect_after_login') || '/';
    
    // Clear the redirect cookie
    await setServerCookie('redirect_after_login', '', {
      maxAge: 0,
    });

    return redirectUrl;
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    throw error;
  }
}