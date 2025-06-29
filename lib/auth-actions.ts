'use server';

import { getUserInfo } from './auth';

export async function getCurrentUser() {
  try {
    return await getUserInfo();
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}