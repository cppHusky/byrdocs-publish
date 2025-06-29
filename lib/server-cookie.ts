'use server';

import { cookies } from 'next/headers';

// Server-side cookie functions
export const getServerCookie = async (name: string): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value || null;
};

export const setServerCookie = async (
  name: string, 
  value: string, 
  options?: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  }
): Promise<void> => {
  const cookieStore = await cookies();
  
  cookieStore.set(name, value, {
    path: '/',
    maxAge: options?.maxAge || 365 * 24 * 60 * 60, // Default to 1 year
    httpOnly: options?.httpOnly ?? true,
    secure: options?.secure ?? true,
    sameSite: options?.sameSite || 'strict'
  });
};

export const deleteServerCookie = async (name: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(name);
};