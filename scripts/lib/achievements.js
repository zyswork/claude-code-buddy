// 成就系统：6 个基础成就
// 每个成就是：id / 中文名 / 描述 / 触发检测函数
// check(state) 返回 true 表示应解锁（state.achievements[] 存已解锁 id）

const ACHIEVEMENTS = [
  {
    id: 'first_hatch',
    name: '初遇',
    desc: '第一次孵化伙伴',
    check: (s) => !!s.soul,
  },
  {
    id: 'first_week',
    name: '七日同行',
    desc: '陪你满 7 天',
    check: (s) => s.soul && (Date.now() - s.soul.hatchedAt) >= 7 * 86400000,
  },
  {
    id: 'hundred_pets',
    name: '捧在手心',
    desc: '累计摸摸 100 次',
    check: (s) => (s.petCount || 0) >= 100,
  },
  {
    id: 'ten_commits',
    name: '见证者',
    desc: '目睹 10 次 git commit',
    check: (s) => (s.counters?.totalCommits || 0) >= 10,
  },
  {
    id: 'apocalypse_witness',
    name: '末日目击',
    desc: '目睹一次 rm -rf',
    check: (s) => (s.counters?.rmRfSightings || 0) >= 1,
  },
  {
    id: 'first_levelup',
    name: '初次进阶',
    desc: '首次升级',
    check: (s) => {
      const { computeLevel } = require('./progression.js');
      return computeLevel(s.xp || 0) >= 2;
    },
  },
];

function getAchievement(id) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

// 扫描所有成就，返回 newly unlocked id 数组
function checkAll(state) {
  const already = new Set(state.achievements || []);
  const newlyUnlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (already.has(a.id)) continue;
    try {
      if (a.check(state)) newlyUnlocked.push(a.id);
    } catch (_e) { /* 检测函数不该抛，保险起见 */ }
  }
  return newlyUnlocked;
}

module.exports = { ACHIEVEMENTS, getAchievement, checkAll };
