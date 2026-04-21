#!/usr/bin/env node
// /buddy-hint：给一条最接近解锁的线索

const { readState } = require('./lib/state.js');
const { nextClosest, UNLOCK_RULES } = require('./lib/unlocks.js');
const { getCharacter } = require('./lib/characters.js');

function main() {
  const state = readState();
  if (!state.soul) {
    console.log('  你还没孵化伙伴，跑 /claude-buddy:buddy');
    return;
  }

  const totalHidden = Object.keys(UNLOCK_RULES).length;
  const unlockedHidden = (state.unlocks || []).length;

  if (unlockedHidden >= totalHidden) {
    console.log('  ✨ 你已经找齐了所有隐藏角色 (' + unlockedHidden + '/' + totalHidden + ')');
    console.log('  真正的传说是你。');
    return;
  }

  const next = nextClosest(state);
  if (!next) {
    console.log('  好像... 没有进度可追了。继续玩，新的线索会自己出现。');
    return;
  }

  const char = getCharacter(next.id);
  const emoji = char?.emoji || '?';
  const percent = Math.floor(next.ratio * 100);

  console.log('');
  console.log(`  线索：${next.label}  ${next.current}/${next.target}  (${percent}%)`);
  if (char && char.pool !== 'myth' && !char.hidden) {
    // 非神秘型可以稍微多透露一点
    console.log(`  目标：${emoji} ${char.nameCn}`);
  } else {
    console.log(`  目标：${emoji} ???`);
  }
  console.log(`  进度：${unlockedHidden}/${totalHidden} 隐藏角色已解锁`);
  console.log('');
}

try { main(); } catch (e) {
  console.error('hint error:', e.message);
  process.exit(1);
}
