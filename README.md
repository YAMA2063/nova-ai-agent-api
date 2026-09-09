# NOVA AI Agent

A mobile-first personal AI agent shell for Android/iOS with multi-model routing, long-term memory, web research, tool execution, and voice-ready UI.

## Stack
- Mobile: Expo SDK 57 / React Native / TypeScript
- API: Node.js 22 / TypeScript / Fastify
- AI adapters: OpenAI Responses API + Anthropic Messages API
- Storage: in-memory by default; SQLite/Postgres can be plugged in later

## Important model naming
The app does **not** hard-code a vendor model name as "GPT Astra" or any unverified alias. Set the exact model IDs available to your API account via environment variables.

## Run

### 1. API
```bash
cd apps/api
cp .env.example .env
npm install
npm run dev
```

### 2. Mobile
```bash
cd apps/mobile
npm install
# Set EXPO_PUBLIC_API_URL to your computer LAN IP, e.g. http://192.168.1.20:8787
cp .env.example .env
npm start
```

Use Expo Go for UI prototyping. For production native capabilities, use an EAS/development build.

## What is implemented
- Chat UI
- Agent status + task progress
- Automatic model routing
- OpenAI Responses adapter with web search
- Anthropic adapter
- Tool registry with calculator + time + web research hooks
- Persistent conversation structure on the client
- Memory API shape
- Safety confirmation hook for side-effecting tools
- Health endpoint

## Production hardening
- Put API keys only on the server.
- Add auth (passkeys/OAuth), per-user DB storage, rate limiting, audit logs, and encrypted secrets.
- Add a real web search provider or keep OpenAI web search server-side.
- Gate actions that can send messages, spend money, delete data, or change accounts behind explicit confirmation.
