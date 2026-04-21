#!/usr/bin/env node
// /buddy-retire：Lv 99 满级伙伴退休，存入墓地，下次 /buddy 可重新孵化第二只

const { readState, updateState } = require('./lib/state.js');
const { roll, companionUserId } = require('./lib/roll.js');
const { computeLevel } = require('./lib/progression.js');
const { getCharacter, currentFormId } = require('./lib/characters.js');

const RETIRE_LEVEL = 99;

function main() {
  const state = readState();
  if (!state.soul) {
    console.log('  你还没孵化伙伴');
    return;
  }

  const level = computeLevel(state.xp || 0);
  if (level < RETIRE_LEVEL) {
    console.log(`  ${state.soul.name} 还没到退休年龄（需要 Lv ${RETIRE_LEVEL}，当前 Lv ${level}）`);
    console.log(`  传说中的英雄没有轻言告别的权利。`);
    return;
  }

  const confirm = process.argv.includes('--confirm');
  if (!confirm) {
    console.log('');
    console.log(`  ⚠️  你真的要送 ${state.soul.name} 退休吗？`);
    console.log('');
    console.log('  退休后：');
    console.log('    - 所有属性、成就、XP、亲密度会被存入墓地，永久留档');
    console.log('    - 下次 /buddy 会让你孵化第二只（新灵魂，主角色可选）');
    console.log('    - 已解锁的隐藏角色保留');
    console.log('');
    console.log(`  确认退休请跑：/claude-buddy:buddy-retire confirm`);
    console.log('');
    return;
  }

  // 写入墓地
  const bones = roll(companionUserId());
  const formId = currentFormId(state, bones.species);
  const character = getCharacter(formId);
  const days = Math.floor((Date.now() - state.soul.hatchedAt) / 86400000);

  const tombstone = {
    name: state.soul.name,
    personality: state.soul.personality,
    rarity: bones.rarity,
    species: formId,
    emoji: character?.emoji || '',
    nameCn: character?.nameCn || formId,
    hatchedAt: state.soul.hatchedAt,
    retiredAt: Date.now(),
    daysLived: days,
    finalLevel: level,
    finalBond: state.bond || 0,
    finalStats: bones.stats,
    achievements: [...(state.achievements || [])],
    unlocks: [...(state.unlocks || [])],
    petCount: state.petCount || 0,
    totalTurns: state.counters?.totalTurns || 0,
    totalCommits: state.counters?.totalCommits || 0,
  };

  const graveyard = [...(state.graveyard || []), tombstone];

  // 清空主灵魂但保留 unlocks + 墓地 + 累计 counter（让玩家不失去积累）
  updateState({
    soul: null,
    form: null,
    xp: 0,
    bond: 0,
    petCount: 0,
    achievements: [],   // 新伙伴重新收集成就
    chatHistory: [],
    quip: null,
    quipAt: null,
    graveyard,
  });

  console.log('');
  console.log('  ══════════════════════════════════════');
  console.log(`  ${tombstone.emoji} ${tombstone.name} 的传奇`);
  console.log('  ══════════════════════════════════════');
  console.log('');
  console.log(`  陪伴 ${days} 天`);
  console.log(`  最终等级 Lv ${level}`);
  console.log(`  最终亲密度 ♥ ${tombstone.finalBond}/100`);
  console.log(`  累计见证 ${tombstone.totalCommits} 次 commit`);
  console.log(`  累计被摸 ${tombstone.petCount} 次`);
  console.log(`  解锁成就 ${tombstone.achievements.length} 个`);
  console.log('');
  console.log(`  ${state.soul.name}: "再见了，主人。下一只会是谁呢..."`);
  console.log('');
  console.log('  跑 /claude-buddy:buddy 开始新的故事');
  console.log('  跑 /claude-buddy:buddy-graveyard 随时纪念它');
  console.log('');
}

try { main(); } catch (e) {
  console.error('retire error:', e.message);
  process.exit(1);
}
