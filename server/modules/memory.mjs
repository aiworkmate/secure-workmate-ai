import { nowISO, sanitizeText, uid } from '../lib/utils.mjs';

const VECTOR_SIZE = 384;
const stopWords = new Set('a an and are as at be by for from has have i in is it my of on or our that the this to was we with you your'.split(' '));

const KIND_WEIGHTS = {
  explicit: 0.2,
  profile: 0.18,
  preference: 0.16,
  project: 0.16,
  goal: 0.15,
  task: 0.12,
  decision: 0.14,
  semantic: 0.08
};

function hashToken(token) {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % VECTOR_SIZE;
}

export function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2 && !stopWords.has(item));
}

export function embedText(text) {
  const vector = new Array(VECTOR_SIZE).fill(0);
  for (const token of tokenize(text)) {
    vector[hashToken(token)] += 1;
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / norm).toFixed(6)));
}

export function cosine(a, b) {
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return aa && bb ? dot / (Math.sqrt(aa) * Math.sqrt(bb)) : 0;
}

export async function saveMemory(store, userId, content, metadata = {}) {
  const text = sanitizeText(content, 4000);
  if (!text) return null;
  const now = nowISO();
  const memory = {
    id: uid('mem'),
    userId,
    content: text,
    kind: metadata.kind || 'semantic',
    category: metadata.category || metadata.kind || 'semantic',
    tags: metadata.tags || [],
    source: metadata.source || 'chat',
    importance: boundedNumber(metadata.importance, 0.5),
    confidence: boundedNumber(metadata.confidence, 0.72),
    verificationState: metadata.verificationState || 'user-provided',
    embedding: embedText(text),
    createdAt: now,
    updatedAt: now,
    archived: false
  };
  await store.update((db) => {
    db.memories.push(memory);
  });
  return memory;
}

export function searchMemories(db, userId, query, limit = 6, options = {}) {
  const queryVector = embedText(query);
  const queryTokens = new Set(tokenize(query));
  const route = options.route || {};
  return (db.memories || [])
    .filter((item) => item.userId === userId && !item.archived)
    .map((item) => rankMemory(item, queryVector, queryTokens, route))
    .filter((item) => item.score > 0.12)
    .sort((a, b) => b.score - a.score || b.importance - a.importance || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    .slice(0, limit);
}

function rankMemory(item, queryVector, queryTokens, route) {
  const semanticScore = cosine(queryVector, item.embedding || []);
  const importance = boundedNumber(item.importance, 0.5);
  const confidence = boundedNumber(item.confidence, 0.7);
  const freshness = freshnessScore(item.updatedAt || item.createdAt);
  const kindBoost = KIND_WEIGHTS[item.kind] || KIND_WEIGHTS.semantic;
  const routeBoost = routeRelevance(item, route);
  const keywordOverlap = overlapScore(queryTokens, tokenize(`${item.content} ${(item.tags || []).join(' ')}`));
  const stalePenalty = freshness < 0.18 && !['profile', 'preference', 'explicit'].includes(item.kind) ? 0.06 : 0;
  const score = semanticScore * 0.52 + importance * 0.17 + confidence * 0.1 + freshness * 0.08 + kindBoost + routeBoost + keywordOverlap * 0.08 - stalePenalty;

  return {
    ...item,
    score: Number(Math.max(0, Math.min(1, score)).toFixed(4)),
    scoreParts: {
      semantic: Number(semanticScore.toFixed(4)),
      importance,
      confidence,
      freshness: Number(freshness.toFixed(4)),
      kindBoost,
      routeBoost,
      keywordOverlap: Number(keywordOverlap.toFixed(4))
    }
  };
}

function routeRelevance(item, route) {
  const kind = item.kind || item.category || 'semantic';
  const intent = route.intent || route.requestType || '';
  if (intent.includes('project') && ['project', 'goal', 'task', 'decision'].includes(kind)) return 0.1;
  if (intent.includes('task') && ['task', 'goal', 'project'].includes(kind)) return 0.09;
  if (intent.includes('goal') && ['goal', 'project', 'task'].includes(kind)) return 0.09;
  if (intent.includes('memory') && ['explicit', 'profile', 'preference'].includes(kind)) return 0.1;
  if (intent.includes('business') && ['project', 'decision', 'preference'].includes(kind)) return 0.06;
  if (intent.includes('medical') && (item.tags || []).includes('medical-context')) return 0.08;
  return 0;
}

function freshnessScore(value) {
  const time = Date.parse(value || '');
  if (!Number.isFinite(time)) return 0.35;
  const ageDays = Math.max(0, (Date.now() - time) / 86_400_000);
  if (ageDays <= 1) return 1;
  if (ageDays <= 7) return 0.85;
  if (ageDays <= 30) return 0.65;
  if (ageDays <= 180) return 0.42;
  return 0.22;
}

function overlapScore(queryTokens, memoryTokens) {
  if (!queryTokens.size || !memoryTokens.length) return 0;
  const memorySet = new Set(memoryTokens);
  let hits = 0;
  for (const token of queryTokens) {
    if (memorySet.has(token)) hits += 1;
  }
  return hits / Math.max(1, queryTokens.size);
}

export function extractMemoryCandidates(text, mode = 'general') {
  const input = sanitizeText(text, 6000);
  const candidates = [];
  const patterns = [
    { re: /\bremember(?: that)? ([^.?!]{8,220})/gi, kind: 'explicit', importance: 0.95, confidence: 0.9 },
    { re: /\bmy name is ([a-z][a-z\s'-]{1,80})/gi, kind: 'profile', importance: 0.9, confidence: 0.92 },
    { re: /\bi prefer ([^.?!]{4,180})/gi, kind: 'preference', importance: 0.76, confidence: 0.86 },
    { re: /\bi like ([^.?!]{4,180})/gi, kind: 'preference', importance: 0.68, confidence: 0.78 },
    { re: /\bi do not like ([^.?!]{4,180})/gi, kind: 'preference', importance: 0.72, confidence: 0.82 },
    { re: /\bi am working on ([^.?!]{6,220})/gi, kind: 'project', importance: 0.82, confidence: 0.82 },
    { re: /\bmy project is ([^.?!]{6,220})/gi, kind: 'project', importance: 0.82, confidence: 0.82 },
    { re: /\bmy goal is ([^.?!]{6,220})/gi, kind: 'goal', importance: 0.84, confidence: 0.84 },
    { re: /\bi need to ([^.?!]{6,180})/gi, kind: 'task', importance: 0.62, confidence: 0.7 },
    { re: /\bdeadline is ([^.?!]{4,140})/gi, kind: 'task', importance: 0.78, confidence: 0.76 },
    { re: /\bwe decided(?: to| that)? ([^.?!]{6,220})/gi, kind: 'decision', importance: 0.86, confidence: 0.84 },
    { re: /\bi want my ai ([^.?!]{6,220})/gi, kind: 'goal', importance: 0.8, confidence: 0.8 }
  ];

  for (const { re, kind, importance, confidence } of patterns) {
    for (const match of input.matchAll(re)) {
      const content = normalizeCandidate(match[1]);
      if (!content || candidates.some((item) => item.content.toLowerCase() === content.toLowerCase())) continue;
      candidates.push({
        content,
        kind,
        category: kind,
        importance,
        confidence,
        verificationState: 'user-provided',
        tags: mode === 'medical' ? ['medical-context'] : []
      });
    }
  }
  return candidates.slice(0, 8);
}

export async function absorbMemories(store, userId, text, mode) {
  const saved = [];
  for (const item of extractMemoryCandidates(text, mode)) {
    const existing = store.snapshot().memories.find((memory) => {
      return memory.userId === userId && memory.content.toLowerCase() === item.content.toLowerCase() && !memory.archived;
    });
    if (!existing) {
      saved.push(await saveMemory(store, userId, item.content, item));
    }
  }
  return saved.filter(Boolean);
}

function normalizeCandidate(value) {
  return sanitizeText(value, 240)
    .replace(/^that\s+/i, '')
    .replace(/^to\s+/i, '')
    .replace(/[;:,.\s]+$/g, '')
    .trim();
}

function boundedNumber(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(1, number));
}
