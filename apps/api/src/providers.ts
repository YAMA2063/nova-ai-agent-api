import { config } from './config.js';
import type { AgentMode, ChatMessage, Provider } from '@nova/shared';

const systemPrompt = `You are NOVA, a highly capable personal AI agent.
Be proactive, accurate, and concise. When a task needs current information, use an available web tool rather than guessing.
Break complex requests into practical steps, execute tools when appropriate, verify important results, and clearly state uncertainty.
Never claim to have completed an action you did not actually complete.
For actions with external side effects (sending, purchasing, deleting, publishing, changing account settings), require explicit confirmation from the user before execution.`;

export function chooseRoute(mode: AgentMode = 'auto', message: string): { provider: Provider; models: string[] } {
  if (mode === 'fast') return { provider: 'openrouter', models: config.fastModels };
  if (mode === 'max') return { provider: 'openrouter', models: config.maxModels };
  
  // Auto mode: check complexity to prioritize model selection
  const isComplex = /(code|debug|analy[sz]|research|compare|plan|build|develop|reason|strategy|multiple|deep)/i.test(message);
  const models = isComplex
    ? config.maxModels
    : config.autoModels;

  return { provider: 'openrouter', models };
}

function buildMessagesPayload(messages: ChatMessage[], message: string) {
  const filtered = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));
  return [
    { role: 'system' as const, content: systemPrompt },
    ...filtered,
    { role: 'user' as const, content: message }
  ];
}

export async function runOpenRouter(
  messages: ChatMessage[],
  message: string,
  models: string[],
  useWeb: boolean
): Promise<{ content: string; model: string; provider: Provider }> {
  const keys = config.openrouterKeys;
  if (!keys.length) {
    throw new Error('No OpenRouter API key configured. Please set OPENROUTER_API_KEYS in .env');
  }

  const payload = buildMessagesPayload(messages, message);
  let lastError: Error | null = null;

  for (const modelCandidate of models) {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 18000);
        const requestBody: Record<string, unknown> = {
          model: modelCandidate,
          messages: payload
        };

        if (useWeb) {
          requestBody.tools = [{ type: 'openrouter:web_search' }];
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          signal: ctrl.signal,
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'X-Title': 'NOVA AI Agent'
          },
          body: JSON.stringify(requestBody)
        });
        clearTimeout(timer);

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[NOVA API] ${modelCandidate} (Key #${i + 1}) failed with HTTP ${response.status}:`, errorText.slice(0, 120));
          lastError = new Error(`OpenRouter error (${response.status}): ${errorText.slice(0, 120)}`);
          if ([400, 401, 402, 404, 429, 500, 502, 503, 524].includes(response.status)) {
            continue;
          }
          throw lastError;
        }

        const data = await response.json();
        if (data.error) {
          console.warn(`[NOVA API] ${modelCandidate} returned error in body:`, data.error.message);
          lastError = new Error(data.error.message || 'Provider error');
          // Provider error is specific to model, try next model candidate
          break;
        }

        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return {
            content,
            model: data.model || modelCandidate,
            provider: 'openrouter'
          };
        } else {
          lastError = new Error('Model returned empty response');
          break;
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }
  }

  throw lastError || new Error('All OpenRouter models and keys failed.');
}
