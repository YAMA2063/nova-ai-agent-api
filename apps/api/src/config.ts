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
    'openai/gpt-6-astra',
    'anthropic/claude-sonnet-5',
    'nvidia/nemotron-3-super-120b-a12b:free'
  ]),
  fastModels: parseList(process.env.OPENROUTER_FAST_MODELS, [
    'google/gemini-3.8-flash',
    'openai/gpt-5.6-luna',
    'nvidia/nemotron-3-super-120b-a12b:free'
  ]),
  autoModels: parseList(process.env.OPENROUTER_AUTO_MODELS, [
    'anthropic/claude-sonnet-5',
    'openai/gpt-6-astra',
    'nvidia/nemotron-3-super-120b-a12b:free'
  ])
};
