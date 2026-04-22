#!/usr/bin/env node
// /buddy-mute：静音 / 取消静音
// 无参数或 "off" → 静音；"on" → 取消静音

const { readState, updateState } = require('./lib/state.js');

function main() {
  const arg = (process.argv.slice(2).join(' ') || '').trim().toLowerCase();
  const state = readState();
  if (!state.soul) {
    console.log('  还没孵化伙伴');
    return;
  }
  const muted = arg !== 'on';
  updateState({ muted });
  console.log(muted ? `  ${state.soul.name} 闭嘴了 🤐` : `  ${state.soul.name} 开始说话了 💬`);
}

try { main(); } catch (e) {
  console.error('mute error:', e.message);
  process.exit(1);
}
