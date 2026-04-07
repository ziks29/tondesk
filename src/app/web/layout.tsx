import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'TonDesk — Build autonomous AI agents for Telegram',
  description:
    'Deploy a support agent, QA assistant, or sales bot to Telegram in minutes — no code required.',
};

export default function WebLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
