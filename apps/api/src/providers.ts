import { config } from './config.js';
import type { AgentMode, AgentResponse, AgentStep, ChatMessage, Provider } from '@nova/shared';
import { executeTool, getOpenAIToolsSchema } from './tools.js';
import { searchMemories } from './memory.js';

const SYSTEM_PROMPT_BASE = `You are NOVA, an advanced, highly capable autonomous AI agent.
Current Year: 2026.

Your Capabilities:
- You have access to real tools:
  * calculator: Exact arithmetic, powers, percentages, roots, trigonometric expressions.
  * code_interpreter: Safe JavaScript evaluation to execute algorithms, simulations, data transformations, and date logic.
  * web_search: Live web search engine for real-time facts, current news, crypto/stock quotes, tech updates.
  * fetch_webpage: Read and parse full text from any web URL.
  * current_datetime: Real-world current date, time, and timezone.
  * memory_store: Save key facts, preferences, or tasks to persistent memory.
  * memory_recall: Search long-term memories.
  * task_planner: Decompose complex objectives into structured sub-tasks.

Guidelines:
1. Always prefer using tools rather than guessing or hallucinating calculations, current events, or web data.
2. When executing tools, inspect the results carefully before providing your final synthesis.
3. Be direct, authoritative, and helpful. Format your responses with clean GitHub Markdown.
4. If a task requires multiple steps (e.g. search + calculate or search + fetch), execute the required tools sequentially.
5. If you do internal thinking or planning, you may wrap it in <thought>...</thought> tags.
6. Never claim you did an action you did not actually execute.`;

export function chooseRoute(mode: AgentMode = 'auto', message: string): { provider: Provider; models: string[] } {
  if (mode === 'fast') return { provider: 'openrouter', models: config.fastModels };
  if (mode === 'max') return { provider: 'openrouter', models: config.maxModels };

  // Auto mode: check query complexity
  const isComplex = /(code|debug|analy[sz]|research|compare|plan|build|develop|reason|strategy|calculate|hitung|algoritma|data|simulas)/i.test(message);
  const models = isComplex ? config.maxModels : config.autoModels;

  return { provider: 'openrouter', models };
}

// Extract <thought>...</thought> blocks if model produces them
function extractThoughtAndContent(raw: string): { thought?: string; content: string } {
  const thoughtMatch = /<thought>([\s\S]*?)<\/thought>/i.exec(raw);
  if (thoughtMatch) {
    const thought = thoughtMatch[1].trim();
    const content = raw.replace(/<thought>[\s\S]*?<\/thought>/i, '').trim();
    return { thought, content: content || raw };
  }
  return { content: raw };
}

// Fallback text ReAct parser for models that output tool calls in plain text
function extractTextToolCall(text: string): { toolName: string; args: unknown } | null {
  // Pattern 1: ```tool_call\n{"tool": "calculator", "arguments": {...}}\n```
  const blockMatch = /```(?:tool_call|json)?\s*\{\s*"tool":\s*"([^"]+)",\s*"(?:arguments|args|input)":\s*(\{[\s\S]*?\}|"[^"]*")\s*\}\s*```/i.exec(text);
  if (blockMatch) {
    try {
      const parsedArgs = JSON.parse(blockMatch[2]);
      return { toolName: blockMatch[1], args: parsedArgs };
    } catch {
      return { toolName: blockMatch[1], args: blockMatch[2] };
    }
  }

  // Pattern 2: Action: <tool>\nAction Input: <input>
  const actionMatch = /Action:\s*([a-zA-Z0-9_-]+)\s*\nAction Input:\s*([\s\S]*?)(?:\n\n|$)/i.exec(text);
  if (actionMatch) {
    const toolName = actionMatch[1].trim();
    const rawInput = actionMatch[2].trim();
    try {
      return { toolName, args: JSON.parse(rawInput) };
    } catch {
      return { toolName, args: rawInput };
    }
  }

  return null;
}

export async function runOpenRouterAgent(
  messages: ChatMessage[],
  message: string,
  models: string[],
  userId = 'default',
  conversationId = 'default'
): Promise<AgentResponse> {
  const keys = config.openrouterKeys;
  if (!keys.length) {
    throw new Error('No OpenRouter API key configured. Please set OPENROUTER_API_KEYS in .env');
  }

  // Context injection: Search relevant memories for this user
  const relevantMemories = searchMemories(message, userId, 4);
  const memoryContext = relevantMemories.length
    ? `\n\nRelevant memories about this user:\n` + relevantMemories.map((m) => `- [${m.category}] ${m.text}`).join('\n')
    : '';

  const systemMessage = {
    role: 'system' as const,
    content: SYSTEM_PROMPT_BASE + memoryContext
  };

  const initialHistory = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));

  const toolsSchema = getOpenAIToolsSchema();
  const maxIterations = 5;
  let lastError: Error | null = null;

  for (const modelCandidate of models) {
    for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
      const apiKey = keys[keyIdx];

      try {
        // Working message log for this model execution attempt
        const activeMessages: any[] = [
          systemMessage,
          ...initialHistory,
          { role: 'user', content: message }
        ];

        const steps: AgentStep[] = [];
        const toolsUsed = new Set<string>();
        let currentThought: string | undefined;
        let finalContent = '';
        let lastReportedModel = modelCandidate;

        for (let iteration = 0; iteration < maxIterations; iteration++) {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 25000);

          const requestBody: Record<string, unknown> = {
            model: modelCandidate,
            messages: activeMessages,
            tools: toolsSchema,
            tool_choice: 'auto',
            temperature: 0.3
          };

          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            signal: ctrl.signal,
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'X-Title': 'NOVA AI Agent Engine v2'
            },
            body: JSON.stringify(requestBody)
          });
          clearTimeout(timer);

          if (!res.ok) {
            const errText = await res.text();
            console.warn(`[NOVA Agent] ${modelCandidate} (Key #${keyIdx + 1}) returned HTTP ${res.status}: ${errText.slice(0, 150)}`);
            lastError = new Error(`OpenRouter (${res.status}): ${errText.slice(0, 150)}`);
            if ([400, 401, 402, 404, 429, 500, 502, 503, 524].includes(res.status)) {
              // Try next key or next model
              break;
            }
            throw lastError;
          }

          const data = (await res.json()) as any;
          if (data.model) {
            lastReportedModel = data.model;
          }
          if (data.error) {
            console.warn(`[NOVA Agent] Error body from ${modelCandidate}:`, data.error.message);
            lastError = new Error(data.error.message || 'API error');
            break;
          }

          const choice = data.choices?.[0];
          if (!choice || !choice.message) {
            lastError = new Error('Empty response choice from model');
            break;
          }

          const assistantMsg = choice.message;
          const toolCalls = assistantMsg.tool_calls;

          // Case A: Native tool_calls returned
          if (Array.isArray(toolCalls) && toolCalls.length > 0) {
            activeMessages.push(assistantMsg);

            for (const tc of toolCalls) {
              const toolName = tc.function?.name || 'unknown';
              toolsUsed.add(toolName);

              let args: any = {};
              try {
                args = JSON.parse(tc.function?.arguments || '{}');
              } catch {
                args = { raw: tc.function?.arguments };
              }

              const toolRes = await executeTool(toolName, args, { userId, conversationId });

              steps.push({
                step: steps.length + 1,
                tool: toolName,
                input: args,
                output: toolRes.data || toolRes.error,
                timestamp: new Date().toISOString()
              });

              // Add tool response to message history
              activeMessages.push({
                role: 'tool',
                tool_call_id: tc.id,
                name: toolName,
                content: JSON.stringify(toolRes)
              });
            }

            // Continue loop to let model synthesize or make next tool call
            continue;
          }

          // Case B: No native tool_calls. Check for plain text ReAct tool call fallback
          const rawContent = assistantMsg.content || '';
          const textToolCall = extractTextToolCall(rawContent);

          if (textToolCall && iteration < maxIterations - 1) {
            toolsUsed.add(textToolCall.toolName);
            const toolRes = await executeTool(textToolCall.toolName, textToolCall.args, { userId, conversationId });

            steps.push({
              step: steps.length + 1,
              tool: textToolCall.toolName,
              input: typeof textToolCall.args === 'object' && textToolCall.args !== null ? (textToolCall.args as Record<string, unknown>) : { value: textToolCall.args },
              output: toolRes.data || toolRes.error,
              timestamp: new Date().toISOString()
            });

            activeMessages.push({ role: 'assistant', content: rawContent });
            activeMessages.push({
              role: 'user',
              content: `Tool Result for ${textToolCall.toolName}:\n${JSON.stringify(toolRes, null, 2)}\nNow proceed to finalize your answer or take next step.`
            });

            continue;
          }

          // Case C: Final answer generated!
          const { thought, content } = extractThoughtAndContent(rawContent);
          currentThought = thought;
          finalContent = content;
          break;
        }

        if (finalContent) {
          return {
            ok: true,
            content: finalContent,
            provider: 'openrouter',
            model: lastReportedModel,
            steps: steps.length ? steps : undefined,
            toolsUsed: toolsUsed.size ? Array.from(toolsUsed) : undefined,
            memoriesRecalled: relevantMemories.map((m) => m.text),
            thought: currentThought
          };
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }
  }

  throw lastError || new Error('All model candidates and API keys failed to execute agent request.');
}

// Backward-compatible wrapper for existing calls
export async function runOpenRouter(
  messages: ChatMessage[],
  message: string,
  models: string[],
  _useWeb: boolean,
  userId = 'default',
  conversationId = 'default'
): Promise<AgentResponse> {
  return runOpenRouterAgent(messages, message, models, userId, conversationId);
}
