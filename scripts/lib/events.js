// 事件总线：所有 hook 的业务事件都走这里
// 设计：append-only JSONL 到 ~/.claude/buddy-events.jsonl
// 读取时反向取最近 N 条即可；文件到 5MB 触发轮转（旧的 → .1）

const fs = require('fs');
const os = require('os');
const path = require('path');

const EVENTS_PATH = path.join(os.homedir(), '.claude', 'buddy-events.jsonl');
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function ensureDir() {
  const dir = path.dirname(EVENTS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function rotateIfNeeded() {
  try {
    if (!fs.existsSync(EVENTS_PATH)) return;
    const stat = fs.statSync(EVENTS_PATH);
    if (stat.size < MAX_SIZE) return;
    fs.renameSync(EVENTS_PATH, EVENTS_PATH + '.1'); // 简单轮转：旧的覆盖
  } catch (_e) { /* 静默 */ }
}

// 发射事件，永远不抛异常
function emitEvent(type, data = {}) {
  try {
    ensureDir();
    rotateIfNeeded();
    const event = { type, at: Date.now(), ...data };
    fs.appendFileSync(EVENTS_PATH, JSON.stringify(event) + '\n', 'utf8');
  } catch (e) {
    if (process.env.BUDDY_DEBUG) console.error('[events] emit failed', e);
  }
}

// 读取最近 N 条事件（从文件尾）
function readEvents(limit = 1000) {
  try {
    if (!fs.existsSync(EVENTS_PATH)) return [];
    const raw = fs.readFileSync(EVENTS_PATH, 'utf8');
    const lines = raw.split('\n').filter(Boolean);
    const slice = lines.slice(-limit);
    const events = [];
    for (const line of slice) {
      try { events.push(JSON.parse(line)); } catch (_e) { /* skip bad lines */ }
    }
    return events;
  } catch (e) {
    if (process.env.BUDDY_DEBUG) console.error('[events] read failed', e);
    return [];
  }
}

// 按时间过滤
function filterSince(events, sinceMs) {
  const threshold = Date.now() - sinceMs;
  return events.filter((e) => e.at >= threshold);
}

// 按类型过滤
function filterType(events, type) {
  if (!type) return events;
  return events.filter((e) => e.type === type);
}

// 常用时间窗口常量
const WINDOWS = {
  hour: 3600 * 1000,
  day: 24 * 3600 * 1000,
  week: 7 * 24 * 3600 * 1000,
  month: 30 * 24 * 3600 * 1000,
};

module.exports = {
  EVENTS_PATH,
  emitEvent,
  readEvents,
  filterSince,
  filterType,
  WINDOWS,
};
