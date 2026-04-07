# Web Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a polished marketing landing page at `/web` and auto-redirect browser visitors there from `/`.

**Architecture:** Modify `Root.tsx` to use `usePathname()` — if on `/web`, bypass all TMA/TonConnect providers and skip the TMA check. In production, if not on `/web` and `isTMA()` returns false, redirect to `/web`. The `/web` route is a set of static server components with their own nested layout for metadata.

**Tech Stack:** Next.js App Router, Tailwind CSS v4, `@tma.js/sdk-react` (`isTMA`, `usePathname` from `next/navigation`)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/components/Root/Root.tsx` | Add pathname-based TMA bypass + browser redirect |
| Create | `src/app/web/layout.tsx` | Override page metadata for landing page |
| Create | `src/app/web/page.tsx` | Assemble all landing sections |
| Create | `src/app/web/components/Hero.tsx` | Hero headline + CTA |
| Create | `src/app/web/components/UseCases.tsx` | 3 use-case cards |
| Create | `src/app/web/components/Features.tsx` | 4 feature items |
| Create | `src/app/web/components/HowItWorks.tsx` | 3-step how it works |
| Create | `src/app/web/components/CTAFooter.tsx` | Footer CTA + copyright |

---

## Task 1: Modify Root.tsx — pathname bypass + browser redirect

**Files:**
- Modify: `src/components/Root/Root.tsx`

- [ ] **Step 1: Replace Root.tsx with the updated version**

```tsx
'use client';

import { type PropsWithChildren, useEffect, useState } from 'react';
import {
  isTMA,
  initData,
  useSignal,
} from '@tma.js/sdk-react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { usePathname } from 'next/navigation';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorPage } from '@/components/ErrorPage';
import { useDidMount } from '@/hooks/useDidMount';
import { setLocale } from '@/core/i18n/locale';
import { useTheme } from '@/core/theme/provider';

import './styles.css';

function RootInner({ children }: PropsWithChildren) {
  const { isDarkMode } = useTheme();
  const initDataUser = useSignal(initData.user);
  const manifestUrl =
    typeof window === 'undefined'
      ? '/api/tonconnect-manifest'
      : `${window.location.origin}/api/tonconnect-manifest`;

  useEffect(() => {
    initDataUser && setLocale(initDataUser.language_code);
  }, [initDataUser]);

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      actionsConfiguration={{
        modals: 'all',
        notifications: 'all',
        returnStrategy: 'back',
      }}
    >
      <div className={isDarkMode ? 'dark' : ''}>
        {children}
      </div>
    </TonConnectUIProvider>
  );
}

export function Root(props: PropsWithChildren) {
  const didMount = useDidMount();
  const pathname = usePathname();
  const [tmaReady, setTmaReady] = useState(false);

  const isWebPage = pathname?.startsWith('/web');

  useEffect(() => {
    if (isWebPage || process.env.NODE_ENV !== 'production') {
      setTmaReady(true);
      return;
    }
    isTMA('complete').then((result) => {
      if (!result) {
        window.location.replace('/web');
      } else {
        setTmaReady(true);
      }
    });
  }, [isWebPage]);

  // Landing page: render children with no TMA/TonConnect providers
  if (isWebPage) {
    return <>{props.children}</>;
  }

  if (!didMount || !tmaReady) {
    return <div className="root__loading">Loading</div>;
  }

  return (
    <ErrorBoundary fallback={ErrorPage}>
      <RootInner {...props} />
    </ErrorBoundary>
  );
}
```

- [ ] **Step 2: Verify dev server still works**

Run: `pnpm dev`
Open `http://localhost:3000` in browser — should show the app normally (mock env kicks in, no redirect).
Open `http://localhost:3000/web` — should load without crashing (TMA providers bypassed).

- [ ] **Step 3: Commit**

```bash
git add src/components/Root/Root.tsx
git commit -m "feat: bypass TMA providers on /web and redirect browser visitors"
```

---

## Task 2: Create /web nested layout

**Files:**
- Create: `src/app/web/layout.tsx`

- [ ] **Step 1: Create the layout file**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/web/layout.tsx
git commit -m "feat: add /web nested layout with landing page metadata"
```

---

## Task 3: Hero section

**Files:**
- Create: `src/app/web/components/Hero.tsx`

- [ ] **Step 1: Create Hero.tsx**

```tsx
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white px-6 py-24 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-[20%] -top-[30%] h-[60%] w-[60%] rounded-full bg-[#0088cc] opacity-[0.06] blur-[120px]" />
        <div className="absolute -right-[10%] top-[10%] h-[40%] w-[40%] rounded-full bg-[#0088cc] opacity-[0.04] blur-[100px]" />
      </div>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-600">
          Powered by TON &amp; OpenRouter
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
          Build autonomous AI agents.{' '}
          <span className="text-[#0088cc]">Trained on your knowledge.</span>
        </h1>
        <p className="mt-6 text-xl text-slate-500">
          Deploy a support agent, QA assistant, or sales bot to Telegram in minutes — no code required.
        </p>
        <a
          href="https://t.me/tondeskbot/start"
          className="mt-10 inline-flex items-center gap-2 rounded-xl bg-[#0088cc] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[#0077bb] active:scale-95"
        >
          Launch your agent →
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/web/components/Hero.tsx
git commit -m "feat: add landing page Hero section"
```

---

## Task 4: Use cases section

**Files:**
- Create: `src/app/web/components/UseCases.tsx`

- [ ] **Step 1: Create UseCases.tsx**

```tsx
const cases = [
  {
    icon: '🔍',
    title: 'QA Agent',
    description: 'Answer questions from your docs, instantly. Point it at your knowledge base and let it handle the rest.',
  },
  {
    icon: '💬',
    title: 'Support Agent',
    description: 'Handle customer queries 24/7 from your knowledge base — without hiring a single support rep.',
  },
  {
    icon: '💎',
    title: 'Sales Agent',
    description: 'Qualify leads and accept TON payments autonomously. Your agent closes while you sleep.',
  },
] as const;

export function UseCases() {
  return (
    <section className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">
          What will you build?
        </h2>
        <p className="mb-12 text-center text-slate-500">
          One platform. Any use case. Your knowledge base.
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {cases.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-4 text-4xl">{c.icon}</div>
              <h3 className="mb-2 text-xl font-semibold text-slate-900">{c.title}</h3>
              <p className="text-slate-500">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/web/components/UseCases.tsx
git commit -m "feat: add landing page UseCases section"
```

---

## Task 5: Features section

**Files:**
- Create: `src/app/web/components/Features.tsx`

- [ ] **Step 1: Create Features.tsx**

```tsx
const features = [
  {
    icon: '📚',
    title: 'Any knowledge source',
    description: 'Upload text, crawl URLs, or parse PDFs and DOCX files. Your agent learns from all of it.',
  },
  {
    icon: '🤖',
    title: 'Any AI model',
    description: 'Gemini, GPT-4o, Claude, and more via OpenRouter. Pick the model that fits your budget.',
  },
  {
    icon: '💎',
    title: 'TON crypto payments',
    description: 'Built-in payment links sent automatically when your agent detects purchase intent.',
  },
  {
    icon: '🌐',
    title: 'Web search',
    description: 'Optional real-time lookup alongside your knowledge base for up-to-date answers.',
  },
] as const;

export function Features() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
          Everything you need. Nothing you don&apos;t.
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-6"
            >
              <span className="text-3xl">{f.icon}</span>
              <div>
                <h3 className="mb-1 font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/web/components/Features.tsx
git commit -m "feat: add landing page Features section"
```

---

## Task 6: How it works section

**Files:**
- Create: `src/app/web/components/HowItWorks.tsx`

- [ ] **Step 1: Create HowItWorks.tsx**

```tsx
const steps = [
  {
    number: '01',
    title: 'Get a bot token',
    description: 'Create a bot via @BotFather on Telegram and copy your token.',
  },
  {
    number: '02',
    title: 'Upload your knowledge base',
    description: 'Add text, crawl URLs, or upload PDFs and DOCX files as your agent\'s knowledge.',
  },
  {
    number: '03',
    title: 'Your agent is live',
    description: 'Deploy in one click. Your bot starts answering questions instantly.',
  },
] as const;

export function HowItWorks() {
  return (
    <section className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
          Live in three steps
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="relative text-center">
              {index < steps.length - 1 && (
                <div className="absolute left-[calc(50%+28px)] top-7 hidden h-0.5 w-[calc(100%-56px)] bg-slate-200 sm:block" />
              )}
              <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#0088cc] text-xl font-bold text-white">
                {step.number}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/web/components/HowItWorks.tsx
git commit -m "feat: add landing page HowItWorks section"
```

---

## Task 7: CTA footer section

**Files:**
- Create: `src/app/web/components/CTAFooter.tsx`

- [ ] **Step 1: Create CTAFooter.tsx**

```tsx
export function CTAFooter() {
  return (
    <section className="bg-white px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-4 text-3xl font-bold text-slate-900">
          Your agent. Your knowledge. On Telegram.
        </h2>
        <p className="mb-10 text-lg text-slate-500">
          Start for free. No credit card. No code.
        </p>
        <a
          href="https://t.me/tondeskbot/start"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0088cc] px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-[#0077bb] active:scale-95"
        >
          Launch for free →
        </a>
        <p className="mt-16 text-sm text-slate-400">© 2026 TonDesk</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/web/components/CTAFooter.tsx
git commit -m "feat: add landing page CTAFooter section"
```

---

## Task 8: Assemble the landing page

**Files:**
- Create: `src/app/web/page.tsx`

- [ ] **Step 1: Create page.tsx**

```tsx
import { CTAFooter } from './components/CTAFooter';
import { Features } from './components/Features';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { UseCases } from './components/UseCases';

export default function WebPage() {
  return (
    <main>
      <Hero />
      <UseCases />
      <Features />
      <HowItWorks />
      <CTAFooter />
    </main>
  );
}
```

- [ ] **Step 2: Verify in browser**

Run: `pnpm dev`
Open `http://localhost:3000/web` — should display the full landing page with all 5 sections, light background, Telegram blue accents, and working CTA links to `https://t.me/tondeskbot/start`.

- [ ] **Step 3: Commit**

```bash
git add src/app/web/page.tsx
git commit -m "feat: assemble /web landing page"
```
