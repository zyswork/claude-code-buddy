// 隐藏角色触发引擎
// 每个角色的解锁条件 + 进度计算 + 剩余提示
// check(state) 返回 true → 应解锁
// progress(state) 返回 { current, target, label } → 用于 /buddy-hint

const UNLOCK_RULES = {
  // ─── 努力型（明示型，可看进度）──────────────────
  yinglong: {
    check: (s) => (s.counters?.totalCommits || 0) >= 100,  // v0.3.2 先降低门槛到 100，方便体验
    progress: (s) => ({
      current: s.counters?.totalCommits || 0,
      target: 100,
      label: '目睹 git commit',
    }),
  },
  jingwei: {
    check: (s) => (s.counters?.totalDebugs || 0) >= 50,
    progress: (s) => ({
      current: s.counters?.totalDebugs || 0,
      target: 50,
      label: '目睹 debug',
    }),
  },

  // ─── 行为型（明示但要门道）──────────────────────
  taotie: {
    check: (s) => (s.petCount || 0) >= 50,
    progress: (s) => ({
      current: s.petCount || 0,
      target: 50,
      label: '累计被摸',
    }),
  },

  // ─── 环境型（条件模糊）──────────────────────────
  zhulong: {
    // 凌晨 2-4 点访问过 3 次（用 hiddenProgress.nightVisits 计数）
    check: (s) => (s.hiddenProgress?.nightVisits || 0) >= 3,
    progress: (s) => ({
      current: s.hiddenProgress?.nightVisits || 0,
      target: 3,
      label: '深夜访问（??? 时段）',
    }),
  },

  // ─── 稀有型（图鉴里只显示 ???）──────────────────
  daji: {
    check: (s) => (s.hiddenProgress?.nameChanges || 0) >= 9,
    progress: (s) => ({
      current: s.hiddenProgress?.nameChanges || 0,
      target: 9,
      label: '???',
    }),
    hidden: true,
  },

  // ─── v0.6.0 第二批 ───
  kappa: {
    check: (s) => (s.hiddenProgress?.diaryCount || 0) >= 3,
    progress: (s) => ({
      current: s.hiddenProgress?.diaryCount || 0,
      target: 3,
      label: '写日记次数',
    }),
  },
  phoenix: {
    // 退休过至少一次 = 墓地有记录，然后重新孵化
    check: (s) => (s.graveyard?.length || 0) >= 1 && !!s.soul,
    progress: (s) => ({
      current: (s.graveyard?.length || 0) > 0 && s.soul ? 1 : 0,
      target: 1,
      label: '墓地 + 新伙伴（浴火重生）',
    }),
  },
  cerberus: {
    check: (s) => (s.hiddenProgress?.projectsSeen?.length || 0) >= 3,
    progress: (s) => ({
      current: (s.hiddenProgress?.projectsSeen || []).length,
      target: 3,
      label: '不同项目切换',
    }),
  },
  hydra: {
    check: (s) => (s.hiddenProgress?.debugStreak || 0) >= 3,
    progress: (s) => ({
      current: s.hiddenProgress?.debugStreak || 0,
      target: 3,
      label: '连续 debug 轮数',
    }),
  },
  jiuwei: {
    // 必须先解锁妲己，且妲己解锁后过了 30 天
    check: (s) => {
      if (!s.unlocks?.includes('daji')) return false;
      const dajiAt = s.hiddenProgress?.dajiUnlockedAt;
      if (!dajiAt) return false;
      return (Date.now() - dajiAt) >= 30 * 86400000;
    },
    progress: (s) => {
      const dajiAt = s.hiddenProgress?.dajiUnlockedAt;
      if (!s.unlocks?.includes('daji') || !dajiAt) {
        return { current: 0, target: 1, label: '???' };
      }
      const days = Math.floor((Date.now() - dajiAt) / 86400000);
      return { current: days, target: 30, label: '???' };
    },
    hidden: true,
  },
};

// 扫描所有规则，返回新解锁的角色 id 数组
function checkAll(state) {
  const already = new Set(state.unlocks || []);
  const newly = [];
  for (const [id, rule] of Object.entries(UNLOCK_RULES)) {
    if (already.has(id)) continue;
    try {
      if (rule.check(state)) newly.push(id);
    } catch (_e) { /* 保险 */ }
  }
  return newly;
}

// 找最接近解锁的一只，给 /buddy-hint 用
// 返回 { id, label, current, target, ratio } 或 null
function nextClosest(state) {
  const already = new Set(state.unlocks || []);
  let best = null;
  for (const [id, rule] of Object.entries(UNLOCK_RULES)) {
    if (already.has(id)) continue;
    if (!rule.progress) continue;
    const p = rule.progress(state);
    if (p.target <= 0) continue;
    const ratio = p.current / p.target;
    if (!best || ratio > best.ratio) {
      best = { id, label: p.label, current: p.current, target: p.target, ratio };
    }
  }
  return best;
}

module.exports = { UNLOCK_RULES, checkAll, nextClosest };
