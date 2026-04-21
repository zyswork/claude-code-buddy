// 灵魂（name + personality）和运行时状态（quip、hatchedAt、petAt、muted）的持久化
// 骨骼不存——每次从 userId 算出来；这样用户改不了 config 伪造 legendary

const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_PATH = path.join(os.homedir(), '.claude', 'buddy-state.json');

function ensureDir() {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readState() {
  try {
    if (!fs.existsSync(STATE_PATH)) return migrateState({});
    const raw = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    return migrateState(raw);
  } catch (_e) {
    return migrateState({});
  }
}

// 随版本升级规范老存档：保证字段存在、类型正确
// 注意：starter 池物种永远隐式解锁，unlocks 只存非 starter 的
function migrateState(state) {
  // v0.3.0-alpha 字段
  if (!Array.isArray(state.unlocks)) state.unlocks = [];
  if (state.form === undefined) state.form = null; // null = 用 bones 投骰的物种做形态

  // v0.3.1 成长字段
  if (typeof state.xp !== 'number') state.xp = 0;
  if (typeof state.bond !== 'number') state.bond = 0;
  if (typeof state.petCount !== 'number') state.petCount = 0;
  if (!state.counters) state.counters = {};
  const c = state.counters;
  if (typeof c.totalTurns !== 'number') c.totalTurns = 0;
  if (typeof c.totalCommits !== 'number') c.totalCommits = 0;
  if (typeof c.totalDebugs !== 'number') c.totalDebugs = 0;
  if (typeof c.rmRfSightings !== 'number') c.rmRfSightings = 0;
  if (typeof c.lastDailyLogin !== 'string') c.lastDailyLogin = '';
  if (!Array.isArray(state.achievements)) state.achievements = [];

  // v0.3.2+ 隐藏进度
  if (!state.hiddenProgress) state.hiddenProgress = {};

  // v0.4.0 对话历史
  if (!Array.isArray(state.chatHistory)) state.chatHistory = [];

  // v0.5.0 墓地 + 每日任务
  if (!Array.isArray(state.graveyard)) state.graveyard = [];
  if (!state.daily) state.daily = { date: '', tasks: [], bonusClaimed: false };

  return state;
}

function writeState(state) {
  ensureDir();
  // 原子写：写临时文件再 rename，防止 observer 写、statusline 读同时发生时读到半截 JSON
  const tmpPath = STATE_PATH + '.tmp.' + process.pid;
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmpPath, STATE_PATH);
}

function updateState(patch) {
  const cur = readState();
  const next = { ...cur, ...patch };
  writeState(next);
  return next;
}

module.exports = { readState, writeState, updateState, STATE_PATH };
