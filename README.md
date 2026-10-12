# NOVA AI Agent Engine v2.0

An autonomous personal AI agent engine and cross-platform client (Web + Expo Mobile) featuring multi-model orchestration, persistent semantic memory, dynamic tool calling (ReAct loop), and live web research.

## 🚀 Key Features

- **Autonomous ReAct Agent Loop**: Supports multi-turn tool calling and reasoning with OpenRouter, OpenAI, and Anthropic models.
- **Suite of 8 Native Agent Tools**:
  - `calculator`: High-precision math, powers, roots, trigonometry, percentages, and financial compounding.
  - `code_interpreter`: Isolated JavaScript sandbox for data analysis, sorting, simulations, and algorithms.
  - `web_search`: Live multi-source web search with real-time duckduckgo/wikipedia fallback.
  - `fetch_webpage`: URL reader and HTML-to-markdown text cleaner for in-depth web research.
  - `current_datetime`: Real-time timestamp, day of the week, UTC and local time formatting.
  - `memory_store`: Autonomous persistence of user facts, project configurations, and preferences.
  - `memory_recall`: Semantic and keyword-based retrieval from persistent memory.
  - `task_planner`: Automated multi-step milestone planning and sub-task decomposition.
- **Long-Term Memory Engine**:
  - Categorization (`profile`, `preference`, `fact`, `task`, `project`, `general`).
  - Automatic keyword and tag extraction with BM25-style relevance scoring.
  - Persistent disk storage (`data/memories.json`) with in-memory caching.
- **Fault-Tolerant Model Routing**:
  - Multi-key rotation across configured `OPENROUTER_API_KEYS`.
  - Dynamic cascading fallback across model candidates.
  - Three execution modes: `fast` (low latency), `max` (deep reasoning), and `auto` (adaptive complexity classifier).

## 📁 Repository Structure

- `apps/api`: Fastify + TypeScript backend serving `/agent/run`, `/tools`, and `/memory`.
- `apps/web`: React 18 + Vite cyber-luxury web client with real-time live telemetry.
- `apps/mobile`: React Native / Expo SDK 57 mobile agent app.
- `packages/shared`: Shared TypeScript types (`AgentStep`, `AgentResponse`, `ChatMessage`, etc.).

## 🛠️ Quick Start

### 1. API Server
```bash
cd apps/api
cp .env.example .env
# Configure your OPENROUTER_API_KEYS in .env
npm install
npm run dev
```

### 2. Web Client
```bash
cd apps/web
npm install
npm run dev
```

### 3. Mobile App
```bash
cd apps/mobile
npm install
npm start
```

## 📡 API Endpoints

- `GET /health`: Health check, uptime, tools count, and model configuration.
- `GET /tools`: Schema discovery for all 8 agent tools.
- `POST /tools/execute`: Direct manual tool execution for testing.
- `POST /agent/run`: Run the autonomous agent loop with message history, tool execution, and memory recall.
- `GET /memory`: List stored memories.
- `GET /memory/search?q=query`: Search memories by relevance.
- `POST /memory`: Create or update a memory.
- `DELETE /memory/:id`: Delete a memory item.
