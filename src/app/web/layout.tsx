import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tondesk.n9xo.xyz';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'TonDesk — Build autonomous AI agents for Telegram',
  description:
    'Deploy a support agent, QA assistant, or sales bot to Telegram in minutes — no code required.',
  alternates: {
    canonical: '/web',
  },
  openGraph: {
    title: 'TonDesk — Build autonomous AI agents for Telegram',
    description:
      'Deploy a support agent, QA assistant, or sales bot to Telegram in minutes — no code required.',
    url: `${APP_URL}/web`,
    siteName: 'TonDesk',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TonDesk — Build autonomous AI agents for Telegram',
    description:
      'Deploy a support agent, QA assistant, or sales bot to Telegram in minutes — no code required.',
  },
};

export default function WebLayout({ children }: PropsWithChildren) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-[#0088cc] focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      {children}
    </>
  );
}
