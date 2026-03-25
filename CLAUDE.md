# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start dev server (no Telegram context)
pnpm dev:https        # Start dev server with self-signed SSL (required for Telegram Mini App testing)
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm prisma:generate  # Regenerate Prisma client after schema changes
pnpm prisma:migrate   # Apply new migrations to the database
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` — SQLite file path (default: `file:./prisma/dev.db`)
- `OPENROUTER_API_KEY` — API key for AI inference via OpenRouter
- `NEXT_PUBLIC_MASTER_WALLET_ADDRESS` — TON wallet that receives deployment payments
- `NEXT_PUBLIC_APP_URL` — Public HTTPS URL for webhook registration (required in production; use ngrok/tunnel in dev)
- `TELEGRAM_BOT_TOKEN` — Platform bot token used to validate TMA `initData` on the server

## Architecture

TonDesk is a **Telegram Mini App** where users deploy RAG-powered Telegram bots using their own knowledge base, paying via TON Connect.

### Request / Auth Flow

1. The Mini App runs inside Telegram. The client sends `Authorization: tma <initData>` on all API calls.
2. `src/lib/auth.ts` validates `initData` against `TELEGRAM_BOT_TOKEN` to authenticate requests.
3. After validation, the deploy route calls the Telegram Bot API, sets a webhook, and persists the bot in SQLite.

### Bot Configuration

Each bot can be configured with:

- **botToken** — Telegram bot token (unique identifier)
- **ownerWallet** — TON wallet address that owns the bot
- **knowledgeBaseText** — Combined text from all knowledge sources (manual text, crawled URLs, parsed files)
- **aiModel** — AI model to use (default: `google/gemini-2.0-flash-001`)
- **systemPrompt** — Custom system prompt (optional; default: "You are a strict Telegram support agent")
- **welcomeMessage** — Optional welcome message (currently sent when bot is active)
- **webSearchEnabled** — Enable/disable web search via OpenRouter plugins

### Web Search Implementation

Web search is supported via OpenRouter's web plugin (`plugins: [{ id: 'web' }]`), but currently **disabled by system prompt**. The webhook always instructs the model:

```
"Use ONLY the provided knowledge base to answer."
"If answer is not present in the KB, reply exactly: 'I can only answer from the provided knowledge base.'"
```

To enable web search: modify the system prompt in [src/app/api/webhook/[botToken]/route.ts:95-104](src/app/api/webhook/[botToken]/route.ts#L95-L104) to allow web search when `webSearchEnabled` is true.

### Conversation History

The webhook handler:
- Fetches last 5 interactions from the same chat (chatId)
- Includes them in OpenRouter request as conversation history for context
- Maintains chronological order (oldest first)
- Allows multi-turn conversations within the same chat

### Key Data Path

```
User fills form → POST /api/bots/deploy
  → validates TMA auth
  → extracts knowledge base:
      - manual text (min 10 chars)
      - crawls URLs (max 10 pages, 2 levels deep)
      - parses uploaded files (DOCX, PDF)
  → calls Telegram getMe to verify bot token
  → calls Telegram setWebhook → /api/webhook/[botToken]
  → generates secretToken and upserts Bot record

User sends message to bot → POST /api/webhook/[botToken]
  → verifies x-telegram-bot-api-secret-token header
  → fetches last 5 interactions from this chat for context
  → sends to OpenRouter: system prompt + knowledge base + history + new message
  → parses JSON response (reply + optional buy intent)
  → saves Interaction record to DB
  → sends reply via Telegram sendMessage (optionally with TON pay button)

User views interactions → GET /api/interactions?botId=...
  → returns all interactions grouped by chatId
  → sorted by most recent chat first
```

### Directory Structure

- `src/app/` — Next.js App Router pages and API routes
  - `api/bots/deploy` — Create/update bot with knowledge base extraction
  - `api/bots/edit` — Update bot configuration (model, prompt, web search, KB)
  - `api/bots/list` — List bots owned by authenticated user
  - `api/bots/toggle` — Activate/deactivate a bot
  - `api/bots/delete` — Delete a bot
  - `api/webhook/[botToken]` — Telegram webhook handler; calls OpenRouter, manages conversation history, saves interactions
  - `api/interactions` — Retrieve and view chat conversations grouped by chatId
  - `settings/` — Bot management page (list, edit, toggle, delete, view interactions)
  - `interactions/` — Chat interface for viewing bot conversations
- `src/components/` — React components (Root wrapper, UI, error handling, locale switcher)
- `src/lib/` — Shared server utilities:
  - `auth.ts` — TMA initData validation against TELEGRAM_BOT_TOKEN
  - `prisma.ts` — Prisma client singleton
  - `extractor.ts` — Knowledge base extraction (URL crawling, file parsing for DOCX/PDF)
- `src/core/i18n/` — `next-intl` configuration; locale set from Telegram user language_code
- `prisma/schema.prisma` — SQLite schema:
  - `Bot` — bot configuration and settings
  - `Interaction` — stored conversations with user input, AI response, and intent detection

### Knowledge Base Extraction

Supports three input types:

1. **Manual text** — User-provided text (minimum 10 characters)
2. **URLs** — Web crawling (up to 10 pages, 2 levels deep via `extractFromUrl`)
3. **File uploads** — Concurrent parsing of DOCX and PDF files via `extractFromFile`

All sources are concatenated into `knowledgeBaseText` with source attribution.

### Purchase Intent Detection

When the model detects purchase intent:
1. Returns JSON with `intent.intent = "buy"`, `intent.item`, and `intent.price_in_ton`
2. Webhook builds a `ton://transfer/...` deep-link to owner's wallet
3. Sends reply with inline keyboard button: "Pay with TON" → deep-link

### Telegram / TON Integration Notes

- **Outside Telegram**: Run `pnpm dev` and open in browser. `src/mockEnv.ts` / `useTelegramMock.ts` mock Telegram (configured via `.env`).
- **Inside Telegram**: Requires HTTPS. Use `pnpm dev:https` with a public tunnel and set `NEXT_PUBLIC_APP_URL`.
- **TonConnect manifest**: `public/tonconnect-manifest.json` must match the deployed URL.
- **AI models**: Defaults to `google/gemini-2.0-flash-001` via OpenRouter. Users can select any OpenRouter-supported model per bot.
- **OpenRouter plugins**: Web search available via `{ id: 'web' }` plugin (currently suppressed by system prompt constraints).
