import { createHash, randomBytes, timingSafeEqual } from 'crypto';

const TOKEN_BYTES = 32;

export interface SecureToken {
  rawToken: string;
  tokenHash: string;
}

export const generateSecureToken = (): SecureToken => {
  const rawToken = randomBytes(TOKEN_BYTES).toString('hex');
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
};

export const hashToken = (rawToken: string): string =>
  createHash('sha256').update(rawToken).digest('hex');

export const safeCompareTokens = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
};
