export type Provider = 'openai' | 'anthropic' | 'openrouter';
export type AgentMode = 'auto' | 'max' | 'fast';
export type ChatMessage = { role: 'user' | 'assistant' | 'system' | 'tool'; content: string; name?: string; tool_call_id?: string };
export type AgentRequest = { message: string; conversationId?: string; mode?: AgentMode; messages?: ChatMessage[]; userId?: string };

export type AgentStep = {
  step: number;
  tool: string;
  input: Record<string, unknown>;
  output: unknown;
  timestamp: string;
  thought?: string;
};

export type AgentResponse = {
  ok: boolean;
  content: string;
  provider: Provider;
  model: string;
  web?: boolean;
  steps?: AgentStep[];
  toolsUsed?: string[];
  memoriesRecalled?: string[];
  thought?: string;
};

export type AgentEvent =
  | { type: 'status'; label: string }
  | { type: 'tool'; name: string; status: 'started' | 'completed'; input?: unknown; output?: unknown }
  | { type: 'message'; content: string }
  | { type: 'thought'; content: string }
  | { type: 'done'; provider: Provider; model: string; steps?: AgentStep[] };

