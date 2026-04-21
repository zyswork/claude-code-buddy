#!/usr/bin/env node
// /buddy-skill：每升一级送 1 技能点，分配到 DEBUGGING / PATIENCE / CHAOS / WISDOM / SNARK
// 用法：
//   node skill.js                         查看
//   node skill.js 调试力 3                 投入 3 点到调试力
//   node skill.js 毒舌度 -1                收回 1 点
//   node skill.js reset                   全部重置

const { readState, updateState } = require('./lib/state.js');
const { xpProgress } = require('./lib/progression.js');
const { STAT_NAMES, STAT_NAMES_CN } = require('./lib/types.js');
const { roll, companionUserId } = require('./lib/roll.js');

// 中文名 → 英文 key
const CN_TO_KEY = {};
for (const k of STAT_NAMES) CN_TO_KEY[STAT_NAMES_CN[k]] = k;

function totalAvailable(level, alloc) {
  const spent = Object.values(alloc).reduce((a, b) => a + b, 0);
  return level - spent;
}

function bar(n, cap = 20) {
  return '█'.repeat(Math.max(0, Math.min(n, cap))) + '░'.repeat(Math.max(0, cap - n));
}

function main() {
  const state = readState();
  if (!state.soul) {
    console.log('  你还没孵化伙伴');
    return;
  }

  const prog = xpProgress(state.xp || 0);
  const alloc = state.skillAlloc || {};
  for (const k of STAT_NAMES) if (!(k in alloc)) alloc[k] = 0;
  const available = totalAvailable(prog.level, alloc);
  const bones = roll(companionUserId());

  const args = process.argv.slice(2);
  const first = args[0];

  // reset
  if (first === 'reset') {
    updateState({ skillAlloc: Object.fromEntries(STAT_NAMES.map((k) => [k, 0])) });
    console.log(`  所有技能点已回收。你现在有 ${prog.level} 点可用。`);
    return;
  }

  // 无参数：展示
  if (!first) {
    console.log('');
    console.log(`  🌳 技能树  ·  可用点数：${available}  (已升 Lv ${prog.level})`);
    console.log('');
    for (const k of STAT_NAMES) {
      const base = bones.stats[k];
      const add = alloc[k] || 0;
      const final = Math.min(100, base + add);
      const name = STAT_NAMES_CN[k];
      console.log(`  ${name.padEnd(4)}  ${bar(Math.round(final / 5))}  ${base}${add ? `+${add}=${final}` : ''}`);
    }
    console.log('');
    console.log('  加点：/claude-buddy:buddy-skill <属性中文名> <数量>');
    console.log('  例如：/claude-buddy:buddy-skill 调试力 2');
    console.log('  重置：/claude-buddy:buddy-skill reset');
    console.log('');
    return;
  }

  // 加/减点
  const statKey = CN_TO_KEY[first];
  if (!statKey) {
    console.log(`  没这个属性："${first}"。可用：${STAT_NAMES.map((k) => STAT_NAMES_CN[k]).join(' / ')}`);
    return;
  }
  const amount = parseInt(args[1], 10);
  if (!Number.isFinite(amount) || amount === 0) {
    console.log('  数量必须是非零整数，比如 2 或 -1');
    return;
  }

  const current = alloc[statKey] || 0;
  if (amount > 0 && amount > available) {
    console.log(`  点数不够（需要 ${amount}，只有 ${available}）`);
    return;
  }
  if (amount < 0 && Math.abs(amount) > current) {
    console.log(`  回收不能超过已投入（已投 ${current}）`);
    return;
  }

  const next = current + amount;
  alloc[statKey] = next;
  updateState({ skillAlloc: alloc });

  console.log('');
  console.log(`  ${STAT_NAMES_CN[statKey]}  ${current} → ${next}  (剩余 ${available - amount} 点)`);
  const base = bones.stats[statKey];
  console.log(`  最终属性：${base} + ${next} = ${Math.min(100, base + next)}`);
  console.log('');
}

try { main(); } catch (e) {
  console.error('skill error:', e.message);
  process.exit(1);
}
