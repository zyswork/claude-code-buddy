#!/usr/bin/env node
// /buddy-graveyard：墓地——所有已退休伙伴的纪念册

const { readState } = require('./lib/state.js');
const { RARITY_STARS } = require('./lib/types.js');

function main() {
  const state = readState();
  const graveyard = state.graveyard || [];

  if (graveyard.length === 0) {
    console.log('');
    console.log('  墓地空空。');
    console.log('  等你的伙伴到 Lv 99 后可以选择让它退休，它会被纪念在这里。');
    console.log('');
    return;
  }

  console.log('');
  console.log(`  🕯  墓地  ·  ${graveyard.length} 位传说伙伴`);
  console.log('');

  for (const t of graveyard) {
    const stars = RARITY_STARS[t.rarity] || '';
    const fmt = new Date(t.hatchedAt).toISOString().slice(0, 10);
    const ret = new Date(t.retiredAt).toISOString().slice(0, 10);
    console.log(`  ╭─────────────────────────────────────`);
    console.log(`  │  ${stars} ${t.emoji} ${t.name}  · ${t.nameCn}`);
    console.log(`  │  ${fmt} → ${ret}  (陪伴 ${t.daysLived} 天)`);
    console.log(`  │  Lv ${t.finalLevel}  ♥ ${t.finalBond}/100  ·  ${t.totalCommits} commit  ·  被摸 ${t.petCount} 次`);
    if (t.personality) {
      console.log(`  │  "${t.personality.slice(0, 60)}${t.personality.length > 60 ? '...' : ''}"`);
    }
    console.log(`  │  成就 ${t.achievements.length} 个  ·  解锁隐藏 ${t.unlocks.length} 只`);
    console.log(`  ╰─────────────────────────────────────`);
    console.log('');
  }
}

try { main(); } catch (e) {
  console.error('graveyard error:', e.message);
  process.exit(1);
}
