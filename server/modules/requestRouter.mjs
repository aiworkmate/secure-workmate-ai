import { sanitizeText } from '../lib/utils.mjs';
import { isMedicalQuery } from './medical.mjs';

const ROUTE_DEFINITIONS = [
  { type: 'medical_assist', weight: 10, pattern: /\b(symptom|diagnosis|clinical|doctor|medicine|medical|health|lab result|radiology|pubmed|trial|dose|treatment|patient)\b/i },
  { type: 'live_information', weight: 9, pattern: /\b(today|now|current|latest|recent|live|breaking|news|weather|forecast|price|stock|sports|score|trend|release|near me|open now|hours)\b/i },
  { type: 'file_grounded_chat', weight: 9, pattern: /\b(upload|attached|file|pdf|document|spreadsheet|screenshot|image|docx|csv|analyze this|summarize this)\b/i },
  { type: 'project_planning', weight: 8, pattern: /\b(project|milestone|roadmap|launch|build|sprint|scope|risk|blocker|timeline|architecture)\b/i },
  { type: 'task_management', weight: 8, pattern: /\b(task|todo|to-do|deadline|due|next step|follow up|priority|assign|checklist)\b/i },
  { type: 'goal_tracking', weight: 7, pattern: /\b(goal|objective|target|habit|progress|outcome|north star|kpi|metric)\b/i },
  { type: 'memory_lookup', weight: 7, pattern: /\b(remember|memory|what did i say|my preference|you know about me|save this|forget)\b/i },
  { type: 'coding_help', weight: 7, pattern: /\b(code|bug|error|stack trace|api|function|component|deploy|database|repo|github|vercel|supabase|endpoint|404|500)\b/i },
  { type: 'business_analysis', weight: 6, pattern: /\b(market|customer|pricing|competitor|business|sales|revenue|strategy|product|growth|offer)\b/i },
  { type: 'troubleshooting', weight: 6, pattern: /\b(fix|broken|failed|failure|not working|debug|issue|problem|crash|timeout|blank|stuck)\b/i },
  { type: 'creative_work', weight: 5, pattern: /\b(write|draft|rewrite|copy|brand|story|design|creative|script|post|email)\b/i },
  { type: 'factual_question', weight: 4, pattern: /\b(who|what|when|where|why|how|explain|compare|best|which)\b/i }
];

const TOOL_PATTERNS = {
  calculator: /\b(calculate|compute|solve|math|percent|percentage|formula)\b/i,
  weather: /\b(weather|forecast|temperature|rain|snow|humidity|wind)\b/i,
  news: /\b(news|headline|breaking|latest|recent|today|current event)\b/i,
  research: /\b(research|source|sources|study|pubmed|clinical trial|evidence|paper)\b/i,
  location: /\b(near me|open now|hours|map|location|restaurant|store|travel|flight)\b/i
};

export function routeRequest({ text, mode = 'general', enableLive = true, enableMemory = true, uploadIds = [] } = {}) {
  const clean = sanitizeText(text, 12_000);
  const medical = mode === 'medical' || isMedicalQuery(clean);
  const scores = scoreRoutes(clean);

  if (medical) bumpScore(scores, 'medical_assist', 14);
  if (uploadIds.length) bumpScore(scores, 'file_grounded_chat', 12);

  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score > 0);
  const primary = ranked[0]?.[0] || (clean.length < 80 ? 'casual_conversation' : 'general_analysis');
  const secondScore = ranked[1]?.[1] || 0;
  const topScore = ranked[0]?.[1] || 2;
  const confidence = Math.max(0.45, Math.min(0.97, 0.48 + topScore / 24 - secondScore / 60));
  const toolSignals = detectToolSignals(clean, medical);
  const needsFreshness = Boolean(enableLive && (toolSignals.weather || toolSignals.news || toolSignals.location || ranked.some(([type]) => type === 'live_information')));
  const needsWeb = Boolean(enableLive && (needsFreshness || toolSignals.research || medical));
  const needsTools = Boolean(toolSignals.calculator || toolSignals.weather || toolSignals.news || toolSignals.research || toolSignals.location || medical || needsWeb);
  const needsClarification = shouldClarify(clean, confidence, uploadIds.length > 0);
  const complexity = estimateComplexity(clean, ranked, uploadIds.length);

  return {
    intent: primary,
    requestType: primary,
    candidateIntents: ranked.slice(0, 4).map(([type, score]) => ({ type, score })),
    confidence: Number(confidence.toFixed(2)),
    complexity,
    needsTools,
    needsMemory: Boolean(enableMemory),
    needsWeb,
    needsFreshness,
    needsFiles: uploadIds.length > 0 || primary === 'file_grounded_chat',
    needsMedical: medical,
    needsClarification,
    needsVerification: needsWeb || medical || complexity !== 'simple' || ['business_analysis', 'coding_help', 'troubleshooting', 'factual_question'].includes(primary),
    toolSignals,
    liveBaseline: true
  };
}

function scoreRoutes(text) {
  const scores = new Map();
  for (const definition of ROUTE_DEFINITIONS) {
    if (definition.pattern.test(text)) bumpScore(scores, definition.type, definition.weight);
  }

  const lower = text.toLowerCase();
  if (/\b(make|turn|become|upgrade|stronger|smarter|world class)\b/.test(lower)) {
    bumpScore(scores, 'project_planning', 4);
    bumpScore(scores, 'business_analysis', 2);
  }
  if (/\b(should i|decide|choice|option|tradeoff|pros and cons)\b/.test(lower)) {
    bumpScore(scores, 'business_analysis', 4);
    bumpScore(scores, 'factual_question', 2);
  }
  if (/\b(login|auth|session|request failed|404|500|deploy|production)\b/.test(lower)) {
    bumpScore(scores, 'troubleshooting', 5);
    bumpScore(scores, 'coding_help', 4);
  }

  return scores;
}

function bumpScore(scores, type, amount) {
  scores.set(type, (scores.get(type) || 0) + amount);
}

function detectToolSignals(text, medical) {
  return {
    calculator: TOOL_PATTERNS.calculator.test(text),
    weather: TOOL_PATTERNS.weather.test(text),
    news: TOOL_PATTERNS.news.test(text),
    research: TOOL_PATTERNS.research.test(text) || medical,
    location: TOOL_PATTERNS.location.test(text)
  };
}

function shouldClarify(text, confidence, hasUploads) {
  if (!text || text.length < 4) return true;
  if (hasUploads) return false;
  if (/^(it|that|this|they|them|do it|fix it|try it)$/i.test(text.trim())) return true;
  if (confidence < 0.55 && text.length < 48 && /\b(it|that|this|one|thing)\b/i.test(text)) return true;
  return false;
}

function estimateComplexity(text, ranked, uploadCount) {
  const words = text.split(/\s+/).filter(Boolean).length;
  if (uploadCount > 0 || words > 140 || ranked.length >= 4) return 'deep';
  if (words > 40 || ranked.length >= 2 || /\b(strategy|architecture|roadmap|diagnose|compare|decision|tradeoff|root cause|plan|analyze)\b/i.test(text)) return 'reasoned';
  return 'simple';
}
