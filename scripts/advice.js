#!/usr/bin/env node
// /buddy-advice：传说级智慧建议
// 解锁条件：Lv 10+ 或者 bones.rarity === 'legendary'/'epic'
// 让伙伴以自己口吻给一条"实用建议"（而非一般吐槽）

const { spawnSync } = require('child_process');
const { readState } = require('./lib/state.js');
const { roll, companionUserId } = require('./lib/roll.js');
const { computeLevel } = require('./lib/progression.js');
const { getCharacter, currentFormId } = require('./lib/characters.js');

const TIMEOUT_MS = 20000;

function callClaude(prompt) {
  try {
    const r = spawnSync('claude', ['-p', prompt], {
      timeout: TIMEOUT_MS,
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: '', BUDDY_OBSERVER_DISABLE: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (r.error || r.status !== 0) return null;
    return (r.stdout || '').trim();
  } catch (_e) { return null; }
}

function canUnlock(state, bones) {
  const level = computeLevel(state.xp || 0);
  if (level >= 10) return true;
  if (['legendary', 'epic'].includes(bones.rarity)) return true;
  return false;
}

function main() {
  const userQuestion = process.argv.slice(2).join(' ').trim();
  const state = readState();

  if (!state.soul) {
    console.log('  你还没孵化伙伴');
    return;
  }

  const bones = roll(companionUserId());
  if (!canUnlock(state, bones)) {
    const level = computeLevel(state.xp || 0);
    console.log(`  ${state.soul.name} 还不够资格给你"建议"`);
    console.log(`  解锁：Lv 10 或 epic/legendary 稀有度`);
    console.log(`  当前：Lv ${level} · ${bones.rarity}`);
    return;
  }

  const formId = currentFormId(state, bones.species);
  const character = getCharacter(formId);

  const prompt = `你叫"${state.soul.name}"，一只修炼已久的 ${bones.rarity} 级 ${character ? character.nameCn : formId}。
你的性格：${state.soul.personality}
你的特长：${Object.entries(bones.stats).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>`${k}=${v}`).join(', ')}

主人问你：${userQuestion || '该怎么走接下来？'}

请以"${state.soul.name}"的身份给出**一条真正有用的建议**（不是废话也不是客套）。
格式要求：
1. 开头一句话点明建议（≤30 字）
2. 再用 1-2 句展开为什么
3. 保持你的说话风格
4. 全程中文，不超过 150 字

只输出正文，不要题头不要格式化。`;

  console.log('');
  console.log(`  ⚡ ${state.soul.name} 正在沉思...`);
  console.log('');
  const reply = callClaude(prompt);

  if (!reply) {
    console.log(`  ${state.soul.name}: ...说不出来。可能 claude -p 没响应。`);
    return;
  }

  console.log('  ╔══════════════════════════════════════╗');
  console.log(`  ║  ${state.soul.name} 的建议`);
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  for (const line of reply.split('\n')) {
    console.log('  ' + line);
  }
  console.log('');
}

try { main(); } catch (e) {
  console.error('advice error:', e.message);
  process.exit(1);
}
