#!/usr/bin/env node
// /buddy-voice：调试/预览当前伙伴"说什么"的全栈状态
// 显示：心情 · 缓冲里还有啥 · 最近 quip 来源分布 · 强制触发一条

const { readState } = require('./lib/state.js');
const { moodBadge } = require('./lib/mood.js');
const { readBuffer } = require('./lib/quip-buffer.js');

function main() {
  const state = readState();
  if (!state.soul) {
    console.log('  还没孵化伙伴');
    return;
  }

  const mood = moodBadge(state);
  const buffer = readBuffer(state);
  const now = Date.now();

  console.log('');
  console.log(`  🎤 ${state.soul.name} 的声音 · 诊断`);
  console.log('');
  console.log(`  当前心情：${mood.emoji} ${mood.label}`);
  console.log(`  最近情绪：${state.lastMood || '(无)'}`);
  console.log(`  已亲密度：${state.bond || 0}/100`);
  console.log('');

  console.log(`  📦 LLM 缓冲（${buffer.length} 条）：`);
  if (buffer.length === 0) {
    console.log('    (空——下次说话会同步调 claude -p，同时触发后台补)');
  } else {
    for (let i = 0; i < buffer.length; i++) {
      const e = buffer[i];
      const ageMin = Math.floor((now - e.at) / 60000);
      console.log(`    ${i + 1}. [${e.mood}] "${e.quip}"  (${ageMin} 分钟前生成)`);
    }
  }
  console.log('');

  if (state.quip) {
    const ageS = Math.floor((now - (state.quipAt || now)) / 1000);
    console.log(`  💬 最新 quip：`);
    console.log(`     "${state.quip}"`);
    console.log(`     来源：${state.quipSource || 'unknown'}  ·  ${ageS} 秒前`);
  }
  console.log('');
  console.log('  tip：');
  console.log('    开 BUDDY_DEBUG=1 跑 Claude Code 看 observer/refill 错误');
  console.log('    cat ~/.claude/buddy-state.json 看 quipBuffer 字段');
  console.log('');
}

try { main(); } catch (e) {
  console.error('voice error:', e.message);
  process.exit(1);
}
