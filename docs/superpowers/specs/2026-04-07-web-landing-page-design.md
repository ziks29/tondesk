# TonDesk Web Landing Page — Design Spec

**Date:** 2026-04-07  
**Status:** Approved

---

## Overview

Add a polished marketing landing page at `/web` for users who open TonDesk in a regular browser. When the app is accessed outside Telegram in production, users are automatically redirected to `/web`. The landing page markets TonDesk as an autonomous AI agent builder and links directly to the Telegram Mini App.

---

## Architecture

### Redirect Logic

**File:** `src/components/Root/Root.tsx`

After `didMount`, call `isTMA('complete')` from `@tma.js/sdk-react`. If it resolves to `false` and `process.env.NODE_ENV === 'production'`, call `window.location.replace('/web')`. In development, `mockEnv()` already simulates TMA context so the redirect never fires.

```
didMount → isTMA('complete') → false + production → window.location.replace('/web')
                             → true  (or dev)     → render app normally
```

### Landing Page Layout

**File:** `src/app/web/layout.tsx`

A minimal standalone layout. Does **not** include `Root`, `ThemeProvider`, `I18nProvider`, TMA providers, or TonConnect providers. Imports `globals.css` only. Renders children directly. This completely isolates `/web` from all Telegram dependencies.

### Route Structure

```
src/app/web/
  layout.tsx          — minimal layout, no TMA/TonConnect
  page.tsx            — server component, composes all sections
  components/
    Hero.tsx
    UseCases.tsx
    Features.tsx
    HowItWorks.tsx
    CTAFooter.tsx
```

---

## Visual Style

- **Mode:** Light-first. No dark mode toggle (marketing page, not app).
- **Background:** White (`#ffffff`) with subtle light gray section breaks (`#f8fafc`).
- **Accent color:** Telegram blue `#0088cc`.
- **Typography:** System font stack, large bold headings, generous spacing.
- **Decorative:** Subtle blue gradient blob in hero background (matching existing app aesthetic).
- **CTA buttons:** Solid Telegram blue, white text, rounded-lg.

---

## Content Sections

### 1. Hero

- **Headline:** "Build autonomous AI agents. Trained on your knowledge."
- **Sub-copy:** "Deploy a support agent, QA assistant, or sales bot to Telegram in minutes — no code required."
- **CTA button:** "Launch your agent →" → `https://t.me/tondeskbot/start`
- Subtle blue gradient blob background decoration.

### 2. Use Cases (3 cards)

- **QA Agent** — "Answer questions from your docs, instantly."
- **Support Agent** — "Handle customer queries 24/7 from your knowledge base."
- **Sales Agent** — "Qualify leads and accept TON payments autonomously."

Cards arranged in a horizontal row (3-col grid on desktop, stacked on mobile).

### 3. Features (4 icon + text items)

- Any knowledge source — text, URLs, PDFs, DOCX
- Any AI model — Gemini, GPT-4o, Claude, and more via OpenRouter
- TON crypto payments — built-in pay links, no extra setup
- Web search — optional real-time lookup alongside your KB

Displayed as a 2×2 grid on desktop, single column on mobile.

### 4. How It Works (3 numbered steps)

1. Get a bot token from @BotFather
2. Upload your knowledge base
3. Your agent is live

Horizontal step layout on desktop, vertical on mobile.

### 5. CTA Footer

- **Tagline:** "Your agent. Your knowledge. On Telegram."
- **Button:** "Launch for free →" → `https://t.me/tondeskbot/start`
- App name + minimal copyright.

---

## Key Constraints

- `/web` layout must not import anything from `@tma.js/sdk-react` or `@tonconnect/ui-react`.
- Redirect only fires in `production`. Dev mode is unaffected.
- The landing page is entirely static (no API calls, no client-side state).
- All sections are server components (no `"use client"`).
- Telegram link is hardcoded: `https://t.me/tondeskbot/start`.

---

## Out of Scope

- Dark mode for landing page
- i18n / localization for landing page
- Analytics or tracking
- Any form or email capture
