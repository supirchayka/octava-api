// src/utils/crypto.ts
import { randomBytes, createHash } from 'node:crypto';

export function generateRandomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
