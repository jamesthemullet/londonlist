import type { ParsedUrlQuery } from 'node:querystring';

export function getSafeNext(query: ParsedUrlQuery): string | null {
  const next = query.next;
  if (typeof next !== 'string') return null;
  if (!next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}
