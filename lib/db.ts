import { PrismaD1 } from '@prisma/adapter-d1';
import { PrismaClient } from './generated/prisma';
import { getRequestContext } from '@cloudflare/next-on-pages';

declare global {
  var __prisma: PrismaClient | undefined
}

export function getPrismaClient() {
  if (typeof globalThis !== 'undefined' && globalThis.__prisma) {
    return globalThis.__prisma
  }

  const env = getRequestContext().env;
  const adapter = new PrismaD1(env.DB)
  const prisma = new PrismaClient({ adapter });

  if (typeof globalThis !== 'undefined') {
    globalThis.__prisma = prisma
  }

  return prisma
} 