// Quip 缓冲：批量预生成吐槽，Stop hook 从这里直接取不调 LLM
// 设计目标：
// 1. 一次 claude -p 调用批量生成 5 条吐槽（性价比高）
// 2. observer 取用时瞬时（无延迟）
// 3. 缓冲不足时后台异步补
// 4. 缓冲里每条带 mood + 生成时间，读取时过滤掉过期的（24h）

const MAX_BUFFER = 6;
const MIN_BUFFER_BEFORE_REFILL = 3;
const QUIP_TTL_MS = 24 * 3600 * 1000; // 24 小时

function isFresh(entry) {
  if (!entry || !entry.at) return false;
  return Date.now() - entry.at < QUIP_TTL_MS;
}

function readBuffer(state) {
  // 读取时自动过滤过期条目，保证调用方看到的总是"新鲜"缓冲
  const raw = Array.isArray(state.quipBuffer) ? state.quipBuffer : [];
  return raw.filter(isFresh);
}

// 取一条最合适当前 mood 的 quip，找不到就退化到任意新鲜 quip
function takeBestMatch(buffer, currentMood) {
  const fresh = buffer.filter(isFresh);
  if (fresh.length === 0) return { quip: null, remaining: [] };

  // 优先同 mood，其次 default，最后随便
  const byMood = fresh.find((e) => e.mood === currentMood);
  const byDefault = fresh.find((e) => e.mood === 'default');
  const picked = byMood || byDefault || fresh[0];
  const remaining = fresh.filter((e) => e !== picked);

  return { quip: picked.quip, mood: picked.mood, remaining };
}

function needsRefill(buffer) {
  const fresh = buffer.filter(isFresh);
  return fresh.length < MIN_BUFFER_BEFORE_REFILL;
}

function addQuips(buffer, newQuips, mood) {
  const fresh = buffer.filter(isFresh);
  const entries = newQuips.map((q) => ({ quip: q, mood, at: Date.now() }));
  return [...fresh, ...entries].slice(-MAX_BUFFER);
}

module.exports = {
  MAX_BUFFER,
  MIN_BUFFER_BEFORE_REFILL,
  readBuffer,
  takeBestMatch,
  needsRefill,
  addQuips,
};
