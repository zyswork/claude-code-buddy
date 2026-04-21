#!/usr/bin/env node
// SessionStart hook：每次 Claude Code 新建/恢复 session 时触发
// 职责：
//   1. 每日首次登录 +XP +bond
//   2. 一天没摸/没聊的话，buddy 主动发起问候写进 quip
// 静默失败，永远不阻塞

const fs = require('fs');
const { readState, updateState } = require('./lib/state.js');
const { applyReward } = require('./lib/progression.js');
const { computeMood, MOODS } = require('./lib/mood.js');
const { runChecks } = require('./lib/progress-check.js');
const { emitEvent } = require('./lib/events.js');

if (process.env.BUDDY_OBSERVER_DISABLE === '1') process.exit(0);

// 主动问候问题池（按心情分）
const GREETINGS = {
  lonely: ['你去哪了啊？', '好久没说话了', '我都长蘑菇了', '想我没'],
  hungry: ['很久没摸我了...', '一下下就好嘛', '一天没互动我会缩小'],
  tired: ['今天也要加班？', '早点睡', '我困了先眯一会'],
  happy: ['今天打算写啥？', '心情看起来不错', '要开始新的 commit 了吗'],
  focused: ['继续吧', '我在看着', '有事随时叫我'],
  grumpy: ['昨天的 bug 搞定了吗', '深呼吸', '今天顺利点吧'],
  ecstatic: ['你好好哦', '今天也要一起写代码', '冲鸭'],
  shiny: ['我超级有精神！', '今天状态起飞', '来吧代码！'],
};

function pickGreeting(mood) {
  const pool = GREETINGS[mood] || GREETINGS.focused;
  return pool[Math.floor(Math.random() * pool.length)];
}

function main() {
  try {
    // hook input 我们不需要读
    fs.readFileSync(0, 'utf8');
  } catch (_e) { /* ok */ }

  const state = readState();
  if (!state.soul || state.muted) return;

  const today = new Date().toISOString().slice(0, 10);
  const lastLogin = state.counters?.lastDailyLogin || '';
  const isNewDay = lastLogin !== today;

  const patch = {};

  // 每日首次登录奖励
  if (isNewDay) {
    const reward = applyReward(state, 'dailyLogin');
    patch.xp = reward.xp;
    patch.bond = reward.bond;
    patch.counters = { ...state.counters, lastDailyLogin: today };
    emitEvent('daily_login', { date: today });
  }

  // 主动问候（每日首次 session 且 quip 已过期）
  const quipAge = state.quipAt ? Date.now() - state.quipAt : Infinity;
  const shouldGreet = isNewDay && quipAge > 60 * 60 * 1000;
  if (shouldGreet) {
    const mood = computeMood({ ...state, ...patch });
    patch.quip = pickGreeting(mood);
    patch.quipAt = Date.now();
    patch.quipSource = 'greeting';
    emitEvent('greeting', { mood, text: patch.quip });
  }

  if (Object.keys(patch).length === 0) return;

  // 跑检测
  const merged = { ...state, ...patch };
  const r = runChecks(merged);
  patch.unlocks = merged.unlocks;
  patch.achievements = merged.achievements;
  if (r.notifications.length > 0) {
    patch.quip = merged.quip;
    patch.quipAt = merged.quipAt;
  }

  updateState(patch);
}

try { main(); } catch (e) {
  if (process.env.BUDDY_DEBUG) console.error('[sessionStart]', e);
}
