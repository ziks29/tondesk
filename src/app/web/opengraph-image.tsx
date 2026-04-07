import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'TonDesk — Build autonomous AI agents for Telegram';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: 'white',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <span
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: '#0f172a',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          Build autonomous AI agents.
        </span>
        <span
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: '#0088cc',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          Trained on your knowledge.
        </span>
      </div>
      <span
        style={{
          fontSize: 24,
          color: '#64748b',
          textAlign: 'center',
          maxWidth: 800,
          marginBottom: 48,
        }}
      >
        Deploy a support agent, QA assistant, or sales bot to Telegram in minutes — no code required.
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#0088cc',
          color: 'white',
          borderRadius: 16,
          padding: '16px 36px',
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        TonDesk
      </div>
    </div>,
    { ...size },
  );
}
