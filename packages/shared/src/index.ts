export type Provider = 'openai' | 'anthropic' | 'openrouter';
export type AgentMode = 'auto' | 'max' | 'fast';
export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };
export type AgentRequest = { message: string; conversationId?: string; mode?: AgentMode; messages?: ChatMessage[] };
export type AgentEvent =
  | { type: 'status'; label: string }
  | { type: 'tool'; name: string; status: 'started' | 'completed' }
  | { type: 'message'; content: string }
  | { type: 'done'; provider: Provider; model: string };
