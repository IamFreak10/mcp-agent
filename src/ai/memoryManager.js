// memoryManager.js — Scored RAG Search
import { APP_MEMORY } from '../cache/globalCache';

// কোন query-তে কোন category relevant সেটা বোঝার জন্য
const CATEGORY_KEYWORDS = {
  contacts: [
    'contact',
    'person',
    'who',
    'call',
    'phone',
    'email',
    'meet',
    'কন্টাক',
    'মানুষ',
    'ফোন',
    'নাম',
    'data',
    'details',
  ],
  meetings: [
    'meeting',
    'schedule',
    'calendar',
    'appointment',
    'event',
    'মিটিং',
    'সভা',
    'সময়',
  ],
  tasks: [
    'task',
    'todo',
    'work',
    'pending',
    'done',
    'টাস্ক',
    'কাজ',
    'করতে হবে',
  ],
  notes: ['note', 'remember', 'info', 'নোট', 'মনে রাখো'],
};

function scoreItem(item, queryTokens) {
  const itemStr = JSON.stringify(item).toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (token.length < 2) continue;
    if (itemStr.includes(token)) {
      score += token.length > 4 ? 3 : 1;
    } else {
      // fuzzy: token-এর প্রথম 4 character দিয়ে match করো
      const prefix = token.substring(0, 4);
      if (prefix.length >= 3 && itemStr.includes(prefix)) {
        score += 1;
      }
    }
  }
  return score;
}

// Query থেকে meaningful tokens বের করা
function tokenize(query) {
  return query
    .toLowerCase()
    .split(/\s+|[,।?!]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

// কোন categories দরকার সেটা detect করা
function detectRelevantCategories(queryTokens) {
  const relevant = [];
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matched = queryTokens.some((t) =>
      keywords.some((k) => k.includes(t) || t.includes(k))
    );
    if (matched) relevant.push(cat);
  }
  // কিছু না মিললে সব return করো
  return relevant.length > 0 ? relevant : Object.keys(CATEGORY_KEYWORDS);
}

export function findRelevantMemory(query, options = {}) {
  const { maxPerCategory = 10, minScore = 0 } = options;
  const memory = APP_MEMORY.getAll();
  const queryTokens = tokenize(query);
  const relevantCategories = detectRelevantCategories(queryTokens);

  console.log('[RAG] Query tokens:', queryTokens);
  console.log('[RAG] Relevant categories:', relevantCategories);

  const result = { contacts: [], meetings: [], tasks: [], notes: [] };

  for (const cat of relevantCategories) {
    const items = memory[cat] || [];
    if (items.length === 0) continue;

    // Generic "show all" query হলে সব return করো
    const isGeneric = ['all', 'list', 'show', 'সব', 'দেখাও','give all'].some((k) =>
      queryTokens.includes(k)
    );

    if (isGeneric) {
      result[cat] = items.slice(0, maxPerCategory);
    } else {
      // Score করে sort করো
      const scored = items
        .map((item) => ({ item, score: scoreItem(item, queryTokens) }))
        .filter(({ score }) => score > minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxPerCategory)
        .map(({ item }) => item);

      result[cat] = scored;
    }
  }

  const totalFound = Object.values(result).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  console.log(`[RAG] Found ${totalFound} relevant items`);

  return result;
}

// Cache-এ কিছু আছে কিনা check করা (tool call এড়াতে)
export function hasDataInCache(category) {
  return APP_MEMORY.has(category);
}

// Memory summary বানানো (context-এ দেওয়ার জন্য)
export function buildMemorySummary() {
  const data = APP_MEMORY.getAll();
  const lines = [];
  if (data.contacts.length > 0)
    lines.push(`${data.contacts.length} contacts available`);
  if (data.meetings.length > 0)
    lines.push(`${data.meetings.length} meetings scheduled`);
  if (data.tasks.length > 0) lines.push(`${data.tasks.length} tasks in queue`);
  return lines.join(', ') || 'No data loaded yet';
}
