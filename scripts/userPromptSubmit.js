#!/usr/bin/env node
// UserPromptSubmit hook：用户每次发消息都触发
// 职责：
//   1. 检测 prompt 里的 debug 关键词 → debug counter++
//   2. 检测 Konami 密语 → 立刻触发彩蛋 quip
// 绝不阻塞用户 prompt，静默退出

const fs = require('fs');
const { readState, updateState } = require('./lib/state.js');
const { applyReward } = require('./lib/progression.js');
const { runChecks } = require('./lib/progress-check.js');
const { checkKonami } = require('./lib/easter-eggs.js');
const { emitEvent } = require('./lib/events.js');

if (process.env.BUDDY_OBSERVER_DISABLE === '1') process.exit(0);

function readHookInput() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (_e) { return {}; }
}

// debug 关键词（用户自述）
const DEBUG_KEYWORDS = /\b(bug|fix|debug|error|exception|crash|broken)\b|修|调试|报错|异常|崩溃|不work/i;

function main() {
  const input = readHookInput();
  const prompt = input.prompt || input.user_message || input.message || '';
  if (!prompt) return;

  const state = readState();
  if (!state.soul) return;

  const patch = {};

  // ── Konami 密语（最高优先级）──
  const konamiQuip = checkKonami(prompt);
  if (konamiQuip) {
    patch.quip = konamiQuip;
    patch.quipAt = Date.now();
    patch.quipSource = 'konami';
    emitEvent('konami', { prompt: prompt.slice(0, 100), response: konamiQuip });
  }

  // ── Debug 关键词 ──
  const isDebug = DEBUG_KEYWORDS.test(prompt);
  if (isDebug) {
    const counters = { ...state.counters, totalDebugs: (state.counters?.totalDebugs || 0) + 1 };
    patch.counters = counters;
    const reward = applyReward(state, 'debug');
    patch.xp = reward.xp;
    patch.bond = reward.bond;
    emitEvent('debug_keyword', { prompt: prompt.slice(0, 100), totalDebugs: counters.totalDebugs });
  }

  // ── 连续 debug streak（九头蛇解锁路径）──
  const hp = state.hiddenProgress || {};
  const nextStreak = isDebug ? (hp.debugStreak || 0) + 1 : 0;
  if (nextStreak !== (hp.debugStreak || 0)) {
    patch.hiddenProgress = { ...hp, debugStreak: nextStreak };
  }

  if (Object.keys(patch).length === 0) return;

  // 跑进度检查
  const merged = { ...state, ...patch };
  const checkResult = runChecks(merged);
  patch.unlocks = merged.unlocks;
  patch.achievements = merged.achievements;
  // 解锁通知比 debug/konami 优先级更高
  if (checkResult.notifications.length > 0) {
    patch.quip = merged.quip;
    patch.quipAt = merged.quipAt;
  }

  updateState(patch);
}

try { main(); } catch (e) {
  if (process.env.BUDDY_DEBUG) console.error('[userPromptSubmit]', e);
}
