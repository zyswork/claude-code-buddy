#!/usr/bin/env node
// PreToolUse hook：每次工具调用前触发
// 职责：侦测 git commit / rm -rf 等关键命令，累计到 state.counters
// 绝不阻塞或修改 tool 调用本身，永远输出空退出

const fs = require('fs');
const { readState, updateState } = require('./lib/state.js');
const { applyReward } = require('./lib/progression.js');
const { runChecks } = require('./lib/progress-check.js');

// 递归守卫（跟 observer 一样防止 claude -p 派生的进程污染）
if (process.env.BUDDY_OBSERVER_DISABLE === '1') process.exit(0);

function readHookInput() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (_e) {
    return {};
  }
}

// 从 Bash tool 的 command 字段判断是啥
function detectBashEvent(command) {
  if (typeof command !== 'string') return null;
  const c = command.trim();

  // git commit（排除 --amend 和 --dry-run）
  if (/\bgit\s+commit\b/.test(c) && !/--dry-run/.test(c)) return 'commit';

  // rm -rf（各种变体）
  if (/\brm\b.+-[a-z]*r[a-z]*f|\brm\b.+-[a-z]*f[a-z]*r/.test(c)) return 'rm_rf';

  return null;
}

function main() {
  const input = readHookInput();
  const toolName = input.tool_name || input.tool || '';
  const toolInput = input.tool_input || input.input || {};

  let event = null;
  if (toolName === 'Bash') {
    event = detectBashEvent(toolInput.command);
  }

  if (!event) return;

  const state = readState();
  if (!state.soul) return;

  // 累计 counter
  const counters = { ...state.counters };
  if (event === 'commit') counters.totalCommits = (counters.totalCommits || 0) + 1;
  if (event === 'rm_rf') counters.rmRfSightings = (counters.rmRfSightings || 0) + 1;

  // 奖励 XP/bond
  const reward = applyReward(state, event);

  const patch = {
    counters,
    xp: reward.xp,
    bond: reward.bond,
  };

  // 目睹 rm -rf 触发专属吐槽
  if (event === 'rm_rf' && !state.muted) {
    patch.quip = '😱 老天，你干啥！';
    patch.quipAt = Date.now();
  }

  // 跑 progress 检查（成就/隐藏角色解锁）
  const merged = { ...state, ...patch };
  const checkResult = runChecks(merged);
  patch.unlocks = merged.unlocks;
  patch.achievements = merged.achievements;
  if (checkResult.notifications.length > 0) {
    patch.quip = merged.quip;
    patch.quipAt = merged.quipAt;
  }

  updateState(patch);
}

try { main(); } catch (e) {
  if (process.env.BUDDY_DEBUG) console.error('[preToolUse]', e);
}
