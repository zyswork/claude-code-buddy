#!/usr/bin/env node
// 图鉴：按池分组展示所有物种 + 解锁状态
// 用法：
//   node dex.js            → 完整图鉴
//   node dex.js --pool starter → 只看某池

const {
  POOLS, POOL_LABELS, listByPool, getCharacter, isUnlocked, currentFormId,
} = require('./lib/characters.js');
const { roll, companionUserId } = require('./lib/roll.js');
const { readState } = require('./lib/state.js');
const { RARITY_STARS, RARITY_COLORS, RESET_COLOR, BOLD } = require('./lib/types.js');

function main() {
  const args = process.argv.slice(2);
  const poolFilter = args[args.indexOf('--pool') + 1];

  const state = readState();
  const bones = roll(companionUserId());
  const formId = currentFormId(state, bones.species);

  console.log('');
  console.log(`  ${BOLD}🏛  图鉴${RESET_COLOR}`);
  console.log('');

  for (const pool of POOLS) {
    if (poolFilter && pool !== poolFilter) continue;

    const chars = listByPool(pool);
    if (chars.length === 0 && pool !== 'starter') continue;  // 空池跳过

    const label = POOL_LABELS[pool];
    const unlockedCount = chars.filter((c) => isUnlocked(c, state)).length;
    const total = chars.length;

    console.log(`  ${BOLD}【${label}】${RESET_COLOR} ${unlockedCount}/${total || '?'}`);

    if (chars.length === 0) {
      console.log('    ???  （尚未开启）');
      console.log('');
      continue;
    }

    for (const c of chars) {
      const unlocked = isUnlocked(c, state);
      const isCurrent = c.id === formId;

      if (unlocked) {
        const mark = isCurrent ? '● ' : '  ';
        const suffix = isCurrent ? '  ← 当前' : '';
        console.log(`    ${mark}${c.emoji} ${c.nameCn}${suffix}`);
      } else {
        const hint = c.unlockHint ? `（${c.unlockHint}）` : '';
        console.log(`      ❓ ??? ${hint}`);
      }
    }
    console.log('');
  }

  console.log(`  ${BOLD}切换形态${RESET_COLOR}：/claude-buddy:buddy-swap <名字>`);
  console.log(`  ${BOLD}恢复本体${RESET_COLOR}：/claude-buddy:buddy-swap`);
  console.log('');
}

try { main(); } catch (e) {
  console.error('dex error:', e.message);
  process.exit(1);
}
