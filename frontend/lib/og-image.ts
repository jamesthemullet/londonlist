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

export function ogTitleFontSize(title: string): number {
  return title.length > 50 ? 52 : title.length > 30 ? 62 : 72;
}

export function buildOgMeta(itemCount: number, doneCount: number): string {
  if (itemCount <= 0) return '';
  const placeWord = itemCount === 1 ? 'place' : 'places';
  const visited = doneCount > 0 ? ` · ${doneCount} visited` : '';
  return `${itemCount} ${placeWord}${visited}`;
}
