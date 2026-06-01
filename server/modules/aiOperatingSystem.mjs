import { clampText, nowISO, sanitizeText, uid } from '../lib/utils.mjs';

const ROUTE_RULES = [
  ['medical_assist', /\b(symptom|diagnosis|clinical|doctor|medicine|medical|health|lab result|radiology|pubmed)\b/i],
  ['live_information', /\b(today|now|current|latest|recent|live|news|weather|price|stock|sports|score|trend|release|near me)\b/i],
  ['project_planning', /\b(project|milestone|roadmap|plan|launch|build|sprint|scope|risk|blocker)\b/i],
  ['task_management', /\b(task|todo|to-do|deadline|due|next step|follow up|priority|assign)\b/i],
  ['goal_tracking', /\b(goal|objective|target|habit|progress|outcome|north star)\b/i],
  ['document_analysis', /\b(pdf|document|file|spreadsheet|screenshot|image|upload|analyze this|summarize this)\b/i],
  ['coding_help', /\b(code|bug|error|stack trace|api|function|component|deploy|database|repo|github)\b/i],
  ['business_analysis', /\b(market|customer|pricing|competitor|business|sales|revenue|strategy|product)\b/i],
  ['troubleshooting', /\b(fix|broken|failed|failure|not working|debug|issue|problem|crash|timeout)\b/i],
  ['creative_work', /\b(write|draft|rewrite|copy|brand|story|design|creative|script|post)\b/i],
  ['memory_lookup', /\b(remember|memory|what did i say|my preference|you know about me)\b/i],
  ['factual_question', /\b(who|what|when|where|why|how|explain|compare|best)\b/i]
];

export function classifyOperatingRequest({ text, route, mode }) {
  const clean = sanitizeText(text, 12_000);
  const matches = ROUTE_RULES.filter(([, pattern]) => pattern.test(clean)).map(([type]) => type);
  const routePrimary = route?.intent || route?.requestType || '';
  const primary = mode === 'medical' || route?.needsMedical
    ? 'medical_assist'
    : routePrimary || matches[0] || (clean.length < 80 ? 'casual_conversation' : 'general_analysis');
  const needsClarification = Boolean(route?.needsClarification) || (/\b(it|that|this|they|them)\b/i.test(clean) && clean.length < 36);
  const needsDeepReasoning = route?.complexity === 'deep' || /\b(strategy|architecture|roadmap|diagnose|compare|decision|tradeoff|root cause|plan)\b/i.test(clean);
  return {
    primary,
    tags: [...new Set([...(route?.candidateIntents || []).map((item) => item.type), ...(matches.length ? matches : [primary])])],
    confidence: Number(route?.confidence || (matches.length ? Math.min(0.95, 0.62 + matches.length * 0.08) : 0.52)),
    needsClarification,
    needsDeepReasoning,
    needsLiveData: Boolean(route?.needsFreshness || route?.needsWeb || matches.includes('live_information')),
    needsMemory: Boolean(route?.needsMemory),
    needsFiles: Boolean(route?.needsFiles),
    needsVerification: Boolean(route?.needsVerification)
  };
}

export function assembleOperatingContext({ db, user, text, route, mode, memories, tools, uploads, livePulse }) {
  ensureOperatingCollections(db);
  const classification = classifyOperatingRequest({ text, route, mode });
  const projects = activeForUser(db.projects, user.id, 5);
  const goals = activeForUser(db.goals, user.id, 5);
  const tasks = activeForUser(db.tasks, user.id, 8);
  const decisions = activeForUser(db.decisions, user.id, 5);
  const summaries = activeForUser(db.conversationSummaries, user.id, 3);
  const continuity = buildContinuityDigest(db, user.id);
  const livePulseSummary = summarizeLivePulse(livePulse);
  const health = estimateContextHealth({ db, user, memories, tools, uploads, classification, livePulse, route });
  const block = [
    'AI operating system context:',
    `- Request type: ${classification.primary}`,
    `- Request confidence: ${classification.confidence.toFixed(2)}`,
    `- Candidate intents: ${classification.tags.slice(0, 5).join(', ') || 'none'}`,
    `- Complexity: ${route?.complexity || 'unknown'}`,
    `- Deep reasoning: ${classification.needsDeepReasoning ? 'yes' : 'no'}`,
    `- Clarification useful: ${classification.needsClarification ? 'yes' : 'no'}`,
    `- Verification needed: ${classification.needsVerification ? 'yes' : 'no'}`,
    `- Context pressure: ${health.contextPressure}/100`,
    `- Live pulse: ${livePulseSummary.providerCount} free providers checked, ${livePulseSummary.externalProviderCount} external providers with usable items, at ${livePulseSummary.at || 'unavailable'}`,
    renderList('Active projects', projects, (item) => `${item.title}: ${item.summary || item.status || 'active'}`),
    renderList('Active goals', goals, (item) => `${item.title}: ${item.summary || item.status || 'active'}`),
    renderList('Open tasks', tasks, (item) => `${item.title}: ${item.priority || 'normal'} / ${item.status || 'active'}`),
    renderList('Recent decisions', decisions, (item) => `${item.title}: ${item.summary || item.status || 'active'}`),
    renderList('Conversation summaries', summaries, (item) => item.summary || item.content || item.title),
    continuity ? `Continuity digest:\n${continuity}` : ''
  ].filter(Boolean).join('\n');
  return { classification, health, livePulse: livePulseSummary, continuity, block: clampText(block, 6500) };
}

export async function recordOperatingOutcome(store, { user, text, answer, conversation, route, operatingContext, livePulse, answerQuality }) {
  const now = nowISO();
  const signals = extractWorkspaceSignals(text, answer);
  const livePulseSummary = summarizeLivePulse(livePulse);
  await store.update((db) => {
    ensureOperatingCollections(db);
    db.aiOperatingEvents.push({
      id: uid('os'),
      userId: user.id,
      conversationId: conversation.id,
      requestType: operatingContext.classification.primary,
      route,
      contextHealth: operatingContext.health,
      livePulse: livePulseSummary,
      answerQuality: answerQuality || null,
      signalCounts: {
        projects: signals.projects.length,
        goals: signals.goals.length,
        tasks: signals.tasks.length,
        decisions: signals.decisions.length
      },
      createdAt: now
    });
    trimOperatingEvents(db, user.id);
    upsertConversationSummary(db, { user, conversation, text, answer, route, answerQuality, now });
    for (const project of signals.projects) upsertSignal(db.projects, user.id, project, now, 'project');
    for (const goal of signals.goals) upsertSignal(db.goals, user.id, goal, now, 'goal');
    for (const task of signals.tasks) upsertSignal(db.tasks, user.id, task, now, 'task');
    for (const decision of signals.decisions) upsertSignal(db.decisions, user.id, decision, now, 'decision');
  });
}

export function ensureOperatingCollections(db) {
  for (const key of ['projects', 'goals', 'tasks', 'decisions', 'conversationSummaries', 'aiOperatingEvents']) {
    if (!Array.isArray(db[key])) db[key] = [];
  }
}

function activeForUser(items = [], userId, limit) {
  return (items || [])
    .filter((item) => item.userId === userId && item.status !== 'archived' && item.status !== 'done')
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
    .slice(0, limit);
}

function estimateContextHealth({ db, user, memories, tools, uploads, classification, livePulse, route }) {
  const livePulseSummary = summarizeLivePulse(livePulse);
  const messageCount = (db.messages || []).filter((item) => item.userId === user.id).length;
  const memoryCount = memories.length;
  const toolCount = tools.length;
  const uploadCount = uploads.length;
  const routeComplexity = route?.complexity === 'deep' ? 12 : route?.complexity === 'reasoned' ? 7 : 2;
  const contextPressure = Math.min(100, Math.round(messageCount / 8 + memoryCount * 5 + uploadCount * 7 + toolCount * 4 + routeComplexity));
  return {
    messageCount,
    memoryCount,
    toolCount,
    uploadCount,
    routeComplexity: route?.complexity || 'unknown',
    livePulseProviderCount: livePulseSummary.providerCount,
    livePulseExternalProviderCount: livePulseSummary.externalProviderCount,
    livePulseLatencyMs: livePulseSummary.latencyMs,
    contextPressure,
    liveDataMissing: classification.needsLiveData && toolCount === 0 && livePulseSummary.externalProviderCount === 0,
    memorySparse: classification.needsMemory && memoryCount === 0,
    fallbackRisk: contextPressure > 80 ? 'high' : contextPressure > 55 ? 'medium' : 'low'
  };
}

function summarizeLivePulse(livePulse) {
  const sources = Array.isArray(livePulse?.sources) ? livePulse.sources : [];
  const providers = sources.map((source) => source.provider).filter(Boolean);
  const failedProviders = sources
    .filter((source) => source.provider !== 'clock' && !source.ok)
    .map((source) => source.provider)
    .filter(Boolean);
  const externalProviderCount = sources.filter((source) => {
    return source.provider !== 'clock' && source.ok && Array.isArray(source.items) && source.items.length > 0;
  }).length;

  return {
    ok: Boolean(livePulse?.ok),
    free: Boolean(livePulse?.free),
    alwaysOn: Boolean(livePulse?.alwaysOn),
    at: livePulse?.at || '',
    query: livePulse?.query || '',
    cached: Boolean(livePulse?.cached),
    latencyMs: Number(livePulse?.latencyMs || 0),
    providerCount: sources.length,
    externalProviderCount,
    providers,
    failedProviders
  };
}

function buildContinuityDigest(db, userId) {
  const recentMessages = (db.messages || [])
    .filter((item) => item.userId === userId)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 8)
    .reverse();
  if (!recentMessages.length) return '';

  const userNeeds = recentMessages
    .filter((item) => item.role === 'user')
    .map((item) => `- User: ${clampText(item.content, 220)}`);
  const assistantOutcomes = recentMessages
    .filter((item) => item.role === 'assistant')
    .slice(-3)
    .map((item) => `- Assistant outcome: ${clampText(item.content, 220)}`);
  return clampText([...userNeeds, ...assistantOutcomes].join('\n'), 1800);
}

function renderList(title, items, mapper) {
  if (!items.length) return '';
  return `${title}:\n${items.map((item) => `- ${clampText(mapper(item), 240)}`).join('\n')}`;
}

function extractWorkspaceSignals(text, answer) {
  const joined = `${text}\n${answer}`;
  return {
    projects: extractMatches(joined, /(?:project|initiative|build|launch)[:\- ]+([^\n.]{4,160})/gi),
    goals: extractMatches(joined, /(?:goal|objective|target|north star)[:\- ]+([^\n.]{4,160})/gi),
    tasks: extractMatches(joined, /(?:task|todo|next step|action)[:\- ]+([^\n.]{4,160})/gi),
    decisions: extractMatches(joined, /(?:decision|decided|we will|we should|recommendation)[:\- ]+([^\n.]{4,200})/gi)
  };
}

function extractMatches(text, pattern) {
  const results = [];
  for (const match of text.matchAll(pattern)) {
    const title = sanitizeText(match[1], 200).replace(/^to\s+/i, '');
    if (title && !results.some((item) => item.title.toLowerCase() === title.toLowerCase())) {
      results.push({ title, summary: title, status: 'active', priority: /urgent|blocker|critical/i.test(title) ? 'high' : 'normal' });
    }
  }
  return results.slice(0, 6);
}

function upsertSignal(collection, userId, signal, now, prefix) {
  const existing = collection.find((item) => item.userId === userId && item.title.toLowerCase() === signal.title.toLowerCase());
  if (existing) {
    existing.summary = signal.summary || existing.summary;
    existing.status = signal.status || existing.status;
    existing.priority = signal.priority || existing.priority;
    existing.updatedAt = now;
    return;
  }
  collection.push({
    id: uid(prefix),
    userId,
    title: signal.title,
    summary: signal.summary || signal.title,
    status: signal.status || 'active',
    priority: signal.priority || 'normal',
    source: 'conversation',
    createdAt: now,
    updatedAt: now
  });
}

function upsertConversationSummary(db, { user, conversation, text, answer, route, answerQuality, now }) {
  const existing = db.conversationSummaries.find((item) => item.userId === user.id && item.conversationId === conversation.id);
  const previous = existing?.summary ? `${existing.summary}\n` : '';
  const latest = [
    `Latest user need: ${clampText(text, 600)}`,
    `Latest assistant outcome: ${clampText(answer, 700)}`,
    `Route: ${route?.intent || route?.requestType || 'unknown'} / ${route?.complexity || 'unknown'}`,
    answerQuality ? `Quality score: ${answerQuality.score}; issues: ${(answerQuality.issues || []).join(', ') || 'none'}` : ''
  ].filter(Boolean).join('\n');
  const summary = clampText(`${previous}${latest}`, 2200);

  if (existing) {
    existing.summary = summary;
    existing.messageCount = Number(existing.messageCount || 0) + 2;
    existing.updatedAt = now;
    return;
  }
  db.conversationSummaries.push({
    id: uid('sum'),
    userId: user.id,
    conversationId: conversation.id,
    title: conversation.title,
    summary,
    messageCount: 2,
    createdAt: now,
    updatedAt: now
  });
}

function trimOperatingEvents(db, userId) {
  const events = db.aiOperatingEvents.filter((item) => item.userId === userId);
  if (events.length <= 500) return;
  const keepIds = new Set(events
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 500)
    .map((item) => item.id));
  db.aiOperatingEvents = db.aiOperatingEvents.filter((item) => item.userId !== userId || keepIds.has(item.id));
}
