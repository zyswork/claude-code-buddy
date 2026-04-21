#!/usr/bin/env node
// /buddy-teach "事实或约定"：教伙伴记住一件事，最多保留 10 条
// 它会在 chat / advice / roast 时把这些事实带进 prompt

const { readState, updateState } = require('./lib/state.js');

const MAX_MEMORIES = 10;

function main() {
  const fact = process.argv.slice(2).join(' ').trim();
  const state = readState();

  if (!state.soul) {
    console.log('  你还没孵化伙伴');
    return;
  }

  if (!fact) {
    const memories = state.soul?.memories || [];
    console.log('');
    if (memories.length === 0) {
      console.log(`  ${state.soul.name} 还什么都不记得。`);
      console.log(`  用法：/claude-buddy:buddy-teach "我叫小明" 或 "我是 Go 程序员"`);
    } else {
      console.log(`  ${state.soul.name} 记得：`);
      for (let i = 0; i < memories.length; i++) {
        console.log(`  ${i + 1}. ${memories[i]}`);
      }
    }
    console.log('');
    return;
  }

  if (fact === 'clear' || fact === '清空') {
    updateState({
      soul: { ...state.soul, memories: [] },
    });
    console.log(`  ${state.soul.name}: "...我好像忘了什么。"`);
    return;
  }

  const memories = [...(state.soul?.memories || []), fact].slice(-MAX_MEMORIES);
  updateState({
    soul: { ...state.soul, memories },
  });

  console.log(`  ${state.soul.name} 记住了：${fact}`);
  console.log(`  （累计记忆 ${memories.length}/${MAX_MEMORIES}）`);
}

try { main(); } catch (e) {
  console.error('teach error:', e.message);
  process.exit(1);
}
