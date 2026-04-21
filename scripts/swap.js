#!/usr/bin/env node
// 切换当前形态
// 用法：
//   node swap.js              → 恢复本体（state.form = null）
//   node swap.js 小狐妖       → 按中文名切
//   node swap.js rabbit       → 按 id 切
//   node swap.js 🐰           → 按 emoji 切

const {
  CHARACTERS, allCharacters, isUnlocked,
} = require('./lib/characters.js');
const { roll, companionUserId } = require('./lib/roll.js');
const { readState, updateState } = require('./lib/state.js');

// 模糊匹配：id / nameCn / emoji 三路
function findCharacter(query) {
  if (!query) return null;
  const q = query.trim();
  for (const c of allCharacters()) {
    if (c.id === q || c.nameCn === q || c.emoji === q) return c;
  }
  // 兜底：startsWith 匹配
  for (const c of allCharacters()) {
    if (c.nameCn.startsWith(q)) return c;
  }
  return null;
}

function main() {
  const query = process.argv.slice(2).join(' ').trim();
  const state = readState();
  const bones = roll(companionUserId());

  if (!state.soul) {
    console.log('你还没孵化伙伴，先跑 /claude-buddy:buddy');
    return;
  }

  // 空参数 = 回本体
  if (!query) {
    updateState({ form: null });
    const defaultChar = CHARACTERS[bones.species];
    const emoji = defaultChar ? defaultChar.emoji : '✨';
    const name = defaultChar ? defaultChar.nameCn : bones.species;
    console.log(`  ${emoji} ${state.soul.name} 回到本体（${name}）`);
    return;
  }

  const target = findCharacter(query);
  if (!target) {
    console.log(`  没找到 "${query}" 这个物种。跑 /claude-buddy:buddy-dex 看图鉴。`);
    return;
  }

  if (!isUnlocked(target, state)) {
    console.log(`  ${target.emoji} ${target.nameCn} 还没解锁。`);
    if (target.unlockHint) {
      console.log(`  解锁条件：${target.unlockHint}`);
    } else {
      console.log(`  它是个秘密。继续玩，它会在某天出现。`);
    }
    return;
  }

  updateState({ form: target.id });
  console.log(`  ${target.emoji} ${state.soul.name} 变身 → ${target.nameCn}`);
  console.log(`  ${state.soul.name} 的灵魂未变，只是换了件衣服。`);
}

try { main(); } catch (e) {
  console.error('swap error:', e.message);
  process.exit(1);
}
