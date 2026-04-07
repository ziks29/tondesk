import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'TonDesk — Build autonomous AI agents for Telegram',
  description:
    'Deploy a support agent, QA assistant, or sales bot to Telegram in minutes — no code required.',
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
