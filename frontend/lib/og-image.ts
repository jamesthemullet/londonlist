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
