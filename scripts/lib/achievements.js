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

  // ─── v0.5 扩展成就 ───
  {
    id: 'commit_centurion',
    name: 'Commit 百人队长',
    desc: '目睹 100 次 git commit',
    check: (s) => (s.counters?.totalCommits || 0) >= 100,
  },
  {
    id: 'apocalypse_survivor',
    name: '末日幸存者',
    desc: '目睹 10 次 rm -rf',
    check: (s) => (s.counters?.rmRfSightings || 0) >= 10,
  },
  {
    id: 'first_month',
    name: '月光陪伴',
    desc: '陪你满 30 天',
    check: (s) => s.soul && (Date.now() - s.soul.hatchedAt) >= 30 * 86400000,
  },
  {
    id: 'lv_10',
    name: '修行者',
    desc: '达到 Lv 10',
    check: (s) => {
      const { computeLevel } = require('./progression.js');
      return computeLevel(s.xp || 0) >= 10;
    },
  },
  {
    id: 'evolved_1',
    name: '成年礼',
    desc: '进化到成年形态',
    check: (s) => {
      const { computeLevel, computeEvolution } = require('./progression.js');
      return computeEvolution(computeLevel(s.xp || 0), s.bond || 0) >= 1;
    },
  },
  {
    id: 'hidden_collector',
    name: '收集家',
    desc: '解锁 3 只隐藏角色',
    check: (s) => (s.unlocks || []).length >= 3,
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
