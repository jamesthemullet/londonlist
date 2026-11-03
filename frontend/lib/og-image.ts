export type OgImageParams = {
  title: string;
  username?: string;
  itemCount?: number;
  doneCount?: number;
};

export function buildOgImageUrl(params: OgImageParams, siteUrl: string): string {
  const { title, username, itemCount, doneCount } = params;
  const qs = new URLSearchParams({ title });
  if (username) qs.set('u', username);
  if (itemCount !== undefined) qs.set('n', String(itemCount));
  if (doneCount !== undefined) qs.set('d', String(doneCount));
  return `${siteUrl}/api/og?${qs.toString()}`;
}

export function truncateOgTitle(title: string, maxLength = 80): string {
  return title.slice(0, maxLength);
}

export function formatOgPlacesMeta(itemCount: number, doneCount: number): string {
  if (itemCount <= 0) return '';
  const places = `${itemCount} ${itemCount === 1 ? 'place' : 'places'}`;
  return doneCount > 0 ? `${places} · ${doneCount} visited` : places;
}

export function fontSizeForOgTitle(title: string): number {
  if (title.length > 50) return 52;
  if (title.length > 30) return 62;
  return 72;
}
