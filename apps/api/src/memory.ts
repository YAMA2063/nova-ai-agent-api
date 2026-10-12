import fs from 'node:fs';
import path from 'node:path';

export type MemoryCategory = 'profile' | 'preference' | 'fact' | 'task' | 'project' | 'general';

export type Memory = {
  id: string;
  text: string;
  category: MemoryCategory;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  relevanceScore?: number;
};

const memoriesStore = new Map<string, Memory[]>();
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'memories.json');

// Initialize store from disk if present
function loadFromDisk(): void {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        for (const [userId, items] of Object.entries(parsed)) {
          if (Array.isArray(items)) {
            memoriesStore.set(userId, items);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[NOVA Memory] Failed to load memories from disk:', err);
  }
}

function persistToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data: Record<string, Memory[]> = {};
    for (const [userId, items] of memoriesStore.entries()) {
      data[userId] = items;
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Disk write might fail on serverless or read-only containers; silently keep in-memory
  }
}

// Load on startup
loadFromDisk();

function detectCategory(text: string): MemoryCategory {
  const lower = text.toLowerCase();
  if (/(nama|umur|tinggal|lokasi|pekerjaan|role|status|biodata|profile|i am|my name|i live)/i.test(lower)) return 'profile';
  if (/(suka|favorit|preferensi|senang|hobi|benci|tidak suka|prefer|like|love|hate|favorite)/i.test(lower)) return 'preference';
  if (/(tugas|todo|task|deadline|ingatkan|jadwal|reminder|target|milestone)/i.test(lower)) return 'task';
  if (/(project|proyek|repo|aplikasi|fitur|stack|backend|frontend|api)/i.test(lower)) return 'project';
  if (/(fakta|catatan|aturan|rule|info|data)/i.test(lower)) return 'fact';
  return 'general';
}

function extractTags(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !['dan', 'yang', 'dari', 'untuk', 'pada', 'the', 'and', 'with', 'this', 'that'].includes(w));
  return Array.from(new Set(words)).slice(0, 8);
}

export function listMemories(userId = 'default'): Memory[] {
  return memoriesStore.get(userId) ?? [];
}

export function addMemory(
  text: string,
  userId = 'default',
  category?: MemoryCategory,
  tags?: string[]
): Memory {
  const cleanText = text.trim();
  const current = listMemories(userId);

  // Check for duplicate or near-identical text to avoid bloat
  const existingIndex = current.findIndex((m) => m.text.toLowerCase() === cleanText.toLowerCase());
  if (existingIndex !== -1) {
    const updated: Memory = {
      ...current[existingIndex],
      updatedAt: new Date().toISOString()
    };
    current[existingIndex] = updated;
    memoriesStore.set(userId, current);
    persistToDisk();
    return updated;
  }

  const detectedCat = category || detectCategory(cleanText);
  const detectedTags = tags && tags.length ? tags : extractTags(cleanText);

  const item: Memory = {
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    text: cleanText,
    category: detectedCat,
    tags: detectedTags,
    createdAt: new Date().toISOString()
  };

  const updatedList = [item, ...current].slice(0, 200);
  memoriesStore.set(userId, updatedList);
  persistToDisk();
  return item;
}

export function searchMemories(query: string, userId = 'default', limit = 5): Memory[] {
  const current = listMemories(userId);
  if (!current.length || !query.trim()) return [];

  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  if (!queryTerms.length) return current.slice(0, limit);

  const scored = current.map((mem) => {
    let score = 0;
    const lowerText = mem.text.toLowerCase();

    // Exact phrase match bonus
    if (lowerText.includes(query.toLowerCase())) {
      score += 10;
    }

    // Term match bonus
    for (const term of queryTerms) {
      if (lowerText.includes(term)) {
        score += 3;
      }
      if (mem.tags.some((t) => t.includes(term))) {
        score += 2;
      }
      if (mem.category.toLowerCase() === term) {
        score += 4;
      }
    }

    return { ...mem, relevanceScore: score };
  });

  return scored
    .filter((m) => (m.relevanceScore ?? 0) > 0)
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
    .slice(0, limit);
}

export function deleteMemory(id: string, userId = 'default'): boolean {
  const current = listMemories(userId);
  const next = current.filter((m) => m.id !== id);
  if (next.length !== current.length) {
    memoriesStore.set(userId, next);
    persistToDisk();
    return true;
  }
  return false;
}

export function clearMemories(userId = 'default'): void {
  memoriesStore.delete(userId);
  persistToDisk();
}
