#!/usr/bin/env node
// /buddy-rename：给伙伴改名，累计 nameChanges 触发妲己路径

const { readState, updateState } = require('./lib/state.js');
const { runChecks } = require('./lib/progress-check.js');

function main() {
  const newName = process.argv.slice(2).join(' ').trim();
  const state = readState();

  if (!state.soul) {
    console.log('  你还没孵化伙伴，跑 /claude-buddy:buddy');
    return;
  }

  if (!newName) {
    console.log('  用法：/claude-buddy:buddy-rename 新名字');
    console.log(`  当前名字：${state.soul.name}`);
    return;
  }

  if (newName === state.soul.name) {
    console.log('  这就是它的名字啊');
    return;
  }

  const oldName = state.soul.name;
  const hp = state.hiddenProgress || {};
  const nameChanges = (hp.nameChanges || 0) + 1;

  const patch = {
    soul: { ...state.soul, name: newName },
    hiddenProgress: { ...hp, nameChanges },
  };

  // 跑解锁检查
  const merged = { ...state, ...patch };
  const checkResult = runChecks(merged);
  patch.unlocks = merged.unlocks;
  patch.achievements = merged.achievements;
  if (checkResult.notifications.length > 0) {
    patch.quip = merged.quip;
    patch.quipAt = merged.quipAt;
  }

  updateState(patch);

  console.log(`  改名：${oldName} → ${newName}`);
  console.log(`  （累计改名 ${nameChanges} 次）`);
  for (const n of checkResult.notifications) {
    console.log('  ' + n);
  }
}

try { main(); } catch (e) {
  console.error('rename error:', e.message);
  process.exit(1);
}
