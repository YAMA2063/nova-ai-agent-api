import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { config } from './config.js';
import { chooseRoute, runOpenRouter } from './providers.js';
import { addMemory, listMemories } from './memory.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: config.corsOrigin });

app.get('/health', async () => ({ ok: true, service: 'nova-api', time: new Date().toISOString() }));

const requestSchema = z.object({
  message: z.string().min(1).max(20000),
  conversationId: z.string().optional(),
  mode: z.enum(['auto', 'max', 'fast']).default('auto'),
  messages: z.array(z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string() })).default([])
});

app.get('/memory', async (request) => {
  const q = request.query as { userId?: string };
  return { ok: true, memories: listMemories(q.userId) };
});

app.post('/memory', async (request, reply) => {
  const body = z.object({ text: z.string().min(1).max(5000), userId: z.string().optional() }).safeParse(request.body);
  if (!body.success) return reply.code(400).send({ error: 'Invalid request' });
  return { ok: true, memory: addMemory(body.data.text, body.data.userId) };
});

app.post('/agent/run', async (request, reply) => {
  const parsed = requestSchema.safeParse(request.body);
  if (!parsed.success) return reply.code(400).send({ error: 'Invalid request', details: parsed.error.flatten() });

  const { message, messages, mode } = parsed.data;
  const route = chooseRoute(mode, message);
  const useWeb = /(latest|today|current|price|news|recent|2026|search|research|compare)/i.test(message);

  try {
    const result = await runOpenRouter(messages, message, route.models, useWeb);
    return { ok: true, content: result.content, provider: result.provider, model: result.model, web: useWeb };
  } catch (error) {
    request.log.error(error);
    return reply.code(502).send({ error: error instanceof Error ? error.message : 'AI provider error' });
  }
});

app.listen({ port: config.port, host: '0.0.0.0' }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
