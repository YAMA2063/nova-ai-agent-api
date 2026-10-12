import 'dotenv/config';

function parseList(val: string | undefined, fallback: string[]): string[] {
  if (!val) return fallback;
  return val.split(',').map((s) => s.trim()).filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT || 8787),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  openrouterKeys: parseList(process.env.OPENROUTER_API_KEYS, []),
  maxModels: parseList(process.env.OPENROUTER_MAX_MODELS, [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
    'google/gemini-2.0-flash-thinking-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-exp:free'
  ]),
  fastModels: parseList(process.env.OPENROUTER_FAST_MODELS, [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'mistralai/mistral-small-24b-instruct-2501:free',
    'openai/gpt-4o-mini'
  ]),
  autoModels: parseList(process.env.OPENROUTER_AUTO_MODELS, [
    'google/gemini-2.0-flash-exp:free',
    'google/gemini-2.0-flash-thinking-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o'
  ])
};
