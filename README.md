# TonDesk

TonDesk is a Telegram Mini App for launching and managing AI bots backed by TON wallets.

Instead of building a bot, billing system, knowledge ingestion pipeline, and Telegram webhook stack from scratch, creators can connect a wallet, upload a knowledge base, deploy a bot, and fund usage with TON. The result is a Telegram-native workflow for shipping practical AI agents on TON with minimal setup.

## What It Does

- Deploys Telegram bots from a Mini App interface
- Connects a TON wallet with TON Connect
- Lets bot owners fund usage through TON top-ups
- Verifies top-ups against on-chain TON transactions
- Builds a bot knowledge base from:
  - pasted text
  - uploaded files
  - crawled website URLs
- Answers user messages inside Telegram using an LLM
- Tracks interactions, wallet balance, credits, and deployed bots
- Supports bot editing, pausing, reactivation, and deletion

## Why It Matters

TonDesk turns the messy parts of AI agent operations into reusable infrastructure:

- Telegram distribution
- wallet-linked ownership
- on-chain payment verification
- usage-based credit billing
- knowledge base ingestion
- lightweight bot hosting and administration

That makes it a strong fit for teams building agent infrastructure on TON, while still producing a user-facing AI experience inside Telegram.

## Core Flow

1. A user opens the TonDesk Mini App inside Telegram.
2. The app authenticates the user with Telegram Mini App `initData`.
3. The user connects a TON wallet with TON Connect.
4. The user creates a bot by providing:
   - a Telegram bot token
   - optional system prompt and welcome message
   - manual knowledge base text
   - optional URLs to crawl
   - optional files to ingest
5. TonDesk validates the bot token, registers a Telegram webhook, and stores the bot config.
6. The owner tops up their wallet balance in TON.
7. TonDesk verifies the payment on-chain and converts it into credits.
8. When the deployed bot receives Telegram messages, TonDesk:
   - checks available credits
   - loads recent conversation history
   - sends the prompt plus knowledge base to OpenRouter
   - replies in Telegram
   - deducts credits from the owner wallet

## Features

### Telegram Mini App admin panel

- Wallet connection with `@tonconnect/ui-react`
- Bot deployment and management UI
- Wallet balance and top-up status
- Bot list with message and unique-user counts
- Interaction history view

### Knowledge ingestion

- Manual text entry
- URL crawling on the same domain
- File extraction from:
  - `.txt`
  - `.csv`
  - `.pdf`
  - `.docx`

### TON-powered billing

- Top-up initialization from the Mini App
- TON transfer sent via TON Connect
- On-chain verification via TON Center API
- Credits added only after confirmed matching inbound transaction
- Usage deducted per interaction

### Telegram bot runtime

- Telegram webhook handling
- Welcome message on `/start`
- Knowledge-base-grounded responses
- Optional web search plugin for supported models
- Persistent interaction logging

## Stack

- Next.js 16
- React 19
- TypeScript
- Prisma
- SQLite
- TON Connect
- Telegram Mini Apps SDK
- OpenRouter
- TON Center API

## Repository Structure

```text
src/
  app/
    api/
      bots/                  Bot deploy, edit, delete, list, toggle
      user/wallet/           Wallet summary and top-up flow
      webhook/[botToken]/    Telegram webhook runtime
    page.tsx                 Main TonDesk Mini App UI
  lib/
    extractor.ts             URL and file knowledge extraction
    server-auth.ts           Telegram Mini App auth enforcement
    ton-verification.ts      TON on-chain top-up verification
    billing.ts               Credit conversion and interaction cost
prisma/
  schema.prisma              User, bot, interaction, transaction models
public/
  tonconnect-manifest.json   TON Connect manifest
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values.

```env
DATABASE_URL="file:./prisma/dev.db"
OPENROUTER_API_KEY=""
NEXT_PUBLIC_MASTER_WALLET_ADDRESS=""
NEXT_PUBLIC_APP_URL=""
TELEGRAM_BOT_TOKEN=""
TONCENTER_API_BASE_URL="https://toncenter.com/api/v3"
TONCENTER_API_KEY=""
```

### Required

- `OPENROUTER_API_KEY`
  Used to generate bot replies.

- `NEXT_PUBLIC_MASTER_WALLET_ADDRESS`
  The TON wallet that receives top-up transfers before they are verified and credited.

- `TELEGRAM_BOT_TOKEN`
  The platform bot token for validating Telegram Mini App `initData`.

### Recommended

- `NEXT_PUBLIC_APP_URL`
  Public HTTPS URL used when registering Telegram webhooks. In local development this should usually be your tunnel URL.

- `TONCENTER_API_KEY`
  Recommended to avoid tight rate limits during transaction verification.

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create environment file

```bash
cp .env.example .env
```

Fill in the required environment variables before running the app.

### 3. Generate Prisma client

```bash
pnpm prisma generate
```

### 4. Run the app

```bash
pnpm dev
```

For HTTPS local development:

```bash
pnpm dev:https
```

### 5. Open the Mini App

You can test in a browser for UI work, but the real flow depends on Telegram Mini App auth and TON Connect. For the most accurate test setup:

- run the app behind HTTPS
- expose it publicly with a tunnel if needed
- set `NEXT_PUBLIC_APP_URL`
- configure your Telegram bot Mini App URL in BotFather
- open the Mini App from Telegram

## Database

This project uses Prisma with SQLite.

Main entities:

- `User`
  Stores wallet address, credits, and total top-ups.

- `Bot`
  Stores deployed bot configuration, knowledge base, webhook secret, and owner wallet.

- `Interaction`
  Stores per-message history and credits used.

- `Transaction`
  Stores top-up and usage events, including pending and verified on-chain payments.

If you need to apply local schema changes during development:

```bash
pnpm prisma migrate dev
```

## Payment and Credit Model

- `1 TON = 1 credit`
- Each interaction currently costs `0.1` credits

Credit rules are defined in [src/lib/billing.ts](c:/Programming/ai_random_fun/tondesk3/src/lib/billing.ts).

### Top-up flow

1. The owner chooses a TON amount in the Mini App.
2. TON Connect sends the transfer to `NEXT_PUBLIC_MASTER_WALLET_ADDRESS`.
3. TonDesk creates a pending top-up record.
4. The app polls the verification endpoint.
5. TonDesk checks TON Center for a matching inbound transaction.
6. Once the transaction is confirmed and unused, credits are added to the owner wallet.

Verification logic lives in [src/lib/ton-verification.ts](c:/Programming/ai_random_fun/tondesk3/src/lib/ton-verification.ts).

## Bot Deployment Flow

Deployment logic lives in [src/app/api/bots/deploy/route.ts](c:/Programming/ai_random_fun/tondesk3/src/app/api/bots/deploy/route.ts).

During deployment TonDesk:

- authenticates the Mini App request
- validates the submitted Telegram bot token with `getMe`
- extracts knowledge from text, files, and crawled URLs
- generates a webhook secret
- registers the Telegram webhook
- upserts the bot and owner wallet in the database

## Telegram Runtime

Incoming Telegram messages are handled by [src/app/api/webhook/[botToken]/route.ts](c:/Programming/ai_random_fun/tondesk3/src/app/api/webhook/[botToken]/route.ts).

For each message TonDesk:

- verifies the Telegram webhook secret
- checks whether the bot is active
- checks whether the owner wallet has enough credits
- loads recent conversation history
- calls OpenRouter with the bot knowledge base and selected model
- stores the interaction
- deducts credits
- replies back into the Telegram chat

## Authentication

TonDesk protects management routes with Telegram Mini App authentication.

Server-side auth is implemented in [src/lib/server-auth.ts](c:/Programming/ai_random_fun/tondesk3/src/lib/server-auth.ts). Requests must include a valid `Authorization: tma ...` header generated from Telegram Mini App `initData`.

Protected routes include:

- bot deploy/edit/delete/list/toggle
- wallet summary
- top-up initialization
- top-up confirmation

## Scripts

- `pnpm dev` - start local development server
- `pnpm dev:https` - start local HTTPS development server
- `pnpm build` - build for production
- `pnpm start` - run the production build
- `pnpm lint` - run linting
- `pnpm prisma generate` - generate Prisma client
- `pnpm prisma migrate dev` - create and apply a local migration

## Docker

This repository includes a Docker setup for the app and SQLite persistence.

Run:

```bash
docker compose up --build
```

Stop:

```bash
docker compose down
```

Stop and remove the database volume:

```bash
docker compose down -v
```

## Current Constraints

- The knowledge base is stored as raw text, not embeddings
- URL crawling stays on the same domain and follows simple text extraction rules
- Billing is credit-based rather than direct in-chat TON settlement
- OpenRouter is required for AI responses
- Production deployment needs a stable public HTTPS URL for Telegram webhooks

## Hackathon Positioning

Best track: `Agent Infrastructure`

Why:

- TonDesk is not just a single bot experience
- it provides reusable primitives for deploying, operating, and billing Telegram AI bots on TON
- it combines wallet ownership, on-chain verified funding, webhook automation, and bot management in one platform

Secondary fit: `User-Facing AI Agents`

That fit comes from the deployed bots themselves, but the stronger story is infrastructure for creating and operating those agents.

## Submission Description

TonDesk is a Telegram Mini App for deploying TON-connected AI bots from a custom knowledge base. It combines bot deployment, Telegram-native management, TON wallet funding, and on-chain verified top-ups so creators can launch practical AI agents inside Telegram without building the infrastructure stack from scratch.
