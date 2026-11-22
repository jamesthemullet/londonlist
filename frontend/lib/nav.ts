import type { ParsedUrlQuery } from 'node:querystring';

export function getSafeNext(query: ParsedUrlQuery): string | null {
  const next = query.next;
  if (typeof next !== 'string') return null;
  if (!next.startsWith('/') || next.startsWith('//')) return null;
  // Browsers drop tabs and newlines and read '\' as '/', so '/<tab>/host' would leave the site.
  if (/[\p{Cc}\\]/u.test(next)) return null;
  return next;
}
