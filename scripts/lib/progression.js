// 成长系统：等级曲线 / XP 累积 / 进化判定 / 亲密度
// 纯函数，无 I/O

// 升到 Lv n+1 需要累计 XP = 10 * n^1.5 向上取整
// Lv 1→2 需要 10；Lv 2→3 约 28；Lv 5→6 约 112；Lv 20→21 约 894
function xpForNextLevel(level) {
  if (level <= 0) return 10;
  return Math.ceil(10 * Math.pow(level, 1.5));
}

// 累计 XP 能到的最高等级（已消耗的 XP 不会倒扣）
// 简化做法：xp 是"总累计"，level 是"已达到"，通过累加计算
function computeLevel(totalXp) {
  let level = 1;
  let cumul = 0;
  while (true) {
    const need = xpForNextLevel(level);
    if (cumul + need > totalXp) break;
    cumul += need;
    level += 1;
    if (level > 99) break;
  }
  return level;
}

// 当前等级已累计多少 / 升下一级还差多少
function xpProgress(totalXp) {
  const level = computeLevel(totalXp);
  let consumed = 0;
  for (let i = 1; i < level; i++) consumed += xpForNextLevel(i);
  const inLevel = totalXp - consumed;
  const nextNeed = xpForNextLevel(level);
  return { level, inLevel, nextNeed, ratio: nextNeed ? inLevel / nextNeed : 0 };
}

// 进化判定
//   Lv >= 5  且 bond >= 30  → 成年（evolution = 1）
//   Lv >= 15 且 bond >= 80  → 进化态（evolution = 2）
function computeEvolution(level, bond) {
  if (level >= 15 && bond >= 80) return 2;
  if (level >= 5 && bond >= 30) return 1;
  return 0;
}

const EVOLUTION_LABELS = { 0: '幼年', 1: '成年', 2: '进化态' };

// 事件 → XP / bond 奖励
const REWARDS = {
  turn: { xp: 1, bond: 0 },         // 每轮对话
  pet: { xp: 1, bond: 2 },          // 摸摸
  commit: { xp: 3, bond: 0 },       // git commit
  debug: { xp: 5, bond: 1 },        // 修 bug
  rm_rf: { xp: 10, bond: 0 },       // 目睹 rm -rf
  dailyLogin: { xp: 2, bond: 1 },   // 每日首次
};

// 累加一次事件，返回更新后的 { xp, bond, leveledUp, evolved, ... }
function applyReward(state, eventName) {
  const reward = REWARDS[eventName];
  if (!reward) return { changed: false };

  const oldXp = state.xp || 0;
  const oldBond = state.bond || 0;
  const oldLevel = computeLevel(oldXp);
  const oldEvo = computeEvolution(oldLevel, oldBond);

  const newXp = oldXp + reward.xp;
  const newBond = Math.min(100, oldBond + reward.bond);
  const newLevel = computeLevel(newXp);
  const newEvo = computeEvolution(newLevel, newBond);

  return {
    changed: true,
    xp: newXp,
    bond: newBond,
    level: newLevel,
    evolution: newEvo,
    leveledUp: newLevel > oldLevel,
    evolved: newEvo > oldEvo,
    xpDelta: reward.xp,
    bondDelta: reward.bond,
  };
}

// 升级 quip 池（塞进 state.quip 让下一次 statusline 显示）
const LEVEL_UP_QUIPS = [
  '升级啦！',
  '我更强了！',
  '等级 +1 ✨',
  '变厉害了',
  '有长进',
];

const EVOLUTION_QUIPS = {
  1: ['我长大了！', '成年啦，稳重多了', '今天起不再是小孩'],
  2: ['进化完成！', '我变成另一种存在了', '彻底蜕变 ✧'],
};

function pickLevelUpQuip() {
  return LEVEL_UP_QUIPS[Math.floor(Math.random() * LEVEL_UP_QUIPS.length)];
}

function pickEvolutionQuip(stage) {
  const pool = EVOLUTION_QUIPS[stage] || EVOLUTION_QUIPS[1];
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = {
  xpForNextLevel,
  computeLevel,
  xpProgress,
  computeEvolution,
  EVOLUTION_LABELS,
  REWARDS,
  applyReward,
  pickLevelUpQuip,
  pickEvolutionQuip,
};
