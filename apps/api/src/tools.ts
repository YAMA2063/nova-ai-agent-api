import vm from 'node:vm';
import { addMemory, searchMemories, type MemoryCategory } from './memory.js';

export type ToolContext = {
  userId?: string;
  conversationId?: string;
};

export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
  durationMs?: number;
};

// Safe DuckDuckGo search fetcher
async function searchDuckDuckGo(query: string, maxResults = 5) {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(searchUrl, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`DuckDuckGo responded with HTTP ${res.status}`);
    const html = await res.text();

    const results: Array<{ title: string; snippet: string; url: string }> = [];
    const linkRegex = /<a class="result__url" href="([^"]+)">([^<]+)<\/a>/g;
    const snippetRegex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
    const titleRegex = /<h2 class="result__title">[\s\S]*?<a class="result__a"[^>]*>([\s\S]*?)<\/a>/g;

    const titles: string[] = [];
    const urls: string[] = [];
    const snippets: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = titleRegex.exec(html)) !== null && titles.length < maxResults) {
      titles.push(match[1].replace(/<[^>]+>/g, '').trim());
    }
    while ((match = linkRegex.exec(html)) !== null && urls.length < maxResults) {
      let rawUrl = match[1];
      if (rawUrl.startsWith('//duckduckgo.com/l/?uddg=')) {
        const parsed = new URL('https:' + rawUrl);
        rawUrl = decodeURIComponent(parsed.searchParams.get('uddg') || rawUrl);
      }
      urls.push(rawUrl);
    }
    while ((match = snippetRegex.exec(html)) !== null && snippets.length < maxResults) {
      snippets.push(match[1].replace(/<[^>]+>/g, '').trim());
    }

    for (let i = 0; i < titles.length; i++) {
      results.push({
        title: titles[i] || 'Untitled',
        url: urls[i] || '',
        snippet: snippets[i] || ''
      });
    }

    if (results.length > 0) return results;
  } catch (err) {
    console.warn('[NOVA WebSearch] DuckDuckGo search fallback:', err);
  }

  // Fallback to Wikipedia API if general search returned empty or blocked
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&srlimit=${maxResults}`;
    const res = await fetch(wikiUrl);
    if (res.ok) {
      const data = (await res.json()) as { query?: { search?: Array<{ title: string; snippet: string; pageid: number }> } };
      const items = data.query?.search || [];
      return items.map((it) => ({
        title: it.title,
        snippet: it.snippet.replace(/<[^>]+>/g, ''),
        url: `https://en.wikipedia.org/?curid=${it.pageid}`
      }));
    }
  } catch {
    // ignore
  }

  return [{ title: 'No results found', snippet: `Could not retrieve live results for "${query}".`, url: '' }];
}

// Strip HTML tags and summarize webpage text
function htmlToText(html: string, maxLen = 3500): string {
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');

  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  cleaned = cleaned.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  if (cleaned.length > maxLen) {
    return cleaned.slice(0, maxLen) + '... [content truncated for token efficiency]';
  }
  return cleaned;
}

// Tool definitions & implementations
export const toolRegistry = {
  calculator: {
    name: 'calculator',
    description: 'High-precision mathematical and financial calculator. Evaluates arithmetic, powers, roots, percentages, trigonometric, and statistical calculations.',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Math expression to evaluate, e.g. "1250 * 1.11 - 350", "sqrt(144) + 2^5", or "round(1000 * (1 + 0.05)^3, 2)"'
        }
      },
      required: ['expression']
    },
    execute: async (args: { expression: string }) => {
      let expr = String(args.expression || '').trim();
      if (!expr) throw new Error('Expression is required');

      // Replace percentage patterns like "500 * 10%" -> "500 * 0.10"
      expr = expr.replace(/(\d+(?:\.\d+)?)%/g, '($1 / 100)');
      // Replace power symbol ^ with **
      expr = expr.replace(/\^/g, '**');

      // Create math sandbox
      const mathScope = {
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        sqrt: Math.sqrt,
        cbrt: Math.cbrt,
        abs: Math.abs,
        round: (n: number, decimals = 0) => {
          const factor = Math.pow(10, decimals);
          return Math.round(n * factor) / factor;
        },
        floor: Math.floor,
        ceil: Math.ceil,
        min: Math.min,
        max: Math.max,
        log: Math.log,
        log10: Math.log10,
        exp: Math.exp,
        PI: Math.PI,
        E: Math.E,
        pow: Math.pow
      };

      const allowedCharRegex = /^[0-9+\-*/(). ,a-zA-Z_]+$/;
      if (!allowedCharRegex.test(expr)) {
        throw new Error('Expression contains illegal characters');
      }

      const script = new vm.Script(`"use strict"; (${expr})`);
      const context = vm.createContext(mathScope);
      const val = script.runInContext(context, { timeout: 1500 });

      if (typeof val !== 'number' || !Number.isFinite(val)) {
        throw new Error(`Calculated result is not a finite number: ${val}`);
      }

      return {
        expression: args.expression,
        result: val,
        formatted: val.toLocaleString('id-ID', { maximumFractionDigits: 6 })
      };
    }
  },

  code_interpreter: {
    name: 'code_interpreter',
    description: 'Safe JavaScript code execution sandbox. Use to run algorithms, data filtering, sorting, string operations, simulations, date calculations, or structured data transformations.',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'JavaScript code to execute. Can return a value directly or use return statement.'
        }
      },
      required: ['code']
    },
    execute: async (args: { code: string }) => {
      const code = String(args.code || '').trim();
      if (!code) throw new Error('Code is required');

      const logs: string[] = [];
      const sandbox = {
        console: {
          log: (...vals: unknown[]) => logs.push(vals.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(' ')),
          warn: (...vals: unknown[]) => logs.push('[WARN] ' + vals.map((v) => String(v)).join(' ')),
          error: (...vals: unknown[]) => logs.push('[ERR] ' + vals.map((v) => String(v)).join(' '))
        },
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        RegExp,
        parseInt,
        parseFloat,
        isNaN,
        isFinite
      };

      const wrappedCode = `"use strict";
      (() => {
        ${code.includes('return') ? code : `return (${code});`}
      })()`;

      const script = new vm.Script(wrappedCode);
      const context = vm.createContext(sandbox);
      const result = script.runInContext(context, { timeout: 3000 });

      return {
        result: result !== undefined ? result : null,
        logs: logs.length ? logs : undefined
      };
    }
  },

  web_search: {
    name: 'web_search',
    description: 'Autonomous live web search engine. Use whenever the user asks about current events, real-time facts, crypto/forex/stock data, technical documentation, or fresh 2026 data.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search terms or question'
        },
        maxResults: {
          type: 'number',
          description: 'Max number of results to fetch (default: 5)'
        }
      },
      required: ['query']
    },
    execute: async (args: { query: string; maxResults?: number }) => {
      const query = String(args.query || '').trim();
      const results = await searchDuckDuckGo(query, args.maxResults || 5);
      return {
        query,
        count: results.length,
        results
      };
    }
  },

  fetch_webpage: {
    name: 'fetch_webpage',
    description: 'Fetches and parses text content from a given web URL or article. Ideal for deep research, reading API docs, or checking specific link contents.',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The HTTP or HTTPS URL to read'
        }
      },
      required: ['url']
    },
    execute: async (args: { url: string }) => {
      const targetUrl = String(args.url || '').trim();
      if (!/^https?:\/\//i.test(targetUrl)) throw new Error('Invalid URL format');

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(targetUrl, {
        signal: ctrl.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/json,text/plain'
        }
      });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();

      if (contentType.includes('application/json')) {
        return { url: targetUrl, contentType, json: JSON.parse(text) };
      }

      return {
        url: targetUrl,
        contentType,
        content: htmlToText(text)
      };
    }
  },

  current_datetime: {
    name: 'current_datetime',
    description: 'Get the exact current real-world date, time, day of the week, timezone, and ISO 8601 timestamp.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    },
    execute: async () => {
      const now = new Date();
      return {
        iso: now.toISOString(),
        utc: now.toUTCString(),
        wibLocal: now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        date: now.getDate()
      };
    }
  },

  memory_store: {
    name: 'memory_store',
    description: 'Persist important user facts, project configurations, preferences, or tasks into NOVA long-term memory.',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The memory text to store'
        },
        category: {
          type: 'string',
          enum: ['profile', 'preference', 'fact', 'task', 'project', 'general'],
          description: 'Category for this memory'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional searchable keywords/tags'
        }
      },
      required: ['text']
    },
    execute: async (args: { text: string; category?: MemoryCategory; tags?: string[] }, ctx: ToolContext) => {
      const item = addMemory(args.text, ctx.userId || 'default', args.category, args.tags);
      return {
        saved: true,
        id: item.id,
        category: item.category,
        text: item.text
      };
    }
  },

  memory_recall: {
    name: 'memory_recall',
    description: 'Search and retrieve memories from NOVA long-term memory by keyword, category, or semantic topic.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query or topic to find in memory'
        },
        limit: {
          type: 'number',
          description: 'Max memories to return (default 5)'
        }
      },
      required: ['query']
    },
    execute: async (args: { query: string; limit?: number }, ctx: ToolContext) => {
      const items = searchMemories(args.query, ctx.userId || 'default', args.limit || 5);
      return {
        count: items.length,
        memories: items.map((m) => ({ id: m.id, text: m.text, category: m.category, createdAt: m.createdAt }))
      };
    }
  },

  task_planner: {
    name: 'task_planner',
    description: 'Deconstruct a complex objective or mission into a structured multi-step execution plan with milestones and checklist items.',
    parameters: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          description: 'The main goal or user objective'
        },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stepNumber: { type: 'number' },
              title: { type: 'string' },
              action: { type: 'string' },
              toolNeeded: { type: 'string' }
            },
            required: ['stepNumber', 'title']
          },
          description: 'Structured sequential steps'
        }
      },
      required: ['goal', 'steps']
    },
    execute: async (args: { goal: string; steps: Array<{ stepNumber: number; title: string; action?: string; toolNeeded?: string }> }) => {
      return {
        goal: args.goal,
        totalSteps: args.steps.length,
        plan: args.steps.map((s) => ({
          stepNumber: s.stepNumber,
          title: s.title,
          action: s.action || 'Execute milestone',
          toolNeeded: s.toolNeeded || 'none',
          status: 'planned'
        }))
      };
    }
  }
};

// Return OpenAI-compatible tools schema array
export function getOpenAIToolsSchema() {
  return Object.values(toolRegistry).map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}

// Execute tool with timing & safety wrapper
export async function executeTool(
  toolName: string,
  rawArgs: unknown,
  ctx: ToolContext = {}
): Promise<ToolResult> {
  const start = Date.now();
  const tool = (toolRegistry as Record<string, { execute: (args: any, ctx: ToolContext) => Promise<any> }>)[toolName];

  if (!tool) {
    return {
      success: false,
      error: `Unknown tool "${toolName}". Available tools: ${Object.keys(toolRegistry).join(', ')}`,
      durationMs: Date.now() - start
    };
  }

  try {
    let parsedArgs = rawArgs;
    if (typeof rawArgs === 'string') {
      try {
        parsedArgs = JSON.parse(rawArgs);
      } catch {
        parsedArgs = { query: rawArgs, expression: rawArgs, code: rawArgs };
      }
    }

    const data = await tool.execute(parsedArgs, ctx);
    return {
      success: true,
      data,
      durationMs: Date.now() - start
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start
    };
  }
}
