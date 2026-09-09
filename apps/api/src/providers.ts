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

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    try {
      const activeModels = models.slice(0, 3);
      const requestBody: Record<string, unknown> = {
        model: activeModels[0],
        models: activeModels,
        messages: payload
      };

      if (useWeb) {
        requestBody.tools = [{ type: 'openrouter:web_search' }];
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/nova-ai-agent',
          'X-Title': 'NOVA AI Agent'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        // If rate-limited (429) or auth error (401) and we have more keys, failover to next key
        if ((response.status === 429 || response.status === 401) && i < keys.length - 1) {
          console.warn(`[NOVA] Key #${i + 1} returned ${response.status}. Failing over to Key #${i + 2}...`);
          lastError = new Error(`Key #${i + 1} failed: ${errorText}`);
          continue;
        }
        throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || 'No text response was returned.';
      const usedModel = data.model || models[0];

      return {
        content,
        model: usedModel,
        provider: 'openrouter'
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If we have more keys, try the next one
      if (i < keys.length - 1) {
        console.warn(`[NOVA] Error on Key #${i + 1}. Retrying with next key...`, lastError.message);
        continue;
      }
    }
  }

  throw lastError || new Error('All OpenRouter API keys failed.');
}
