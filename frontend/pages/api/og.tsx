import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get('title') ?? 'My London List').slice(0, 80);
  const username = searchParams.get('u') ?? '';
  const itemCount = Number(searchParams.get('n') ?? '0');
  const doneCount = Number(searchParams.get('d') ?? '0');

  const meta =
    itemCount > 0
      ? `${itemCount} ${itemCount === 1 ? 'place' : 'places'}${doneCount > 0 ? ` · ${doneCount} visited` : ''}`
      : '';

  const fontSize = title.length > 50 ? 52 : title.length > 30 ? 62 : 72;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
          padding: '60px 70px',
          fontFamily: 'Georgia, serif',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            opacity: 0.55,
            marginBottom: 'auto',
            letterSpacing: '0.04em',
          }}
        >
          London List
        </div>
        <div
          style={{
            fontSize,
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 20,
            maxWidth: 960,
          }}
        >
          {title}
        </div>
        {username && (
          <div style={{ fontSize: 26, opacity: 0.65, marginBottom: 16 }}>
            by {username}
          </div>
        )}
        {meta && (
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              opacity: 0.6,
              background: 'rgba(255,255,255,0.08)',
              padding: '10px 18px',
              borderRadius: 8,
            }}
          >
            {meta}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
