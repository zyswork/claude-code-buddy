#!/usr/bin/env node
// /buddy-pet：摸摸伙伴，奖励 bond + XP，检查升级

const { readState, updateState } = require('./lib/state.js');
const {
  applyReward, pickLevelUpQuip, pickEvolutionQuip, xpProgress,
} = require('./lib/progression.js');
const { runChecks } = require('./lib/progress-check.js');

function main() {
  const state = readState();
  if (!state.soul) {
    console.log('  你还没孵化伙伴，跑 /claude-buddy:buddy');
    return;
  }

  const reward = applyReward(state, 'pet');
  const patch = {
    xp: reward.xp,
    bond: reward.bond,
    petCount: (state.petCount || 0) + 1,
  };

  // 升级/进化会生成特殊 quip 立即显示
  if (reward.evolved) {
    patch.quip = pickEvolutionQuip(reward.evolution);
    patch.quipAt = Date.now();
  } else if (reward.leveledUp) {
    patch.quip = pickLevelUpQuip() + ' Lv' + reward.level;
    patch.quipAt = Date.now();
  }

  // 先合并 patch 到一个临时 state 对象再跑 runChecks
  const merged = { ...state, ...patch };
  const checkResult = runChecks(merged);
  // runChecks 修改了 merged.unlocks / achievements / quip
  patch.unlocks = merged.unlocks;
  patch.achievements = merged.achievements;
  if (checkResult.notifications.length > 0) {
    patch.quip = merged.quip;
    patch.quipAt = merged.quipAt;
  }

  updateState(patch);

  // 输出解锁通知（如果有）
  for (const n of checkResult.notifications) {
    console.log('  ' + n);
  }

  // 输出
  console.log('  ❤ ❤ ❤');
  console.log('  ' + state.soul.name + ' 开心地蹭了蹭你');
  console.log(`  XP +${reward.xpDelta}  ♥ +${reward.bondDelta}   累计被摸 ${patch.petCount} 次`);

  if (reward.leveledUp) {
    console.log('  ');
    console.log(`  ✨ 升级到 Lv ${reward.level}！`);
  }
  if (reward.evolved) {
    const EVOLUTION_LABELS = require('./lib/progression.js').EVOLUTION_LABELS;
    console.log('  ');
    console.log(`  ✦ 进化到 ${EVOLUTION_LABELS[reward.evolution]} 形态！`);
  }

  // 彩蛋：摸 100 次
  if (patch.petCount === 100 && state.soul) {
    console.log(`  （${state.soul.name} 小声说："你是不是太闲了..."）`);
  }
}

try { main(); } catch (e) {
  console.error('pet error:', e.message);
  process.exit(1);
}
