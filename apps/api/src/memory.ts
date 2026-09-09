export type Memory = { id: string; text: string; createdAt: string };
const memories = new Map<string, Memory[]>();

export function listMemories(userId = 'default') { return memories.get(userId) ?? []; }
export function addMemory(text: string, userId = 'default') {
  const item: Memory = { id: `${Date.now()}-${Math.random()}`, text, createdAt: new Date().toISOString() };
  memories.set(userId, [...listMemories(userId), item].slice(-100));
  return item;
}
