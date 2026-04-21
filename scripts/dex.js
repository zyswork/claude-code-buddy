#!/usr/bin/env node
// 图鉴：按池分组展示所有物种 + 解锁状态
// 用法：
//   node dex.js            → 完整图鉴
//   node dex.js --pool starter → 只看某池

const {
  POOLS, POOL_LABELS, listByPool, getCharacter, isUnlocked, currentFormId, allCharacters,
} = require('./lib/characters.js');
const { roll, companionUserId } = require('./lib/roll.js');
const { readState } = require('./lib/state.js');
const { renderSprite } = require('./lib/sprites.js');
const { UNLOCK_RULES } = require('./lib/unlocks.js');
const { RARITY_STARS, RARITY_COLORS, RESET_COLOR, BOLD } = require('./lib/types.js');

function findCharacterByName(query) {
  for (const c of allCharacters()) {
    if (c.id === query || c.nameCn === query || c.emoji === query) return c;
  }
  for (const c of allCharacters()) {
    if (c.nameCn.startsWith(query)) return c;
  }
  return null;
}

function renderDetail(state, bones, target) {
  const unlocked = isUnlocked(target, state);
  const rule = UNLOCK_RULES[target.id];
  console.log('');
  console.log(`  ${target.emoji}  ${BOLD}${target.nameCn}${RESET_COLOR}  · ${target.id}`);
  console.log(`  池：${POOL_LABELS[target.pool]}  ·  ${unlocked ? '已解锁' : '未解锁'}`);
  console.log('');

  if (unlocked) {
    const sprite = renderSprite({ species: target.id, eye: bones.eye, hat: 'none' }, 0);
    for (const s of sprite) console.log('  ' + s);
    console.log('');
  } else {
    console.log('  （还没见过的样子）');
    console.log('');
  }

  if (target.lore) {
    console.log(`  📖 ${target.lore}`);
    console.log('');
  }

  if (!unlocked) {
    if (target.unlockHint) {
      console.log(`  解锁线索：${target.unlockHint}`);
    } else {
      console.log(`  解锁条件：神秘`);
    }
    if (rule?.progress) {
      const p = rule.progress(state);
      const pct = Math.floor((p.current / p.target) * 100);
      console.log(`  进度：${p.current}/${p.target} (${pct}%) · ${p.label}`);
    }
    console.log('');
  }
}

function main() {
  const args = process.argv.slice(2);
  const detailIdx = args.indexOf('--detail');
  const poolFilter = args[args.indexOf('--pool') + 1];

  const state = readState();
  const bones = roll(companionUserId());
  const formId = currentFormId(state, bones.species);

  // --detail <名字>
  if (detailIdx >= 0) {
    const name = args[detailIdx + 1];
    if (!name) {
      console.log('用法：/claude-buddy:buddy-dex --detail <物种名>');
      return;
    }
    const target = findCharacterByName(name);
    if (!target) {
      console.log(`  没找到 "${name}"。试试中文名 / emoji / id。`);
      return;
    }
    renderDetail(state, bones, target);
    return;
  }

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
