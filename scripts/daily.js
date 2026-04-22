#!/usr/bin/env node
// /buddy-daily：每日 3 个任务，全部完成给大奖励
// 任务每天凌晨刷新（按本地日期）
// 用法：
//   node daily.js          → 显示今日任务 + 进度
//   node daily.js claim    → 领取完成奖励

const { readState, updateState } = require('./lib/state.js');
const { applyReward } = require('./lib/progression.js');
const { runChecks } = require('./lib/progress-check.js');
const { mulberry32, hashString } = require('./lib/roll.js');

const TASK_POOL = [
  { id: 'pet_once',      label: '摸一下伙伴',       check: (s, snap) => (s.petCount || 0) > snap.petCount },
  { id: 'pet_three',     label: '摸伙伴 3 次',      check: (s, snap) => (s.petCount || 0) >= snap.petCount + 3 },
  { id: 'chat_once',     label: '跟伙伴说一句话',   check: (s, snap) => (s.chatHistory?.length || 0) > snap.chatLen },
  { id: 'commit_once',   label: '做一次 git commit', check: (s, snap) => (s.counters?.totalCommits || 0) > snap.commits },
  { id: 'one_turn',      label: '完成一轮对话',     check: (s, snap) => (s.counters?.totalTurns || 0) > snap.turns + 1 },
  { id: 'rename_try',    label: '给伙伴改一次名',   check: (s, snap) => (s.hiddenProgress?.nameChanges || 0) > snap.renames },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function snapshotState(s) {
  return {
    petCount: s.petCount || 0,
    chatLen: s.chatHistory?.length || 0,
    commits: s.counters?.totalCommits || 0,
    turns: s.counters?.totalTurns || 0,
    renames: s.hiddenProgress?.nameChanges || 0,
  };
}

function pickThreeTasks(seedStr) {
  // 用日期 + userId 当种子，mulberry32 保证每天稳定、人人不同、种子为 0 也安全
  const rng = mulberry32(hashString(seedStr || 'anon-default-seed'));
  const pool = [...TASK_POOL];
  const picked = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

function renderBar(done, total) {
  return '[' + '█'.repeat(done) + '░'.repeat(total - done) + ']';
}

function ensureTodayTasks(state) {
  const today = todayStr();
  if (state.daily?.date === today) {
    return state.daily;
  }
  // 新一天，重新抽任务
  const tasks = pickThreeTasks(today + (state.soul?.name || 'anon')).map((t) => ({
    id: t.id,
    label: t.label,
    done: false,
  }));
  const daily = {
    date: today,
    tasks,
    snapshot: snapshotState(state),
    bonusClaimed: false,
  };
  updateState({ daily });
  return daily;
}

function checkProgress(state) {
  const daily = ensureTodayTasks(state);
  let anyNew = false;
  for (const t of daily.tasks) {
    if (t.done) continue;
    const def = TASK_POOL.find((x) => x.id === t.id);
    if (!def) continue;
    if (def.check(state, daily.snapshot)) {
      t.done = true;
      anyNew = true;
    }
  }
  if (anyNew) updateState({ daily });
  return daily;
}

function main() {
  const state = readState();
  if (!state.soul) {
    console.log('  你还没孵化伙伴');
    return;
  }

  const action = process.argv[2];
  const daily = checkProgress(state);
  const doneCount = daily.tasks.filter((t) => t.done).length;
  const allDone = doneCount === daily.tasks.length;

  console.log('');
  console.log(`  📅 今日任务  ${daily.date}`);
  console.log(`  ${renderBar(doneCount, daily.tasks.length)}  ${doneCount}/${daily.tasks.length}`);
  console.log('');
  for (const t of daily.tasks) {
    console.log(`  ${t.done ? '✅' : '⬜'} ${t.label}`);
  }
  console.log('');

  if (action === 'claim') {
    if (!allDone) {
      console.log('  还没全部完成呢，继续加油。');
      return;
    }
    if (daily.bonusClaimed) {
      console.log('  今日奖励已领取。明天再来。');
      return;
    }
    const reward = applyReward(state, 'turn'); // 用 turn reward 结构再手动放大
    const bonusXp = 50;
    const bonusBond = 5;
    const newXp = (state.xp || 0) + bonusXp;
    const newBond = Math.min(100, (state.bond || 0) + bonusBond);
    daily.bonusClaimed = true;

    // 跑检查
    const merged = { ...state, xp: newXp, bond: newBond, daily };
    const checkResult = runChecks(merged);

    updateState({
      xp: newXp,
      bond: newBond,
      daily,
      unlocks: merged.unlocks,
      achievements: merged.achievements,
      quip: merged.quip || `今日任务全清 +${bonusXp} XP +${bonusBond} ♥`,
      quipAt: Date.now(),
    });

    console.log(`  🎉 奖励发放：+${bonusXp} XP · +${bonusBond} ♥`);
    for (const n of checkResult.notifications) console.log('  ' + n);
    return;
  }

  if (allDone && !daily.bonusClaimed) {
    console.log('  🎉 今日全部完成！跑 /claude-buddy:buddy-daily claim 领奖励');
  }
}

try { main(); } catch (e) {
  console.error('daily error:', e.message);
  process.exit(1);
}
