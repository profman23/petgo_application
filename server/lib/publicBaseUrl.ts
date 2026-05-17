import type { Request } from 'express';

/**
 * Returns the public base URL (origin) for building callback/redirect URLs
 * that external services (e.g. MyFatoorah, email links) need to point back to.
 *
 * Priority:
 *   1. PUBLIC_BASE_URL env var (e.g. "https://petgo-staging.onrender.com")
 *   2. From request headers (req.protocol + req.get('host')) if req is provided
 *   3. Legacy REPLIT_DOMAINS (first domain, prefixed with https://)
 *   4. Legacy REPLIT_DEV_DOMAIN (prefixed with https://)
 *   5. Final dev fallback: http://localhost:5000
 *
 * Always returns origin WITHOUT trailing slash, with scheme included.
 */
export function getPublicBaseUrl(req?: Request): string {
  // 1. Explicit env var (preferred — used in Render staging/production)
  const envBase = process.env.PUBLIC_BASE_URL?.trim();
  if (envBase) {
    // Strip trailing slash, ensure scheme is present (add https:// if missing).
    const cleaned = envBase.replace(/\/$/, '');
    if (/^https?:\/\//i.test(cleaned)) return cleaned;
    return `https://${cleaned}`;
  }

  // 2. From request (when available — Render sets x-forwarded-proto)
  if (req) {
    const host = req.get?.('host');
    if (host) {
      const forwardedProto =
        (req.headers?.['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim();
      const protocol = forwardedProto || req.protocol || 'http';
      return `${protocol}://${host}`;
    }
  }

  // 3. Legacy Replit env vars (backwards compat)
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const first = replitDomains.split(',').map((d) => d.trim()).filter(Boolean)[0];
    if (first) return `https://${first}`;
  }
  const replitDevDomain = process.env.REPLIT_DEV_DOMAIN;
  if (replitDevDomain) return `https://${replitDevDomain}`;

  // 4. Final dev fallback
  return 'http://localhost:5000';
}
