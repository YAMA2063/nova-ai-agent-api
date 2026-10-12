import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { config } from './config.js';
import { chooseRoute, runOpenRouterAgent } from './providers.js';
import { addMemory, clearMemories, deleteMemory, listMemories, searchMemories, type MemoryCategory } from './memory.js';
import { executeTool, toolRegistry } from './tools.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: config.corsOrigin });

// 1. Health check with detailed agent capabilities
app.get('/health', async () => ({
  ok: true,
  service: 'nova-ai-agent-api',
  version: '2.0.0',
  time: new Date().toISOString(),
  toolsCount: Object.keys(toolRegistry).length,
  tools: Object.keys(toolRegistry),
  modelsConfigured: {
    auto: config.autoModels,
    max: config.maxModels,
    fast: config.fastModels
  }
}));

// 2. Tools inspection endpoint
app.get('/tools', async () => ({
  ok: true,
  tools: Object.values(toolRegistry).map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters
  }))
}));

// 3. Direct tool execution endpoint (for testing or frontend hooks)
app.post('/tools/execute', async (request, reply) => {
  const schema = z.object({
    tool: z.string(),
    input: z.unknown().default({}),
    userId: z.string().optional(),
    conversationId: z.string().optional()
  });

  const parsed = schema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Invalid tool execution payload', details: parsed.error.flatten() });

  const { tool, input, userId, conversationId } = parsed.data;
  const result = await executeTool(tool, input, { userId, conversationId });
  return { ok: result.success, ...result };
});

// 4. Memory endpoints
app.get('/memory', async (request) => {
  const q = request.query as { userId?: string };
  return { ok: true, memories: listMemories(q.userId) };
});

app.get('/memory/search', async (request, reply) => {
  const q = request.query as { q?: string; userId?: string; limit?: string };
  if (!q.q) return reply.code(400).send({ error: 'Query parameter q is required' });
  const limit = q.limit ? parseInt(q.limit, 10) : 5;
  return { ok: true, memories: searchMemories(q.q, q.userId, limit) };
});

app.post('/memory', async (request, reply) => {
  const body = z.object({
    text: z.string().min(1).max(5000),
    userId: z.string().optional(),
    category: z.enum(['profile', 'preference', 'fact', 'task', 'project', 'general']).optional(),
    tags: z.array(z.string()).optional()
  }).safeParse(request.body);

  if (!body.success) return reply.code(400).send({ error: 'Invalid request', details: body.error.flatten() });
  const created = addMemory(body.data.text, body.data.userId, body.data.category as MemoryCategory, body.data.tags);
  return { ok: true, memory: created };
});

app.delete('/memory/:id', async (request, reply) => {
  const params = request.params as { id: string };
  const query = request.query as { userId?: string };
  const deleted = deleteMemory(params.id, query.userId);
  if (!deleted) return reply.code(404).send({ error: 'Memory item not found' });
  return { ok: true, id: params.id };
});

app.delete('/memory', async (request) => {
  const query = request.query as { userId?: string };
  clearMemories(query.userId);
  return { ok: true, cleared: true };
});

// 5. Autonomous Agent Run Endpoint
const agentRequestSchema = z.object({
  message: z.string().min(1).max(30000),
  conversationId: z.string().optional().default('default'),
  userId: z.string().optional().default('default'),
  mode: z.enum(['auto', 'max', 'fast']).default('auto'),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system', 'tool']),
      content: z.string(),
      name: z.string().optional(),
      tool_call_id: z.string().optional()
    })
  ).default([])
});

app.post('/agent/run', async (request, reply) => {
  const parsed = agentRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Invalid request', details: parsed.error.flatten() });
  }

  const { message, messages, mode, userId, conversationId } = parsed.data;
  const route = chooseRoute(mode, message);

  try {
    const result = await runOpenRouterAgent(messages, message, route.models, userId, conversationId);
    return result;
  } catch (error) {
    request.log.error(error);
    return reply.code(502).send({
      ok: false,
      error: error instanceof Error ? error.message : 'AI agent execution error'
    });
  }
});

// Launch server
app.listen({ port: config.port, host: '0.0.0.0' }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
