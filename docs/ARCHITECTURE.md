# NOVA AI Agent Architecture v2.0

```text
Client (Web / Mobile Expo / External API)
   │
   ▼
Fastify Server (apps/api)
   │
   ├──> Health & Tool Discovery (/health, /tools)
   │
   ├──> Long-term Memory Service (/memory, /memory/search)
   │       ├── Categorization (profile, preference, fact, task, project)
   │       ├── Tag extraction & BM25-style relevance ranking
   │       └── Auto-persistence to disk (data/memories.json)
   │
   └──> Autonomous Agent Engine (/agent/run)
           │
           ├── Context Injection (auto-retrieves relevant memories)
           │
           ├── Intelligent Model Router
           │       ├── Mode 'fast': Ultra-low latency (Gemini Flash, Llama 3.3, Mistral)
           │       ├── Mode 'max': Deep reasoning (Claude 3.5 Sonnet, GPT-4o, Gemini Thinking)
           │       └── Mode 'auto': Dynamic task complexity classification
           │
           └── Multi-Step ReAct & Tool Execution Loop (up to 5 turns)
                   │
                   ├── Tools Registry:
                   │     ├── calculator (arithmetic, powers, roots, trigonometry, percentages)
                   │     ├── code_interpreter (isolated JavaScript sandbox with logs)
                   │     ├── web_search (live DuckDuckGo & Wikipedia search)
                   │     ├── fetch_webpage (URL scraper & HTML markdown cleaner)
                   │     ├── current_datetime (exact real-time date, time, timezone)
                   │     ├── memory_store (autonomous storage of facts/preferences)
                   │     ├── memory_recall (autonomous keyword/topic recall)
                   │     └── task_planner (hierarchical sub-task decomposition)
                   │
                   └── Structured Response Synthesis
                         ├── Final user content (GitHub Markdown)
                         ├── Step-by-step tool invocation trace
                         ├── Reasoning / Thought extraction (<thought>)
                         └── Recalled memories & models used
```

## Security & Reliability
- **Multi-Key Failover**: Automatically rotates through configured `OPENROUTER_API_KEYS` on 429/402.
- **Model Fallback Cascade**: If the primary model fails, the engine seamlessly cascades down the model candidate list.
- **Sandboxed Execution**: Code interpreter runs inside Node's isolated `vm` context with strict timeouts.
