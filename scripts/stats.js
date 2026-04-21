#!/usr/bin/env node
// /buddy-stats：按时间窗聚合事件统计
// 今日 / 本周 / 总计 三档，每档显示主要事件计数

const { readEvents, filterSince, WINDOWS } = require('./lib/events.js');

const KEY_TYPES = [
  { type: 'turn_end',             label: '💬 对话轮次' },
  { type: 'pet',                  label: '❤  摸摸' },
  { type: 'bash_commit',          label: '✅ git commit' },
  { type: 'debug_keyword',        label: '🐛 debug 自述' },
  { type: 'bash_rm_rf',           label: '💥 rm -rf' },
  { type: 'night_visit',          label: '🌑 深夜造访' },
  { type: 'levelup',              label: '⬆  升级' },
  { type: 'achievement_unlocked', label: '🏆 成就' },
  { type: 'character_unlocked',   label: '✨ 发现角色' },
  { type: 'konami',               label: '🔮 密语' },
];

function countByType(events) {
  const counts = {};
  for (const e of events) counts[e.type] = (counts[e.type] || 0) + 1;
  return counts;
}

function bar(n, max, width = 16) {
  if (max === 0) return '';
  const filled = Math.round((n / max) * width);
  return '█'.repeat(filled) + '░'.repeat(Math.max(0, width - filled));
}

function renderWindow(title, events) {
  const counts = countByType(events);
  const rows = KEY_TYPES.map(({ type, label }) => ({ label, n: counts[type] || 0 }));
  const maxN = Math.max(1, ...rows.map((r) => r.n));

  console.log(`  ${title}`);
  console.log('');
  for (const r of rows) {
    if (r.n === 0) continue;
    console.log(`    ${r.label.padEnd(14)}  ${bar(r.n, maxN)}  ${r.n}`);
  }
  const totalEvents = events.length;
  if (totalEvents === 0) console.log('    （无事件）');
  console.log('');
}

function main() {
  const all = readEvents(10000);

  console.log('');
  console.log('  📊 统计报告');
  console.log('');
  renderWindow('【今日】', filterSince(all, WINDOWS.day));
  renderWindow('【本周】', filterSince(all, WINDOWS.week));
  renderWindow('【总计】', all);

  console.log(`  事件总数：${all.length}`);
  console.log(`  日志：~/.claude/buddy-events.jsonl`);
  console.log('');
}

try { main(); } catch (e) {
  console.error('stats error:', e.message);
  process.exit(1);
}
